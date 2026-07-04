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
import { WebhookHandlers } from "./lib/webhookHandlers";

const app: Express = express();

// Behind the Replit reverse proxy — trust the first proxy hop so that
// X-Forwarded-For (client IP for geo detection + rate limiting) is honored.
app.set("trust proxy", 1);

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
// The web client is served same-origin through the Replit proxy, so credentialed
// cross-origin requests only ever come from our own domains. Reflecting arbitrary
// origins with credentials would expose authenticated billing/mutation endpoints
// to CSRF, so we enforce a strict allowlist built from the Replit domains.
const allowedOrigins = new Set<string>();
for (const domain of (process.env.REPLIT_DOMAINS ?? "").split(",")) {
  const trimmed = domain.trim();
  if (trimmed) allowedOrigins.add(`https://${trimmed}`);
}
const devDomain = process.env.REPLIT_DEV_DOMAIN?.trim();
if (devDomain) allowedOrigins.add(`https://${devDomain}`);

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      // No Origin header = same-origin request or a non-browser client
      // (curl, server-to-server); those are safe to allow.
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  }),
);

// ─── Stripe webhook (MUST be before express.json — needs the raw body) ────────
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature" });
      return;
    }
    try {
      const sig = Array.isArray(signature) ? signature[0]! : signature;
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (err) {
      const log = (req as any).log ?? logger;
      log.error({ err }, "Stripe webhook processing error");
      res.status(400).json({ error: "Webhook processing error" });
    }
  },
);

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
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const log = (req as any).log ?? logger;
  log.error({ err }, "Unhandled error");
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
