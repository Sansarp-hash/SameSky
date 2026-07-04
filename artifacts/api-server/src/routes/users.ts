import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { UpdateMeBody, VerifyAgeBody } from "@workspace/api-zod";

const router = Router();

async function getOrCreateUser(clerkId: string, fallbackUsername?: string) {
  let user = await db.query.usersTable.findFirst({
    where: eq(usersTable.clerkId, clerkId),
  });
  if (!user) {
    const username = fallbackUsername ?? `user_${clerkId.slice(-8)}`;
    const rows = await db
      .insert(usersTable)
      .values({ clerkId, username, role: "free" })
      .onConflictDoNothing()
      .returning();
    user = rows[0];
    if (!user) {
      user = await db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, clerkId),
      });
    }
  }
  return user;
}

export { getOrCreateUser };

router.get("/me", async (req: Request, res: Response) => {
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
    res.json(user);
  } catch (err) {
    req.log.error({ err }, "Error fetching current user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/me", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const [updated] = await db
      .update(usersTable)
      .set(parsed.data)
      .where(eq(usersTable.id, user.id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error updating user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:userId", async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  try {
    let user;
    if (/^\d+$/.test(userId)) {
      user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, parseInt(userId)),
      });
    } else {
      user = await db.query.usersTable.findFirst({
        where: eq(usersTable.clerkId, userId),
      });
    }
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    req.log.error({ err }, "Error fetching user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/me/verify-age", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = VerifyAgeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { birthYear } = parsed.data;
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  if (age < 16) {
    res.status(400).json({ error: "You must be at least 16 years old" });
    return;
  }
  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const [updated] = await db
      .update(usersTable)
      .set({ ageVerified: true })
      .where(eq(usersTable.id, user.id))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Error verifying age");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
