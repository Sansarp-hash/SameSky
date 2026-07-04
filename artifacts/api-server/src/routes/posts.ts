import { Router, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { postsTable, postLikesTable, commentsTable, usersTable, notificationsTable, followsTable } from "@workspace/db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { CreatePostBody, ListPostsQueryParams, CreateCommentBody } from "@workspace/api-zod";
import { getOrCreateUser } from "./users";

const router = Router();

async function enrichPost(post: typeof postsTable.$inferSelect, currentUserId?: number) {
  const author = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, post.authorId),
  });

  let isLiked = false;
  if (currentUserId) {
    const like = await db.query.postLikesTable.findFirst({
      where: and(eq(postLikesTable.postId, post.id), eq(postLikesTable.userId, currentUserId)),
    });
    isLiked = !!like;
  }

  return {
    ...post,
    author: author ?? null,
    isLiked,
    hashtags: post.hashtags ?? [],
  };
}

router.get("/", async (req: Request, res: Response) => {
  const params = ListPostsQueryParams.safeParse(req.query);
  const page = params.success ? (params.data.page ?? 1) : 1;
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const hashtag = params.success ? params.data.hashtag : undefined;
  const followingOnly = params.success ? (params.data.following ?? false) : false;
  const offset = (page - 1) * limit;

  const { userId: clerkId } = getAuth(req);
  let currentUser = clerkId ? await getOrCreateUser(clerkId) : null;

  try {
    let posts: typeof postsTable.$inferSelect[];

    if (followingOnly && currentUser) {
      const followRows = await db.query.followsTable.findMany({
        where: eq(followsTable.followerId, currentUser.id),
      });
      const followingIds = followRows.map((r) => r.followingId);

      if (followingIds.length === 0) {
        res.json({ posts: [], total: 0, page, limit });
        return;
      }

      posts = await db
        .select()
        .from(postsTable)
        .where(inArray(postsTable.authorId, followingIds))
        .orderBy(desc(postsTable.createdAt))
        .limit(limit)
        .offset(offset);
    } else if (hashtag) {
      posts = await db
        .select()
        .from(postsTable)
        .where(sql`${postsTable.hashtags} @> ARRAY[${hashtag}]::text[]`)
        .orderBy(desc(postsTable.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      posts = await db
        .select()
        .from(postsTable)
        .orderBy(desc(postsTable.createdAt))
        .limit(limit)
        .offset(offset);
    }

    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(postsTable);
    const total = Number(totalResult[0]?.count ?? 0);

    const enriched = await Promise.all(posts.map((p) => enrichPost(p, currentUser?.id)));

    res.json({ posts: enriched, total, page, limit });
  } catch (err) {
    req.log.error({ err }, "Error listing posts");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const content = parsed.data.content;
    const hashtagMatches = content.match(/#\w+/g) ?? [];
    const hashtags = hashtagMatches.map((h: string) => h.slice(1));

    const [post] = await db
      .insert(postsTable)
      .values({
        content,
        imageUrl: parsed.data.imageUrl ?? null,
        authorId: user.id,
        hashtags,
      })
      .returning();

    const enriched = await enrichPost(post, user.id);
    res.status(201).json(enriched);
  } catch (err) {
    req.log.error({ err }, "Error creating post");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:postId", async (req: Request, res: Response) => {
  const postId = parseInt(req.params.postId as string);
  const { userId: clerkId } = getAuth(req);
  let currentUser = clerkId ? await getOrCreateUser(clerkId) : null;

  try {
    const post = await db.query.postsTable.findFirst({
      where: eq(postsTable.id, postId),
    });
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    const enriched = await enrichPost(post, currentUser?.id);
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Error fetching post");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:postId", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const postId = parseInt(req.params.postId as string);
  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    const post = await db.query.postsTable.findFirst({ where: eq(postsTable.id, postId) });
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    if (post.authorId !== user.id && user.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db.delete(postsTable).where(eq(postsTable.id, postId));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting post");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:postId/like", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const postId = parseInt(req.params.postId as string);
  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    const post = await db.query.postsTable.findFirst({ where: eq(postsTable.id, postId) });
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    const existingLike = await db.query.postLikesTable.findFirst({
      where: and(eq(postLikesTable.postId, postId), eq(postLikesTable.userId, user.id)),
    });

    let liked: boolean;
    let newCount: number;

    if (existingLike) {
      await db.delete(postLikesTable).where(eq(postLikesTable.id, existingLike.id));
      newCount = Math.max(0, post.likeCount - 1);
      liked = false;
    } else {
      await db.insert(postLikesTable).values({ postId, userId: user.id });
      newCount = post.likeCount + 1;
      liked = true;

      if (post.authorId !== user.id) {
        await db.insert(notificationsTable).values({
          userId: post.authorId,
          type: "post_liked",
          title: "Someone liked your post",
          message: `${user.username} liked your post`,
          referenceId: postId,
        });
      }
    }

    await db.update(postsTable).set({ likeCount: newCount }).where(eq(postsTable.id, postId));
    res.json({ liked, likeCount: newCount });
  } catch (err) {
    req.log.error({ err }, "Error toggling like");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:postId/comments", async (req: Request, res: Response) => {
  const postId = parseInt(req.params.postId as string);
  try {
    const comments = await db.query.commentsTable.findMany({
      where: eq(commentsTable.postId, postId),
      orderBy: [desc(commentsTable.createdAt)],
    });
    const enriched = await Promise.all(
      comments.map(async (c) => {
        const author = await db.query.usersTable.findFirst({
          where: eq(usersTable.id, c.authorId),
        });
        return { ...c, author: author ?? null };
      })
    );
    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Error fetching comments");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:postId/comments", async (req: Request, res: Response) => {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const postId = parseInt(req.params.postId as string);
  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  try {
    const user = await getOrCreateUser(clerkId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    const post = await db.query.postsTable.findFirst({ where: eq(postsTable.id, postId) });
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    const [comment] = await db
      .insert(commentsTable)
      .values({ postId, authorId: user.id, content: parsed.data.content })
      .returning();

    await db
      .update(postsTable)
      .set({ commentCount: post.commentCount + 1 })
      .where(eq(postsTable.id, postId));

    if (post.authorId !== user.id) {
      await db.insert(notificationsTable).values({
        userId: post.authorId,
        type: "post_commented",
        title: "New comment on your post",
        message: `${user.username} commented: "${parsed.data.content.slice(0, 60)}"`,
        referenceId: postId,
      });
    }

    res.status(201).json({ ...comment, author: user });
  } catch (err) {
    req.log.error({ err }, "Error creating comment");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
