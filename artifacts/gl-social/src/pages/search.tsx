import { useState } from "react";
import { useSearch, getSearchQueryKey, useToggleFollow, getGetMeQueryKey, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Heart, UserPlus, UserCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });

  const { data, isLoading } = useSearch(
    { q: submitted, type: "all" },
    { query: { queryKey: getSearchQueryKey({ q: submitted, type: "all" }), enabled: submitted.length > 0 } }
  );

  const toggleFollow = useToggleFollow();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(query.trim());
  };

  const handleFollow = (userId: number) => {
    toggleFollow.mutate(
      { userId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getSearchQueryKey({ q: submitted, type: "all" }) });
          toast({ title: "Follow status updated." });
        },
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="sticky top-0 bg-background/90 backdrop-blur-xl border-b border-white/5 z-20 px-4 pt-4 pb-3">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-3">Search</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search series, ships, people..."
              className="pl-9 bg-white/5 border-white/10 rounded-full text-white placeholder:text-muted-foreground focus-visible:ring-primary/50"
            />
          </div>
          <Button type="submit" disabled={!query.trim()} className="rounded-full px-5 font-medium">
            Search
          </Button>
        </form>
      </header>

      <div className="px-4">
        {!submitted && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-4 opacity-30" />
            <p className="text-sm">Search for posts, series, ships, or people</p>
          </div>
        )}

        {submitted && isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card/40 border border-white/10 rounded-2xl p-4 flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {submitted && !isLoading && data && (
          <Tabs defaultValue="all">
            <TabsList className="bg-white/5 border border-white/10 rounded-full mb-4">
              <TabsTrigger value="all" className="rounded-full text-xs">
                All ({(data.users?.length ?? 0) + (data.posts?.length ?? 0)})
              </TabsTrigger>
              <TabsTrigger value="people" className="rounded-full text-xs">
                People ({data.users?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="posts" className="rounded-full text-xs">
                Posts ({data.posts?.length ?? 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {data.users?.map((user) => (
                <UserCard key={user.id} user={user} me={me} onFollow={handleFollow} isFollowing={toggleFollow.isPending} />
              ))}
              {data.posts?.map((post) => (
                <PostResult key={post.id} post={post} />
              ))}
              {data.users?.length === 0 && data.posts?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">No results for "{submitted}"</div>
              )}
            </TabsContent>

            <TabsContent value="people" className="space-y-3">
              {data.users?.map((user) => (
                <UserCard key={user.id} user={user} me={me} onFollow={handleFollow} isFollowing={toggleFollow.isPending} />
              ))}
              {data.users?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">No people found for "{submitted}"</div>
              )}
            </TabsContent>

            <TabsContent value="posts" className="space-y-3">
              {data.posts?.map((post) => (
                <PostResult key={post.id} post={post} />
              ))}
              {data.posts?.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">No posts found for "{submitted}"</div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function UserCard({
  user,
  me,
  onFollow,
  isFollowing,
}: {
  user: { id: number; username: string; avatarUrl?: string | null; bio?: string | null; role: string };
  me?: { id: number } | null;
  onFollow: (id: number) => void;
  isFollowing: boolean;
}) {
  const isSelf = me?.id === user.id;
  return (
    <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-3">
      <Link href={`/profile/${user.id}`}>
        <Avatar className="w-10 h-10 border border-white/10 cursor-pointer">
          <AvatarImage src={user.avatarUrl || undefined} />
          <AvatarFallback className="bg-white/10 text-white text-sm">
            {user.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${user.id}`}>
          <div className="font-semibold text-white text-sm hover:underline cursor-pointer truncate">{user.username}</div>
        </Link>
        {user.bio && <p className="text-xs text-muted-foreground truncate">{user.bio}</p>}
      </div>
      {!isSelf && (
        <Button
          size="sm"
          variant="outline"
          className="rounded-full border-white/20 text-white hover:bg-white/10 shrink-0 text-xs gap-1.5"
          disabled={isFollowing}
          onClick={() => onFollow(user.id)}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Follow
        </Button>
      )}
    </div>
  );
}

function PostResult({ post }: { post: { id: number; content: string; likeCount: number; commentCount: number; createdAt: string; author: { username: string; avatarUrl?: string | null } } }) {
  return (
    <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Avatar className="w-8 h-8 border border-white/10">
          <AvatarImage src={post.author?.avatarUrl || undefined} />
          <AvatarFallback className="bg-white/10 text-white text-xs">
            {post.author?.username?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold text-white text-xs">{post.author?.username}</div>
          <div className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </div>
        </div>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed mb-3 line-clamp-3">{post.content}</p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likeCount}</span>
      </div>
    </div>
  );
}
