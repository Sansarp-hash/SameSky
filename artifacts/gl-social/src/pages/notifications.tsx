import { useListNotifications, getListNotificationsQueryKey, useMarkNotificationRead, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Check, Trophy, Heart, MessageCircle, Coins as CoinsIcon, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useListNotifications({}, { query: { queryKey: getListNotificationsQueryKey({}) } });
  
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({}) });
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({ unreadOnly: true }) });
      }
    });
  };

  const handleMarkRead = (id: number) => {
    markRead.mutate({ notificationId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({}) });
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({ unreadOnly: true }) });
      }
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'raffle_won': return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'post_liked': return <Heart className="w-5 h-5 text-primary" />;
      case 'post_commented': return <MessageCircle className="w-5 h-5 text-blue-400" />;
      case 'coin_received': return <CoinsIcon className="w-5 h-5 text-green-400" />;
      default: return <Info className="w-5 h-5 text-white/60" />;
    }
  };

  const unreadCount = data?.filter(n => !n.isRead).length || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Notifications</h1>
          <p className="text-muted-foreground text-sm">Updates and alerts.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={markAllRead.isPending} className="text-muted-foreground hover:text-white">
            <Check className="w-4 h-4 mr-2" /> Mark all read
          </Button>
        )}
      </header>

      <div className="bg-card/20 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
          </div>
        ) : data?.length ? (
          <div className="divide-y divide-white/5">
            {data.map(notif => (
              <div 
                key={notif.id} 
                className={`p-5 flex gap-4 transition-colors ${notif.isRead ? 'opacity-60' : 'bg-white/5 hover:bg-white/10 cursor-pointer'}`}
                onClick={() => !notif.isRead && handleMarkRead(notif.id)}
              >
                <div className={`mt-1 shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${notif.isRead ? 'bg-white/5' : 'bg-white/10 shadow-inner'}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className={`text-sm font-medium ${notif.isRead ? 'text-white/80' : 'text-white'}`}>{notif.title}</h4>
                    <span className="text-xs text-muted-foreground shrink-0 ml-4">{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
                </div>
                {!notif.isRead && (
                  <div className="shrink-0 flex items-center justify-center w-8">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-16 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-lg font-medium text-white/80 mb-1">You're all caught up</h3>
            <p className="text-sm text-muted-foreground">No new notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
