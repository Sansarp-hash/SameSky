import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ─── Security headers ────────────────────────────────────────────────────────
// Disable CSP/COEP so Clerk's hosted scripts and iframes work correctly.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// ─── Logging ─────────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res) { return { statusCode: res.statusCode }; },
    },
  }),
);

// ─── Clerk proxy (must be before rate limiting) ───────────────────────────────
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// ─── CORS ────────────────────────────────────────────────────────────────────
// origin: true reflects the request's Origin header — required for Clerk
// cookie-based auth to work through the Replit proxy.
app.use(cors({ credentials: true, origin: true }));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ─── Rate limiting ────────────────────────────────────────────────────────────
// General API: 120 req / min per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests — please slow down." },
  skip: (req) => req.method === "OPTIONS",
});

// Mutation endpoints (post/put/delete): 30 req / min per IP
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many write requests — please slow down." },
});

// Raffle entry: 5 per minute per IP (prevent spam entries)
const raffleEntryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many raffle entry attempts." },
});

app.use("/api", generalLimiter);
app.use("/api/posts", (req, res, next) => {
  if (req.method === "POST" || req.method === "DELETE") { writeLimiter(req, res, next); return; }
  next();
});
app.use("/api/raffles/:id/enter", raffleEntryLimiter);

// ─── Clerk auth middleware ────────────────────────────────────────────────────
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── Global error handler ─────────────────────────────────────────────────────
// Catches any unhandled errors thrown in route handlers.
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const log = (req as any).log ?? logger;
  log.error({ err }, "Unhandled error");
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
