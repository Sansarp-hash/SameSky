import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { followsTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { getOrCreateUser } from "./users";

const router = Router();

router.post("/:userId/follow", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const targetId = parseInt(req.params.userId as string);
  if (isNaN(targetId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  try {
    const me = await getOrCreateUser(clerkId);
    if (!me) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    if (me.id === targetId) {
      res.status(400).json({ error: "Cannot follow yourself" });
      return;
    }

    const existing = await db.query.followsTable.findFirst({
      where: and(eq(followsTable.followerId, me.id), eq(followsTable.followingId, targetId)),
    });

    let following: boolean;
    if (existing) {
      await db.delete(followsTable).where(eq(followsTable.id, existing.id));
      following = false;
    } else {
      await db.insert(followsTable).values({ followerId: me.id, followingId: targetId });
      following = true;
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(followsTable)
      .where(eq(followsTable.followingId, targetId));
    const followerCount = Number(countResult?.count ?? 0);

    res.json({ following, followerCount });
  } catch (err) {
    req.log.error({ err }, "Error toggling follow");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:userId/followers", async (req: Request, res: Response) => {
  const targetId = parseInt(req.params.userId as string);
  if (isNaN(targetId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  try {
    const rows = await db.query.followsTable.findMany({
      where: eq(followsTable.followingId, targetId),
    });
    const users = await Promise.all(
      rows.map((r) =>
        db.query.usersTable.findFirst({ where: eq(usersTable.id, r.followerId) })
      )
    );
    res.json(users.filter(Boolean));
  } catch (err) {
    req.log.error({ err }, "Error listing followers");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:userId/following", async (req: Request, res: Response) => {
  const targetId = parseInt(req.params.userId as string);
  if (isNaN(targetId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  try {
    const rows = await db.query.followsTable.findMany({
      where: eq(followsTable.followerId, targetId),
    });
    const users = await Promise.all(
      rows.map((r) =>
        db.query.usersTable.findFirst({ where: eq(usersTable.id, r.followingId) })
      )
    );
    res.json(users.filter(Boolean));
  } catch (err) {
    req.log.error({ err }, "Error listing following");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
