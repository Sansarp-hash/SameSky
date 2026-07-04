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
  const currentUser = clerkId ? await getOrCreateUser(clerkId) : null;

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
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = CreateRaffleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  try {
    const user = await getOrCreateUser(clerkId);
    if (!user || user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }

    const [raffle] = await db
      .insert(rafflesTable)
      .values({ ...parsed.data, startTime: new Date(parsed.data.startTime), endTime: new Date(parsed.data.endTime) })
      .returning();

    // Use a single INSERT...SELECT to notify all users — never loads user rows into Node.js memory.
    // Batched to avoid a single massive transaction.
    await db.execute(
      sql`INSERT INTO notifications (user_id, type, title, message, reference_id)
          SELECT id, 'raffle_started',
            ${"New Community Drop!"},
            ${"\"" + raffle.title + "\" is now live. Entry costs " + raffle.entryCost + " Stars."},
            ${raffle.id}
          FROM users`,
    );

    res.status(201).json(await enrichRaffle(raffle));
  } catch (err) {
    req.log.error({ err }, "Error creating raffle");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:raffleId", async (req: Request, res: Response) => {
  const raffleId = parseInt(req.params.raffleId as string);
  if (isNaN(raffleId)) { res.status(400).json({ error: "Invalid raffle ID" }); return; }
  const { userId: clerkId } = getAuth(req);
  const currentUser = clerkId ? await getOrCreateUser(clerkId) : null;

  try {
    const raffle = await db.query.rafflesTable.findFirst({ where: eq(rafflesTable.id, raffleId) });
    if (!raffle) { res.status(404).json({ error: "Raffle not found" }); return; }
    res.json(await enrichRaffle(raffle, currentUser?.id));
  } catch (err) {
    req.log.error({ err }, "Error fetching raffle");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Raffle entry — fully transactional with row-level locking ────────────────
router.post("/:raffleId/enter", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const raffleId = parseInt(req.params.raffleId as string);
  if (isNaN(raffleId)) { res.status(400).json({ error: "Invalid raffle ID" }); return; }

  try {
    const currentUser = await getOrCreateUser(clerkId);
    if (!currentUser) { res.status(401).json({ error: "User not found" }); return; }

    const raffle = await db.query.rafflesTable.findFirst({ where: eq(rafflesTable.id, raffleId) });
    if (!raffle) { res.status(404).json({ error: "Raffle not found" }); return; }
    if (computeStatus(raffle) !== "active") { res.status(400).json({ error: "Raffle is not active" }); return; }

    let entry: typeof raffleEntriesTable.$inferSelect;

    try {
      entry = await db.transaction(async (tx) => {
        // Lock this user's row to prevent race conditions on coinBalance.
        const [lockedUser] = await tx
          .select({ id: usersTable.id, coinBalance: usersTable.coinBalance })
          .from(usersTable)
          .where(eq(usersTable.id, currentUser.id))
          .for("update");

        if (!lockedUser) throw Object.assign(new Error("User not found"), { status: 404 });

        // Duplicate entry check inside the transaction.
        const existing = await tx.query.raffleEntriesTable.findFirst({
          where: and(eq(raffleEntriesTable.raffleId, raffleId), eq(raffleEntriesTable.userId, lockedUser.id)),
        });
        if (existing) throw Object.assign(new Error("Already entered this raffle"), { status: 400 });

        if (lockedUser.coinBalance < raffle.entryCost) {
          throw Object.assign(new Error("Insufficient Stars"), { status: 400 });
        }

        await tx
          .update(usersTable)
          .set({ coinBalance: lockedUser.coinBalance - raffle.entryCost })
          .where(eq(usersTable.id, lockedUser.id));

        await tx.insert(coinTransactionsTable).values({
          userId: lockedUser.id,
          amount: raffle.entryCost,
          type: "raffle_entry",
          description: `Entered raffle: ${raffle.title}`,
        });

        const [newEntry] = await tx
          .insert(raffleEntriesTable)
          .values({ raffleId, userId: lockedUser.id })
          .returning();

        await tx
          .update(rafflesTable)
          .set({ entryCount: sql`${rafflesTable.entryCount} + 1` })
          .where(eq(rafflesTable.id, raffleId));

        return newEntry;
      });
    } catch (txErr: any) {
      const status = txErr.status ?? 500;
      if (status < 500) {
        res.status(status).json({ error: txErr.message });
        return;
      }
      throw txErr;
    }

    res.json(entry);
  } catch (err) {
    req.log.error({ err }, "Error entering raffle");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:raffleId/draw", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const raffleId = parseInt(req.params.raffleId as string);
  if (isNaN(raffleId)) { res.status(400).json({ error: "Invalid raffle ID" }); return; }

  try {
    const user = await getOrCreateUser(clerkId);
    if (!user || user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }

    const raffle = await db.query.rafflesTable.findFirst({ where: eq(rafflesTable.id, raffleId) });
    if (!raffle) { res.status(404).json({ error: "Raffle not found" }); return; }
    if (raffle.winnerId) { res.status(400).json({ error: "Winner already drawn" }); return; }

    // Use database-side random selection — avoids loading all entries into memory.
    const [winnerEntry] = await db
      .select()
      .from(raffleEntriesTable)
      .where(eq(raffleEntriesTable.raffleId, raffleId))
      .orderBy(sql`RANDOM()`)
      .limit(1);

    if (!winnerEntry) { res.status(400).json({ error: "No entries in this raffle" }); return; }

    const winner = await db.query.usersTable.findFirst({ where: eq(usersTable.id, winnerEntry.userId) });

    await db.update(rafflesTable)
      .set({ winnerId: winnerEntry.userId, status: "ended" })
      .where(eq(rafflesTable.id, raffleId));

    if (winner) {
      await db.insert(notificationsTable).values({
        userId: winner.id,
        type: "raffle_won",
        title: "You won!",
        message: `Congratulations! You won the "${raffle.title}" drop.`,
        referenceId: raffle.id,
      });
    }

    res.json({ ...raffle, winnerId: winnerEntry.userId, winner: winner ?? null, status: "ended" });
  } catch (err) {
    req.log.error({ err }, "Error drawing raffle winner");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:raffleId/entries", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const raffleId = parseInt(req.params.raffleId as string);
  if (isNaN(raffleId)) { res.status(400).json({ error: "Invalid raffle ID" }); return; }

  try {
    const user = await getOrCreateUser(clerkId);
    if (!user || user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }

    const page = Math.max(1, parseInt((req.query.page as string) ?? "1"));
    const limit = Math.min(100, parseInt((req.query.limit as string) ?? "50"));
    const offset = (page - 1) * limit;

    const entries = await db.query.raffleEntriesTable.findMany({
      where: eq(raffleEntriesTable.raffleId, raffleId),
      limit,
      offset,
      orderBy: (e, { asc }) => [asc(e.createdAt)],
    });
    res.json({ entries, page, limit });
  } catch (err) {
    req.log.error({ err }, "Error listing raffle entries");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
