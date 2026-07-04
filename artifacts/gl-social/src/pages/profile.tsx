import { useGetUser, getGetUserQueryKey, useGetMe, getGetMeQueryKey, useListPosts, getListPostsQueryKey } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
  const params = useParams();
  const isMe = !params.userId || params.userId === "me";
  
  const { data: meData, isLoading: meLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey(), enabled: isMe } });
  const { data: userData, isLoading: userLoading } = useGetUser(params.userId || "", { query: { queryKey: getGetUserQueryKey(params.userId || ""), enabled: !isMe } });
  
  const user = isMe ? meData : userData;
  const isLoading = isMe ? meLoading : userLoading;

  const { data: postsData, isLoading: postsLoading } = useListPosts({}, { query: { queryKey: getListPostsQueryKey({}) } });
  const userPosts = postsData?.posts.filter(p => p.authorId === user?.id) || [];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="bg-card/40 border border-white/5 rounded-3xl p-8 flex flex-col items-center">
          <Skeleton className="w-24 h-24 rounded-full mb-4" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="text-center p-12 text-white">User not found</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
        {/* Subtle background glow based on role */}
        <div className={`absolute inset-0 pointer-events-none opacity-20 ${user.role === 'admin' ? 'bg-gradient-to-br from-red-500/30' : 'bg-gradient-to-br from-primary/20'}`} />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <Avatar className="w-24 h-24 border-2 border-white/20 shadow-xl">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback className="bg-white/10 text-white text-3xl font-light">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                {user.username}
                {user.ageVerified && <CheckCircle2 className="w-5 h-5 text-primary" title="Verified" />}
              </h1>
              <div className="text-sm font-medium text-primary mt-1 capitalize tracking-wide">{user.role} Member</div>
            </div>
            
            {user.bio && <p className="text-foreground/80 leading-relaxed max-w-md">{user.bio}</p>}
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground pt-2">
              {user.country && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {user.country}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Joined {format(new Date(user.createdAt), "MMM yyyy")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-white/80">Posts</h2>
        
        {postsLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : userPosts.length > 0 ? (
          <div className="space-y-4">
            {userPosts.map(post => (
              <div key={post.id} className="bg-card/20 border border-white/5 p-5 rounded-2xl">
                <div className="text-xs text-muted-foreground mb-3">{format(new Date(post.createdAt), "PPp")}</div>
                <p className="text-white/90 whitespace-pre-wrap">{post.content}</p>
                <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                  <span>{post.likeCount} likes</span>
                  <span>{post.commentCount} replies</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 bg-card/20 border border-white/5 rounded-2xl text-muted-foreground text-sm">
            No posts yet.
          </div>
        )}
      </div>
    </div>
  );
}
