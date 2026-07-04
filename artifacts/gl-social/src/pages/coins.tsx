import { useEffect } from "react";
import { useGetCoinBalance, getGetCoinBalanceQueryKey, useListCoinTransactions, getListCoinTransactionsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { usePaystack } from "@/hooks/use-paystack";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const PACKS = [
  { id: "starter" as const, name: "Starter Pack",  stars: 100,  priceUsd: 2,  popular: false },
  { id: "fan"     as const, name: "Fan Pack",       stars: 500,  priceUsd: 8,  popular: true  },
  { id: "superfan" as const, name: "Super Fan",     stars: 1200, priceUsd: 18, popular: false },
  { id: "legend"  as const, name: "Legend Pack",    stars: 3000, priceUsd: 40, popular: false },
];

export default function CoinsPage() {
  const { data: balanceData, isLoading: balanceLoading } = useGetCoinBalance({ query: { queryKey: getGetCoinBalanceQueryKey() } });
  const { data: txData, isLoading: txLoading } = useListCoinTransactions({}, { query: { queryKey: getListCoinTransactionsQueryKey({}) } });
  const { buyStars, loading } = usePaystack();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle Paystack redirect-back
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const type = params.get("type");
    if (!payment) return;

    // Strip params from URL without reload
    const clean = window.location.pathname;
    window.history.replaceState({}, "", clean);

    if (payment === "success" && type === "coins") {
      toast({ title: "Stars added", description: "Your Stars balance has been updated." });
      queryClient.invalidateQueries({ queryKey: getGetCoinBalanceQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListCoinTransactionsQueryKey({}) });
    } else if (payment === "failed") {
      toast({ title: "Payment not completed", description: "No charge was made.", variant: "destructive" });
    }
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-1">Wallet</h1>
        <p className="text-muted-foreground text-sm">Buy Stars or track your balance.</p>
      </header>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-card/60 to-card/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-4 shadow-inner">
            <Star className="w-8 h-8 text-primary fill-primary/20" />
          </div>
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Stars Balance</div>
          {balanceLoading ? (
            <Skeleton className="h-16 w-48 mx-auto" />
          ) : (
            <div className="text-6xl font-bold tracking-tighter text-white">
              {balanceData?.balance.toLocaleString()} <span className="text-2xl text-primary font-medium tracking-normal">Stars</span>
            </div>
          )}
        </div>
      </div>

      {/* Buy Stars */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-white/80">Buy Stars</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => buyStars(pack.id)}
              disabled={loading !== null}
              className={`relative text-left rounded-2xl border p-5 transition-all group disabled:opacity-60 disabled:cursor-not-allowed
                ${pack.popular
                  ? "bg-primary/10 border-primary/30 hover:bg-primary/15"
                  : "bg-white/5 border-white/10 hover:bg-white/8"
                }`}
            >
              {pack.popular && (
                <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-widest bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  Popular
                </span>
              )}
              <div className="flex items-center gap-2 mb-3">
                <Star className={`w-4 h-4 ${pack.popular ? "text-primary fill-primary/30" : "text-white/40"}`} />
                <span className="text-xs font-semibold uppercase tracking-widest text-white/50">{pack.name}</span>
              </div>
              <div className="text-3xl font-bold text-white tracking-tight mb-0.5">
                {pack.stars.toLocaleString()}
                <span className="text-base font-medium text-primary ml-1.5">Stars</span>
              </div>
              <div className="text-sm text-white/40 mt-1">${pack.priceUsd}.00</div>

              <div className={`mt-4 text-sm font-semibold flex items-center gap-2
                ${pack.popular ? "text-primary" : "text-white/60 group-hover:text-white/90"}`}>
                {loading === pack.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  "Buy now"
                )}
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-white/30 text-center">Powered by Paystack — USD payments</p>
      </div>

      {/* Transaction history */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-white/80">Transaction History</h2>
        <div className="bg-card/20 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden">
          {txLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : txData?.length ? (
            <div className="divide-y divide-white/5">
              {txData.map(tx => (
                <div key={tx.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${["earn","purchase","bonus","raffle_refund"].includes(tx.type) ? "bg-green-500/10 text-green-400" : "bg-white/5 text-white/60"}`}>
                      {["earn","purchase","bonus","raffle_refund"].includes(tx.type) ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-medium text-white/90">{tx.description}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(tx.createdAt), "PPp")}</div>
                    </div>
                  </div>
                  <div className={`font-semibold text-lg ${["earn","purchase","bonus","raffle_refund"].includes(tx.type) ? "text-green-400" : "text-white/80"}`}>
                    {["earn","purchase","bonus","raffle_refund"].includes(tx.type) ? "+" : "-"}{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 text-muted-foreground text-sm">
              No transactions yet. Buy Stars or earn them by posting.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
