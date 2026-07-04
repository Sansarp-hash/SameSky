import { useState } from "react";
import { useListPosts, getListPostsQueryKey, useCreatePost } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeedPage() {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useListPosts(
    {}, 
    { query: { queryKey: getListPostsQueryKey({}) } }
  );
  
  const createPost = useCreatePost();

  const handlePost = () => {
    if (!content.trim()) return;
    
    createPost.mutate(
      { data: { content } },
      {
        onSuccess: () => {
          setContent("");
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey({}) });
        }
      }
    );
  };

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-black uppercase tracking-tight drop-shadow-[2px_2px_0_rgba(0,0,0,1)] text-white" style={{ WebkitTextStroke: "1px black" }}>
        The Feed
      </h1>

      <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-4 rounded-xl">
        <Textarea 
          placeholder="What's the play today?" 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] border-2 border-black text-lg resize-none mb-4 font-medium"
        />
        <div className="flex justify-end">
          <Button 
            onClick={handlePost} 
            disabled={createPost.isPending || !content.trim()}
            className="font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-primary text-white"
          >
            {createPost.isPending ? "Posting..." : "Drop It"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white border-4 border-black p-4 rounded-xl shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
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
          <div key={post.id} className="bg-white border-4 border-black p-4 md:p-6 rounded-xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[10px_10px_0_0_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 border-2 border-black rounded-full flex items-center justify-center font-black">
                {post.author.username[0]?.toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-lg">{post.author.username}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase">{new Date(post.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            
            <p className="text-lg font-medium mb-6 whitespace-pre-wrap">{post.content}</p>
            
            <div className="flex items-center gap-6 pt-4 border-t-2 border-gray-100">
              <button className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm hover:text-primary transition-colors group">
                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-primary text-primary' : 'group-hover:scale-110 transition-transform'}`} />
                <span>{post.likeCount} Likes</span>
              </button>
              <button className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm hover:text-secondary transition-colors group">
                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>{post.commentCount} Replies</span>
              </button>
            </div>
          </div>
        ))}

        {!isLoading && data?.posts.length === 0 && (
          <div className="text-center p-12 bg-white border-4 border-black border-dashed rounded-xl">
            <h3 className="text-2xl font-black uppercase mb-2">Dead Quiet</h3>
            <p className="font-medium text-muted-foreground">Be the first to drop some energy.</p>
          </div>
        )}
      </div>
    </div>
  );
}
