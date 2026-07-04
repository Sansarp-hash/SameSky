import { useState } from "react";
import { useListPosts, getListPostsQueryKey, useCreatePost, useLikePost, useListComments, getListCommentsQueryKey, useCreateComment, Post } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function FeedPage() {
  const [content, setContent] = useState("");
  const [activeCommentPost, setActiveCommentPost] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data, isLoading } = useListPosts(
    {}, 
    { query: { queryKey: getListPostsQueryKey({}) } }
  );
  
  const createPost = useCreatePost();
  const likePost = useLikePost();

  const handlePost = () => {
    if (!content.trim()) return;
    
    createPost.mutate(
      { data: { content } },
      {
        onSuccess: () => {
          setContent("");
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey({}) });
          toast({ title: "Post dropped successfully." });
        },
        onError: () => {
          toast({ title: "Failed to create post", variant: "destructive" });
        }
      }
    );
  };

  const handleLike = (postId: number) => {
    likePost.mutate(
      { postId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey({}) });
        }
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Feed</h1>
        <p className="text-muted-foreground text-sm">See what's happening and earn coins.</p>
      </header>

      <div className="bg-card/40 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-xl">
        <Textarea 
          placeholder="What's on your mind?" 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] bg-transparent border-none text-base resize-none mb-4 focus-visible:ring-0 placeholder:text-muted-foreground"
          data-testid="input-post-content"
        />
        <div className="flex justify-between items-center border-t border-white/5 pt-4">
          <div className="text-xs text-muted-foreground">Every post earns you GL Coins</div>
          <Button 
            onClick={handlePost} 
            disabled={createPost.isPending || !content.trim()}
            className="rounded-full px-6 font-medium shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all"
            data-testid="button-submit-post"
          >
            {createPost.isPending ? "Posting..." : "Share"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          [1, 2, 3].map(i => (
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
        ) : data?.posts.map((post) => (
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
            <h3 className="text-xl font-semibold text-white mb-2">It's quiet here</h3>
            <p className="text-muted-foreground text-sm">Be the first to share something.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, onLike, isLiking, isCommentOpen, onToggleComment }: { post: Post, onLike: () => void, isLiking: boolean, isCommentOpen: boolean, onToggleComment: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [commentContent, setCommentContent] = useState("");
  
  const { data: commentsData, isLoading: commentsLoading } = useListComments(post.id, {
    query: {
      enabled: isCommentOpen,
      queryKey: getListCommentsQueryKey(post.id)
    }
  });

  const createComment = useCreateComment();

  const handleComment = () => {
    if (!commentContent.trim()) return;
    createComment.mutate({ postId: post.id, data: { content: commentContent } }, {
      onSuccess: () => {
        setCommentContent("");
        queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(post.id) });
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey({}) });
        toast({ title: "Reply added." });
      }
    });
  };

  return (
    <div className="bg-card/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-lg transition-all hover:bg-card/50">
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="w-10 h-10 border border-white/10">
          <AvatarImage src={post.author.avatarUrl || undefined} />
          <AvatarFallback className="bg-white/5 text-white">{post.author.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold text-white text-sm" data-testid={`text-post-author-${post.id}`}>{post.author.username}</div>
          <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</div>
        </div>
      </div>
      
      <p className="text-base text-foreground/90 mb-5 whitespace-pre-wrap leading-relaxed" data-testid={`text-post-content-${post.id}`}>{post.content}</p>
      
      <div className="flex items-center gap-6 pt-4 border-t border-white/5">
        <button 
          onClick={onLike}
          disabled={isLiking}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${post.isLiked ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}
          data-testid={`button-like-${post.id}`}
        >
          <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-primary' : ''}`} />
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
                {[1,2].map(i => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : commentsData?.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="w-8 h-8 border border-white/5">
                  <AvatarFallback className="bg-white/5 text-xs text-white">{comment.author.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-white/5 p-3 rounded-2xl rounded-tl-sm">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-medium text-white text-xs">{comment.author.username}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt))}</span>
                  </div>
                  <p className="text-sm text-foreground/80">{comment.content}</p>
                </div>
              </div>
            ))}
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
