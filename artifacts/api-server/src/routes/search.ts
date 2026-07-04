import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { postsTable, usersTable, postLikesTable } from "@workspace/db";
import { ilike, or, desc, and, eq } from "drizzle-orm";
import { getOrCreateUser } from "./users";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const q = (req.query.q as string ?? "").trim();
  const type = (req.query.type as string) ?? "all";

  if (!q || q.length < 1) {
    res.json({ users: [], posts: [] });
    return;
  }

  const { userId: clerkId } = getAuth(req);
  const currentUser = clerkId ? await getOrCreateUser(clerkId) : null;

  try {
    const pattern = `%${q}%`;
    let users: typeof usersTable.$inferSelect[] = [];
    let posts: Array<typeof postsTable.$inferSelect & { author: typeof usersTable.$inferSelect | null; isLiked: boolean }> = [];

    if (type === "all" || type === "users") {
      users = await db
        .select()
        .from(usersTable)
        .where(
          or(
            ilike(usersTable.username, pattern),
            ilike(usersTable.bio, pattern)
          )
        )
        .limit(10);
    }

    if (type === "all" || type === "posts") {
      const rawPosts = await db
        .select()
        .from(postsTable)
        .where(ilike(postsTable.content, pattern))
        .orderBy(desc(postsTable.createdAt))
        .limit(20);

      posts = await Promise.all(
        rawPosts.map(async (post) => {
          const author = await db.query.usersTable.findFirst({
            where: eq(usersTable.id, post.authorId),
          });
          let isLiked = false;
          if (currentUser) {
            const like = await db.query.postLikesTable.findFirst({
              where: and(
                eq(postLikesTable.postId, post.id),
                eq(postLikesTable.userId, currentUser.id)
              ),
            });
            isLiked = !!like;
          }
          return { ...post, author: author ?? null, isLiked, hashtags: post.hashtags ?? [] };
        })
      );
    }

    res.json({ users, posts });
  } catch (err) {
    req.log.error({ err }, "Error performing search");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
