import { useListRaffles, getListRafflesQueryKey, useEnterRaffle, Raffle } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Clock, Users, Trophy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function RafflesPage() {
  const { data, isLoading } = useListRaffles({}, { query: { queryKey: getListRafflesQueryKey({}) } });
  
  const activeRaffles = data?.filter(r => r.status === 'active') || [];
  const otherRaffles = data?.filter(r => r.status !== 'active') || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">The Vault</h1>
        <p className="text-muted-foreground text-sm">Spend your Stars on exclusive community prizes.</p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2].map(i => (
            <Skeleton key={i} className="h-64 w-full rounded-3xl" />
          ))}
        </div>
      ) : (
        <>
          {activeRaffles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-white/80">Active Draws</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeRaffles.map(raffle => (
                  <RaffleCard key={raffle.id} raffle={raffle} />
                ))}
              </div>
            </div>
          )}

          {otherRaffles.length > 0 && (
            <div className="space-y-4 mt-12">
              <h2 className="text-lg font-medium text-white/80">Past & Upcoming</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-70 hover:opacity-100 transition-opacity">
                {otherRaffles.map(raffle => (
                  <RaffleCard key={raffle.id} raffle={raffle} />
                ))}
              </div>
            </div>
          )}

          {data?.length === 0 && (
            <div className="text-center p-12 bg-card/20 border border-white/5 rounded-3xl backdrop-blur-sm">
              <Ticket className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Vault is locked</h3>
              <p className="text-muted-foreground text-sm">No raffles available at the moment. Keep earning Stars.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RaffleCard({ raffle }: { raffle: Raffle }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const enterRaffle = useEnterRaffle();

  const handleEnter = () => {
    enterRaffle.mutate({ raffleId: raffle.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRafflesQueryKey({}) });
        toast({ title: "Entry confirmed. Good luck!" });
      },
      onError: () => {
        toast({ title: "Failed to enter raffle. Check your balance.", variant: "destructive" });
      }
    });
  };

  const isActive = raffle.status === 'active';
  const isEnded = raffle.status === 'ended';

  return (
    <div className={`relative overflow-hidden rounded-3xl border ${isActive ? 'border-primary/30 bg-card/60 backdrop-blur-xl shadow-[0_0_30px_rgba(255,255,255,0.05)]' : 'border-white/5 bg-card/20'} p-6 transition-all hover:bg-card/80`}>
      {isActive && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] pointer-events-none" />
      )}
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/80">
            {isActive ? (
              <><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Now</>
            ) : isEnded ? (
              "Concluded"
            ) : (
              "Upcoming"
            )}
          </div>
          <div className="text-right">
            <span className="block text-2xl font-bold tracking-tight text-white">{raffle.entryCost} GL</span>
            <span className="text-xs text-muted-foreground">per entry</span>
          </div>
        </div>

        <h3 className="text-2xl font-semibold text-white mb-2">{raffle.title}</h3>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed line-clamp-2">{raffle.description}</p>

        <div className="flex items-center gap-4 mb-8 text-sm font-medium text-white/60">
          <div className="flex items-center gap-1.5" title="Total Entries">
            <Users className="w-4 h-4" /> {raffle.entryCount}
          </div>
          {isActive && (
            <div className="flex items-center gap-1.5" title="Ends In">
              <Clock className="w-4 h-4" /> {formatDistanceToNow(new Date(raffle.endTime))}
            </div>
          )}
        </div>

        {isActive ? (
          <Button 
            onClick={handleEnter} 
            disabled={enterRaffle.isPending || raffle.hasEntered}
            className="w-full h-12 rounded-xl text-base font-semibold shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all bg-white text-black hover:bg-white/90"
            data-testid={`button-enter-raffle-${raffle.id}`}
          >
            {raffle.hasEntered ? "Entry Secured" : enterRaffle.isPending ? "Processing..." : "Purchase Entry"}
          </Button>
        ) : isEnded ? (
          <div className="w-full h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-white font-medium">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {raffle.winner?.username ? `Won by ${raffle.winner.username}` : 'No winner drawn'}
          </div>
        ) : (
          <Button disabled variant="outline" className="w-full h-12 rounded-xl border-white/10 bg-white/5 text-white/50">
            Opens {formatDistanceToNow(new Date(raffle.startTime), { addSuffix: true })}
          </Button>
        )}
      </div>
    </div>
  );
}
