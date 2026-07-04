import { useState, useRef } from "react";
import { useListPosts, getListPostsQueryKey, useCreatePost, useLikePost, useListComments, getListCommentsQueryKey, useCreateComment, Post } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Send, Image as ImageIcon, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useUpload } from "@workspace/object-storage-web";

type FeedTab = "for-you" | "following";

export default function FeedPage() {
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState<FeedTab>("for-you");
  const [activeCommentPost, setActiveCommentPost] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImagePath, setUploadedImagePath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (res) => {
      setUploadedImagePath(res.objectPath);
    },
    onError: () => {
      toast({ title: "Image upload failed", variant: "destructive" });
    },
  });

  const isFollowing = activeTab === "following";

  const { data, isLoading } = useListPosts(
    { following: isFollowing },
    { query: { queryKey: getListPostsQueryKey({ following: isFollowing }) } }
  );

  const createPost = useCreatePost();
  const likePost = useLikePost();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploadedImagePath(null);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadedImagePath(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePost = async () => {
    if (!content.trim()) return;

    let imagePath = uploadedImagePath;
    if (imageFile && !imagePath) {
      const result = await uploadFile(imageFile);
      if (!result) return;
      imagePath = result.objectPath;
    }

    createPost.mutate(
      { data: { content, imageUrl: imagePath ? `/api/storage/objects/${imagePath}` : undefined } },
      {
        onSuccess: () => {
          setContent("");
          handleRemoveImage();
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey({}) });
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey({ following: true }) });
          toast({ title: "Post dropped successfully." });
        },
        onError: () => {
          toast({ title: "Failed to create post", variant: "destructive" });
        },
      }
    );
  };

  const handleLike = (postId: number) => {
    likePost.mutate(
      { postId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey({ following: isFollowing }) });
        },
      }
    );
  };

  return (
    <div className="space-y-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="sticky top-0 bg-background/90 backdrop-blur-xl border-b border-white/5 z-20">
        <div className="px-4 pt-4 pb-0">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-3 px-0">Feed</h1>
        </div>
        <div className="flex">
          {(["for-you", "following"] as FeedTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold tracking-wide transition-colors border-b-2 ${
                activeTab === tab
                  ? "text-white border-primary"
                  : "text-muted-foreground border-transparent hover:text-white/70"
              }`}
            >
              {tab === "for-you" ? "For You" : "Following"}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Composer */}
        <div className="bg-card/40 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-xl">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[80px] bg-transparent border-none text-base resize-none mb-3 focus-visible:ring-0 placeholder:text-muted-foreground"
            data-testid="input-post-content"
          />

          {imagePreview && (
            <div className="relative mb-3 rounded-xl overflow-hidden border border-white/10">
              <img src={imagePreview} alt="Preview" className="max-h-48 w-full object-cover" />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-white/5 pt-3">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-lg hover:bg-white/5"
                title="Attach image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <span className="text-xs text-muted-foreground">Every post earns you Stars</span>
            </div>
            <Button
              onClick={handlePost}
              disabled={createPost.isPending || isUploading || !content.trim()}
              className="rounded-full px-6 font-medium shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all"
              data-testid="button-submit-post"
            >
              {isUploading ? "Uploading..." : createPost.isPending ? "Posting..." : "Share"}
            </Button>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {isLoading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="bg-card/20 border border-white/5 p-5 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-16 w-full mb-4" />
                  <div className="flex gap-4">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              ))
            : data?.posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={() => handleLike(post.id)}
                  isLiking={likePost.isPending && likePost.variables?.postId === post.id}
                  isCommentOpen={activeCommentPost === post.id}
                  onToggleComment={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                />
              ))}

          {!isLoading && data?.posts.length === 0 && (
            <div className="text-center p-12 bg-card/20 border border-white/5 rounded-2xl backdrop-blur-sm">
              {isFollowing ? (
                <>
                  <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                  <p className="text-muted-foreground text-sm">Follow people to see their posts here.</p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-white mb-2">It's quiet here</h3>
                  <p className="text-muted-foreground text-sm">Be the first to share something.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PostCard({
  post,
  onLike,
  isLiking,
  isCommentOpen,
  onToggleComment,
}: {
  post: Post;
  onLike: () => void;
  isLiking: boolean;
  isCommentOpen: boolean;
  onToggleComment: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [commentContent, setCommentContent] = useState("");

  const { data: commentsData, isLoading: commentsLoading } = useListComments(post.id, {
    query: {
      enabled: isCommentOpen,
      queryKey: getListCommentsQueryKey(post.id),
    },
  });

  const createComment = useCreateComment();

  const handleComment = () => {
    if (!commentContent.trim()) return;
    createComment.mutate(
      { postId: post.id, data: { content: commentContent } },
      {
        onSuccess: () => {
          setCommentContent("");
          queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(post.id) });
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey({}) });
          toast({ title: "Reply added." });
        },
      }
    );
  };

  return (
    <div className="bg-card/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-lg transition-all hover:bg-card/50">
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="w-10 h-10 border border-white/10">
          <AvatarImage src={post.author.avatarUrl || undefined} />
          <AvatarFallback className="bg-white/5 text-white">{post.author.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold text-white text-sm" data-testid={`text-post-author-${post.id}`}>
            {post.author.username}
          </div>
          <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</div>
        </div>
      </div>

      <p className="text-base text-foreground/90 mb-3 whitespace-pre-wrap leading-relaxed" data-testid={`text-post-content-${post.id}`}>
        {post.content}
      </p>

      {post.imageUrl && (
        <div className="mb-4 rounded-xl overflow-hidden border border-white/10">
          <img src={post.imageUrl} alt="Post image" className="w-full max-h-80 object-cover" />
        </div>
      )}

      {post.hashtags && post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {post.hashtags.map((tag) => (
            <span key={tag} className="text-xs text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-6 pt-4 border-t border-white/5">
        <button
          onClick={onLike}
          disabled={isLiking}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${post.isLiked ? "text-primary" : "text-muted-foreground hover:text-white"}`}
          data-testid={`button-like-${post.id}`}
        >
          <Heart className={`w-4 h-4 ${post.isLiked ? "fill-primary" : ""}`} />
          <span>{post.likeCount}</span>
        </button>
        <button
          onClick={onToggleComment}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors"
          data-testid={`button-comment-${post.id}`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{post.commentCount}</span>
        </button>
      </div>

      {isCommentOpen && (
        <div className="mt-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto pr-2">
            {commentsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              commentsData?.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8 border border-white/5">
                    <AvatarFallback className="bg-white/5 text-xs text-white">
                      {comment.author.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-white/5 p-3 rounded-2xl rounded-tl-sm">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-medium text-white text-xs">{comment.author.username}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt))}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
            {!commentsLoading && commentsData?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No replies yet.</p>
            )}
          </div>
          <div className="flex gap-2 relative">
            <Textarea
              placeholder="Reply..."
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="min-h-[40px] h-[40px] py-2 px-4 rounded-full bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-primary/50 text-sm resize-none"
              data-testid={`input-comment-${post.id}`}
            />
            <Button
              size="icon"
              className="rounded-full shrink-0"
              onClick={handleComment}
              disabled={createComment.isPending || !commentContent.trim()}
              data-testid={`button-submit-comment-${post.id}`}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
