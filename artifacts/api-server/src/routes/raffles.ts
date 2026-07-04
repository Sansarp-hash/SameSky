import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { rafflesTable, raffleEntriesTable, usersTable, coinTransactionsTable, notificationsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { CreateRaffleBody, ListRafflesQueryParams } from "@workspace/api-zod";
import { getOrCreateUser } from "./users";

const router = Router();

function computeStatus(raffle: typeof rafflesTable.$inferSelect): "upcoming" | "active" | "ended" {
  const now = new Date();
  if (now < new Date(raffle.startTime)) return "upcoming";
  if (now > new Date(raffle.endTime)) return "ended";
  return "active";
}

async function enrichRaffle(raffle: typeof rafflesTable.$inferSelect, currentUserId?: number) {
  const status = computeStatus(raffle);
  let winner = null;
  if (raffle.winnerId) {
    winner = await db.query.usersTable.findFirst({ where: eq(usersTable.id, raffle.winnerId) });
  }
  let hasEntered = false;
  if (currentUserId) {
    const entry = await db.query.raffleEntriesTable.findFirst({
      where: and(eq(raffleEntriesTable.raffleId, raffle.id), eq(raffleEntriesTable.userId, currentUserId)),
    });
    hasEntered = !!entry;
  }
  return { ...raffle, status, winner: winner ?? null, hasEntered };
}

router.get("/", async (req: Request, res: Response) => {
  const params = ListRafflesQueryParams.safeParse(req.query);
  const statusFilter = params.success ? params.data.status : undefined;
  const { userId: clerkId } = getAuth(req);
  let currentUser = clerkId ? await getOrCreateUser(clerkId) : null;

  try {
    const raffles = await db.query.rafflesTable.findMany({ orderBy: (r, { desc }) => [desc(r.createdAt)] });
    const enriched = await Promise.all(raffles.map((r) => enrichRaffle(r, currentUser?.id)));

    const filtered = statusFilter ? enriched.filter((r) => r.status === statusFilter) : enriched;
    res.json(filtered);
  } catch (err) {
    req.log.error({ err }, "Error listing raffles");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateRaffleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  try {
    const user = await getOrCreateUser(clerkId);
    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    const [raffle] = await db
      .insert(rafflesTable)
      .values({
        ...parsed.data,
        startTime: new Date(parsed.data.startTime),
        endTime: new Date(parsed.data.endTime),
      })
      .returning();

    const allUsers = await db.query.usersTable.findMany();
    const notifications = allUsers.map((u) => ({
      userId: u.id,
      type: "raffle_started" as const,
      title: "New raffle started!",
      message: `"${raffle.title}" is now live. Entry costs ${raffle.entryCost} GL Coins.`,
      referenceId: raffle.id,
    }));
    if (notifications.length > 0) {
      await db.insert(notificationsTable).values(notifications);
    }

    res.status(201).json(await enrichRaffle(raffle));
  } catch (err) {
    req.log.error({ err }, "Error creating raffle");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:raffleId", async (req: Request, res: Response) => {
  const raffleId = parseInt(req.params.raffleId as string);
  const { userId: clerkId } = getAuth(req);
  let currentUser = clerkId ? await getOrCreateUser(clerkId) : null;

  try {
    const raffle = await db.query.rafflesTable.findFirst({ where: eq(rafflesTable.id, raffleId) });
    if (!raffle) {
      res.status(404).json({ error: "Raffle not found" });
      return;
    }
    res.json(await enrichRaffle(raffle, currentUser?.id));
  } catch (err) {
    req.log.error({ err }, "Error fetching raffle");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:raffleId/enter", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const raffleId = parseInt(req.params.raffleId as string);
  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    const raffle = await db.query.rafflesTable.findFirst({ where: eq(rafflesTable.id, raffleId) });
    if (!raffle) {
      res.status(404).json({ error: "Raffle not found" });
      return;
    }
    const status = computeStatus(raffle);
    if (status !== "active") {
      res.status(400).json({ error: "Raffle is not active" });
      return;
    }
    const existing = await db.query.raffleEntriesTable.findFirst({
      where: and(eq(raffleEntriesTable.raffleId, raffleId), eq(raffleEntriesTable.userId, user.id)),
    });
    if (existing) {
      res.status(400).json({ error: "Already entered this raffle" });
      return;
    }
    if (user.coinBalance < raffle.entryCost) {
      res.status(400).json({ error: "Insufficient GL Coins" });
      return;
    }

    await db
      .update(usersTable)
      .set({ coinBalance: user.coinBalance - raffle.entryCost })
      .where(eq(usersTable.id, user.id));

    await db.insert(coinTransactionsTable).values({
      userId: user.id,
      amount: raffle.entryCost,
      type: "raffle_entry",
      description: `Entered raffle: ${raffle.title}`,
    });

    const [entry] = await db
      .insert(raffleEntriesTable)
      .values({ raffleId, userId: user.id })
      .returning();

    await db
      .update(rafflesTable)
      .set({ entryCount: raffle.entryCount + 1 })
      .where(eq(rafflesTable.id, raffleId));

    res.json({ ...entry, user });
  } catch (err) {
    req.log.error({ err }, "Error entering raffle");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:raffleId/draw", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const raffleId = parseInt(req.params.raffleId as string);
  try {
    const user = await getOrCreateUser(clerkId);
    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    const raffle = await db.query.rafflesTable.findFirst({ where: eq(rafflesTable.id, raffleId) });
    if (!raffle) {
      res.status(404).json({ error: "Raffle not found" });
      return;
    }
    if (raffle.winnerId) {
      res.status(400).json({ error: "Winner already drawn" });
      return;
    }

    const entries = await db.query.raffleEntriesTable.findMany({
      where: eq(raffleEntriesTable.raffleId, raffleId),
    });
    if (entries.length === 0) {
      res.status(400).json({ error: "No entries in this raffle" });
      return;
    }

    const winnerEntry = entries[Math.floor(Math.random() * entries.length)];
    const winner = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, winnerEntry.userId),
    });

    await db.update(rafflesTable).set({ winnerId: winnerEntry.userId, status: "ended" }).where(eq(rafflesTable.id, raffleId));

    if (winner) {
      await db.insert(notificationsTable).values({
        userId: winner.id,
        type: "raffle_won",
        title: "You won a raffle!",
        message: `Congratulations! You won the "${raffle.title}" raffle!`,
        referenceId: raffleId,
      });

      const allUsers = await db.query.usersTable.findMany();
      const losers = allUsers.filter((u) => u.id !== winner.id);
      if (losers.length > 0) {
        await db.insert(notificationsTable).values(
          losers.map((u) => ({
            userId: u.id,
            type: "raffle_ended" as const,
            title: "Raffle ended",
            message: `"${raffle.title}" raffle has ended. Winner: ${winner.username}`,
            referenceId: raffleId,
          }))
        );
      }
    }

    res.json({ raffleId, winner: winner ?? null });
  } catch (err) {
    req.log.error({ err }, "Error drawing raffle winner");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:raffleId/entries", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const raffleId = parseInt(req.params.raffleId as string);
  try {
    const currentUser = await getOrCreateUser(clerkId);
    if (!currentUser || currentUser.role !== "admin") {
      res.status(403).json({ error: "Admin only" });
      return;
    }
    const entries = await db.query.raffleEntriesTable.findMany({
      where: eq(raffleEntriesTable.raffleId, raffleId),
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    });
    const enriched = await Promise.all(
      entries.map(async (e) => {
        const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, e.userId) });
        return { ...e, user: user ?? null };
      })
    );
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Error fetching raffle entries");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
