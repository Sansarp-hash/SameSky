import { useState } from "react";
import { useListPosts, getListPostsQueryKey, useCreatePost, useLikePost, useListComments, getListCommentsQueryKey, useCreateComment, Post } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, Play, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const SHORTS_TAG = "#shorts";

function extractVideoUrl(content: string): string | null {
  const urlRegex = /(https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|tiktok\.com\/@[^/]+\/video\/|instagram\.com\/reel\/|bilibili\.com\/video\/)[\w\-?=&%.]+)/i;
  const match = content.match(urlRegex);
  return match ? match[0] : null;
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return m ? m[1] : null;
}

function VideoEmbed({ url }: { url: string }) {
  const ytId = getYouTubeId(url);

  if (ytId) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video mt-3">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${ytId}`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 hover:text-white hover:border-white/20 transition-all"
    >
      <Play className="w-4 h-4 flex-shrink-0 text-primary" />
      <span className="truncate">{url}</span>
      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 ml-auto" />
    </a>
  );
}

function isShort(post: Post): boolean {
  const c = post.content?.toLowerCase() ?? "";
  return c.includes(SHORTS_TAG) || extractVideoUrl(post.content ?? "") !== null;
}

function timeAgo(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}

function ShortCard({ post }: { post: Post }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const queryClient = useQueryClient();
  const likePost = useLikePost();
  const createComment = useCreateComment();

  const { data: commentsData } = useListComments(post.id, {
    query: {
      enabled: showComments,
      queryKey: getListCommentsQueryKey(post.id),
    },
  });

  const videoUrl = extractVideoUrl(post.content ?? "");
  const displayContent = (post.content ?? "")
    .replace(/(https?:\/\/\S+)/g, "")
    .replace(SHORTS_TAG, "")
    .trim();

  const handleLike = () => {
    likePost.mutate(
      { postId: post.id },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPostsQueryKey({}) }) }
    );
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    createComment.mutate(
      { postId: post.id, data: { content: commentText.trim() } },
      {
        onSuccess: () => {
          setCommentText("");
          queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(post.id) });
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey({}) });
        },
      }
    );
  };

  return (
    <article className="border border-white/8 rounded-2xl bg-white/[0.02] p-5 space-y-3">
      {/* Author */}
      <div className="flex items-center gap-3">
        <Avatar className="w-9 h-9">
          <AvatarImage src={post.author?.avatarUrl ?? undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
            {(post.author?.username ?? "U")[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-white leading-none">{post.author?.username ?? "User"}</p>
          <p className="text-xs text-white/35 mt-0.5">{timeAgo(post.createdAt)}</p>
        </div>
        <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
          <Play className="w-2.5 h-2.5 fill-primary" /> Short
        </span>
      </div>

      {/* Content */}
      {displayContent && (
        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{displayContent}</p>
      )}

      {/* Video embed */}
      {videoUrl && <VideoEmbed url={videoUrl} />}

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {post.hashtags.map((tag) => (
            <span key={tag} className="text-xs text-primary/70 hover:text-primary cursor-pointer">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 pt-1 border-t border-white/5">
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-rose-400 transition-colors"
        >
          <Heart className={`w-4 h-4 ${post.isLiked ? "fill-rose-400 text-rose-400" : ""}`} />
          {post.likeCount ?? 0}
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          {post.commentCount ?? 0}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="space-y-3 pt-1">
          {(commentsData ?? []).map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarFallback className="bg-white/10 text-white/60 text-[10px]">
                  {(c.author?.username ?? "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="bg-white/5 rounded-xl px-3 py-2 text-xs text-white/70 flex-1">
                <span className="font-semibold text-white/90 mr-1.5">{c.author?.username}</span>
                {c.content}
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Textarea
              rows={1}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="bg-white/5 border-white/10 text-sm text-white placeholder:text-white/30 rounded-xl resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleComment();
                }
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleComment}
              disabled={!commentText.trim() || createComment.isPending}
              className="rounded-full h-9 w-9 text-white/40 hover:text-primary"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

export default function ShortsPage() {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createPost = useCreatePost();

  const { data, isLoading } = useListPosts(
    {},
    { query: { queryKey: getListPostsQueryKey({}) } }
  );

  const shorts = (data?.posts ?? []).filter(isShort);

  const handlePost = async () => {
    const text = content.trim();
    if (!text) return;
    const withTag = text.includes(SHORTS_TAG) ? text : `${text}\n${SHORTS_TAG}`;

    try {
      await createPost.mutateAsync({ data: { content: withTag } });
      setContent("");
      queryClient.invalidateQueries({ queryKey: getListPostsQueryKey({}) });
      toast({ title: "Short shared" });
    } catch {
      toast({ title: "Failed to share", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-2 mb-1">
          <Play className="w-5 h-5 text-primary fill-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-white">Shorts</h1>
        </div>
        <p className="text-sm text-white/40">GL clips, scene cuts and fan videos — share a YouTube link to get started</p>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Composer */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <Textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Paste a YouTube or TikTok link, add a caption...\nEvery post earns you Stars.`}
            className="bg-transparent border-0 p-0 text-sm text-white placeholder:text-white/25 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <span className="text-[11px] text-white/25">{SHORTS_TAG} added automatically</span>
            <Button
              size="sm"
              className="rounded-full px-5 h-8 text-sm font-semibold bg-primary hover:bg-primary/90 text-white"
              onClick={handlePost}
              disabled={!content.trim() || createPost.isPending}
            >
              Share
            </Button>
          </div>
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-white/8 rounded-2xl p-5 space-y-3">
                <div className="flex gap-3">
                  <Skeleton className="w-9 h-9 rounded-full bg-white/10" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-24 bg-white/10 rounded-full" />
                    <Skeleton className="h-2.5 w-16 bg-white/10 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-48 w-full bg-white/10 rounded-xl" />
              </div>
            ))}
          </div>
        ) : shorts.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Play className="w-10 h-10 text-white/20 fill-white/10 mx-auto" />
            <p className="text-white/40 text-sm">No shorts yet</p>
            <p className="text-white/25 text-xs">Be the first — share a YouTube or TikTok clip above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shorts.map((post) => (
              <ShortCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
