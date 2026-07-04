import { useGetUser, getGetUserQueryKey, useGetMe, getGetMeQueryKey, useListPosts, getListPostsQueryKey, useToggleFollow, useListFollowers, useListFollowing, getListFollowersQueryKey, getListFollowingQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, CheckCircle2, UserPlus, UserCheck } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ProfilePage() {
  const params = useParams();
  const isMe = !params.userId || params.userId === "me";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [followLoading, setFollowLoading] = useState(false);
  const [localFollowing, setLocalFollowing] = useState<boolean | null>(null);

  const { data: meData, isLoading: meLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: userData, isLoading: userLoading } = useGetUser(
    params.userId || "",
    { query: { queryKey: getGetUserQueryKey(params.userId || ""), enabled: !isMe } }
  );

  const user = isMe ? meData : userData;
  const isLoading = isMe ? meLoading : userLoading;

  const targetId = isMe ? meData?.id : userData?.id;

  const { data: followersData } = useListFollowers(targetId ?? 0, {
    query: { queryKey: getListFollowersQueryKey(targetId ?? 0), enabled: !!targetId },
  });
  const { data: followingData } = useListFollowing(targetId ?? 0, {
    query: { queryKey: getListFollowingQueryKey(targetId ?? 0), enabled: !!targetId },
  });

  const toggleFollow = useToggleFollow();

  const followerCount = followersData?.length ?? 0;
  const followingCount = followingData?.length ?? 0;

  const isFollowingUser =
    localFollowing !== null
      ? localFollowing
      : !!(followersData && meData && followersData.some((f) => f.id === meData.id));

  const handleFollow = () => {
    if (!targetId) return;
    setFollowLoading(true);
    setLocalFollowing(!isFollowingUser);
    toggleFollow.mutate(
      { userId: targetId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFollowersQueryKey(targetId) });
          queryClient.invalidateQueries({ queryKey: getListFollowingQueryKey(targetId) });
          toast({ title: isFollowingUser ? "Unfollowed." : "Following!" });
        },
        onError: () => {
          setLocalFollowing(isFollowingUser);
          toast({ title: "Something went wrong", variant: "destructive" });
        },
        onSettled: () => setFollowLoading(false),
      }
    );
  };

  const { data: postsData, isLoading: postsLoading } = useListPosts(
    {},
    { query: { queryKey: getListPostsQueryKey({}) } }
  );
  const userPosts = postsData?.posts.filter((p) => p.authorId === user?.id) || [];

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
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
    <div className="space-y-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-card/40 backdrop-blur-xl border-b border-white/5 p-6 relative overflow-hidden">
        <div className={`absolute inset-0 pointer-events-none opacity-10 ${user.role === "admin" ? "bg-gradient-to-br from-red-500" : "bg-gradient-to-br from-primary"}`} />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <Avatar className="w-20 h-20 border-2 border-white/20 shadow-xl">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback className="bg-white/10 text-white text-2xl font-light">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                {user.username}
                {user.ageVerified && <CheckCircle2 className="w-4 h-4 text-primary" title="Verified" />}
              </h1>
              {!isMe && meData && (
                <Button
                  size="sm"
                  variant={isFollowingUser ? "outline" : "default"}
                  className={`rounded-full px-5 font-medium gap-2 ${isFollowingUser ? "border-white/20 text-white hover:bg-white/10 hover:text-white" : ""}`}
                  disabled={followLoading}
                  onClick={handleFollow}
                >
                  {isFollowingUser ? (
                    <><UserCheck className="w-4 h-4" /> Following</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Follow</>
                  )}
                </Button>
              )}
            </div>
            <div className="text-sm text-primary/80 capitalize tracking-wide mb-2">{user.role} Member</div>
            {user.bio && <p className="text-foreground/70 text-sm leading-relaxed max-w-md mb-3">{user.bio}</p>}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
              <span><span className="font-semibold text-white">{followerCount}</span> followers</span>
              <span><span className="font-semibold text-white">{followingCount}</span> following</span>
              {user.country && (
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {user.country}</span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Joined {format(new Date(user.createdAt), "MMM yyyy")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <h2 className="text-base font-semibold text-white/70">Posts</h2>

        {postsLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : userPosts.length > 0 ? (
          <div className="space-y-4">
            {userPosts.map((post) => (
              <div key={post.id} className="bg-card/30 border border-white/5 p-5 rounded-2xl">
                <div className="text-xs text-muted-foreground mb-3">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </div>
                <p className="text-white/90 whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
                {post.imageUrl && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
                    <img src={post.imageUrl} alt="Post" className="w-full max-h-60 object-cover" />
                  </div>
                )}
                <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
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
