import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { coinTransactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { ListCoinTransactionsQueryParams } from "@workspace/api-zod";
import { getOrCreateUser } from "./users";

const router = Router();

router.get("/balance", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ userId: user.id, balance: user.coinBalance });
  } catch (err) {
    req.log.error({ err }, "Error fetching coin balance");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/transactions", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const params = ListCoinTransactionsQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const offset = (page - 1) * limit;

  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const transactions = await db.query.coinTransactionsTable.findMany({
      where: eq(coinTransactionsTable.userId, user.id),
      orderBy: [desc(coinTransactionsTable.createdAt)],
      limit,
      offset,
    });
    res.json(transactions);
  } catch (err) {
    req.log.error({ err }, "Error fetching coin transactions");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
