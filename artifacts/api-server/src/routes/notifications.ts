import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { getOrCreateUser } from "./users";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const unreadOnly = req.query.unreadOnly === "true";
  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const notifications = unreadOnly
      ? await db.query.notificationsTable.findMany({
          where: and(eq(notificationsTable.userId, user.id), eq(notificationsTable.isRead, false)),
          orderBy: [desc(notificationsTable.createdAt)],
        })
      : await db.query.notificationsTable.findMany({
          where: eq(notificationsTable.userId, user.id),
          orderBy: [desc(notificationsTable.createdAt)],
        });

    res.json(notifications);
  } catch (err) {
    req.log.error({ err }, "Error fetching notifications");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:notificationId/read", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const notificationId = parseInt(req.params.notificationId as string);
  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const [updated] = await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.id, notificationId), eq(notificationsTable.userId, user.id)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error marking notification read");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/read-all", async (req: Request, res: Response) => {
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
    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.userId, user.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error marking all notifications read");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
