import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, postsTable, rafflesTable, coinTransactionsTable, notificationsTable } from "@workspace/db";
import { eq, ilike, or, sql, desc } from "drizzle-orm";
import { AdminBanUserBody, AdminAddCoinsBody, AdminListUsersQueryParams } from "@workspace/api-zod";
import { getOrCreateUser } from "./users";

const router = Router();

async function requireAdmin(req: Request, res: Response): Promise<typeof usersTable.$inferSelect | null> {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const user = await getOrCreateUser(clerkId);
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return null;
  }
  return user;
}

router.get("/users", async (req: Request, res: Response) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const params = AdminListUsersQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 50) : 50;
  const search = params.success ? params.data.search : undefined;
  const offset = (page - 1) * limit;

  try {
    let users;
    let total;

    if (search) {
      users = await db
        .select()
        .from(usersTable)
        .where(ilike(usersTable.username, `%${search}%`))
        .orderBy(desc(usersTable.createdAt))
        .limit(limit)
        .offset(offset);
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(usersTable)
        .where(ilike(usersTable.username, `%${search}%`));
      total = Number(countResult[0]?.count ?? 0);
    } else {
      users = await db
        .select()
        .from(usersTable)
        .orderBy(desc(usersTable.createdAt))
        .limit(limit)
        .offset(offset);
      const countResult = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
      total = Number(countResult[0]?.count ?? 0);
    }

    res.json({ users, total, page, limit });
  } catch (err) {
    req.log.error({ err }, "Error listing users");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/users/:userId/ban", async (req: Request, res: Response) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const userId = req.params.userId as string;
  const parsed = AdminBanUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  try {
    let user;
    if (/^\d+$/.test(userId)) {
      user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, parseInt(userId)) });
    } else {
      user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
    }

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [updated] = await db
      .update(usersTable)
      .set({ isBanned: parsed.data.banned, banReason: parsed.data.reason ?? null })
      .where(eq(usersTable.id, user.id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error banning user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/:userId/coins", async (req: Request, res: Response) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const userId = req.params.userId as string;
  const parsed = AdminAddCoinsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  try {
    let user;
    if (/^\d+$/.test(userId)) {
      user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, parseInt(userId)) });
    } else {
      user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
    }

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const newBalance = user.coinBalance + parsed.data.amount;
    await db.update(usersTable).set({ coinBalance: newBalance }).where(eq(usersTable.id, user.id));

    await db.insert(coinTransactionsTable).values({
      userId: user.id,
      amount: Math.abs(parsed.data.amount),
      type: parsed.data.amount >= 0 ? "earn" : "spend",
      description: parsed.data.description,
    });

    await db.insert(notificationsTable).values({
      userId: user.id,
      type: "coin_received",
      title: `GL Coins ${parsed.data.amount >= 0 ? "received" : "deducted"}`,
      message: `${Math.abs(parsed.data.amount)} GL Coins ${parsed.data.amount >= 0 ? "added to" : "removed from"} your account. ${parsed.data.description}`,
    });

    res.json({ userId: user.id, balance: newBalance });
  } catch (err) {
    req.log.error({ err }, "Error adding coins");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats", async (req: Request, res: Response) => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    const [postCount] = await db.select({ count: sql<number>`count(*)` }).from(postsTable);
    const [raffleCount] = await db.select({ count: sql<number>`count(*)` }).from(rafflesTable);

    const now = new Date();
    const raffles = await db.query.rafflesTable.findMany();
    const activeRaffles = raffles.filter(
      (r) => now >= new Date(r.startTime) && now <= new Date(r.endTime)
    ).length;

    const [coinsResult] = await db
      .select({ total: sql<number>`coalesce(sum(amount), 0)` })
      .from(coinTransactionsTable)
      .where(eq(coinTransactionsTable.type, "earn"));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [newUsersToday] = await db
      .select({ count: sql<number>`count(*)` })
      .from(usersTable)
      .where(sql`${usersTable.createdAt} >= ${today}`);
    const [newPostsToday] = await db
      .select({ count: sql<number>`count(*)` })
      .from(postsTable)
      .where(sql`${postsTable.createdAt} >= ${today}`);

    res.json({
      totalUsers: Number(userCount?.count ?? 0),
      totalPosts: Number(postCount?.count ?? 0),
      totalRaffles: Number(raffleCount?.count ?? 0),
      activeRaffles,
      totalCoinsDistributed: Number(coinsResult?.total ?? 0),
      newUsersToday: Number(newUsersToday?.count ?? 0),
      newPostsToday: Number(newPostsToday?.count ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching admin stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
