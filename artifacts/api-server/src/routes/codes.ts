import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { communityCodesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { getOrCreateUser } from "./users";

const router = Router();

async function resolveUser(req: Request, res: Response) {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const user = await getOrCreateUser(clerkId);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user;
}

// List all available (unclaimed) codes, newest first.
router.get("/", async (req: Request, res: Response) => {
  const user = await resolveUser(req, res);
  if (!user) return;
  try {
    const rows = await db
      .select({
        id: communityCodesTable.id,
        code: communityCodesTable.code,
        contributor: communityCodesTable.contributor,
        createdByUserId: communityCodesTable.createdByUserId,
        createdAt: communityCodesTable.createdAt,
      })
      .from(communityCodesTable)
      .where(eq(communityCodesTable.claimed, false))
      .orderBy(desc(communityCodesTable.createdAt));
    return res.json({ codes: rows, total: rows.length });
  } catch (err) {
    req.log.error({ err }, "Failed to list community codes");
    return res.status(500).json({ error: "Could not load codes" });
  }
});

// Add a new code to the pool.
router.post("/", async (req: Request, res: Response) => {
  const user = await resolveUser(req, res);
  if (!user) return;

  const rawCode = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  const rawContributor =
    typeof req.body?.contributor === "string" ? req.body.contributor.trim() : "";

  if (!rawCode) return res.status(400).json({ error: "A code is required" });
  if (rawCode.length > 200) return res.status(400).json({ error: "Code is too long" });
  if (rawContributor.length > 80)
    return res.status(400).json({ error: "Contributor name is too long" });

  try {
    const [created] = await db
      .insert(communityCodesTable)
      .values({
        code: rawCode,
        contributor: rawContributor || user.username,
        createdByUserId: user.id,
      })
      .returning();
    return res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to add community code");
    return res.status(500).json({ error: "Could not add code" });
  }
});

// Claim (copy) a code — removes it from the available pool and returns it.
router.post("/:id/claim", async (req: Request, res: Response) => {
  const user = await resolveUser(req, res);
  if (!user) return;
  const id = parseInt(String(req.params.id), 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid code id" });

  try {
    const [claimed] = await db
      .update(communityCodesTable)
      .set({ claimed: true, claimedByUserId: user.id, claimedAt: new Date() })
      .where(and(eq(communityCodesTable.id, id), eq(communityCodesTable.claimed, false)))
      .returning();
    if (!claimed) {
      return res.status(409).json({ error: "This code has already been claimed" });
    }
    return res.json({ id: claimed.id, code: claimed.code });
  } catch (err) {
    req.log.error({ err }, "Failed to claim community code");
    return res.status(500).json({ error: "Could not claim code" });
  }
});

// Remove a code — allowed for the contributor or an admin.
router.delete("/:id", async (req: Request, res: Response) => {
  const user = await resolveUser(req, res);
  if (!user) return;
  const id = parseInt(String(req.params.id), 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid code id" });

  try {
    const [existing] = await db
      .select()
      .from(communityCodesTable)
      .where(eq(communityCodesTable.id, id))
      .limit(1);
    if (!existing) return res.status(204).end();

    const isOwner = existing.createdByUserId === user.id;
    const isAdmin = user.role === "admin" || user.role === "super_admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "You can only remove codes you added" });
    }

    await db.delete(communityCodesTable).where(eq(communityCodesTable.id, id));
    return res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete community code");
    return res.status(500).json({ error: "Could not remove code" });
  }
});

export default router;
