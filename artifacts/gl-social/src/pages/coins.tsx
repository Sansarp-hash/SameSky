import { useGetCoinBalance, getGetCoinBalanceQueryKey, useListCoinTransactions, getListCoinTransactionsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

export default function CoinsPage() {
  const { data: balanceData, isLoading: balanceLoading } = useGetCoinBalance({ query: { queryKey: getGetCoinBalanceQueryKey() } });
  const { data: txData, isLoading: txLoading } = useListCoinTransactions({}, { query: { queryKey: getListCoinTransactionsQueryKey({}) } });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Wallet</h1>
        <p className="text-muted-foreground text-sm">Manage your GL Coins.</p>
      </header>

      <div className="bg-gradient-to-br from-card/60 to-card/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-4 shadow-inner">
            <Coins className="w-8 h-8 text-primary" />
          </div>
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Available Balance</div>
          {balanceLoading ? (
            <Skeleton className="h-16 w-48 mx-auto" />
          ) : (
            <div className="text-6xl font-bold tracking-tighter text-white">
              {balanceData?.balance.toLocaleString()} <span className="text-2xl text-primary font-medium tracking-normal">GL</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium text-white/80">Transaction History</h2>
        
        <div className="bg-card/20 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden">
          {txLoading ? (
            <div className="p-6 space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : txData?.length ? (
            <div className="divide-y divide-white/5">
              {txData.map(tx => (
                <div key={tx.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/60'}`}>
                      {tx.type === 'credit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-medium text-white/90">{tx.description}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(tx.createdAt), "PPp")}</div>
                    </div>
                  </div>
                  <div className={`font-semibold text-lg ${tx.type === 'credit' ? 'text-green-400' : 'text-white/80'}`}>
                    {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 text-muted-foreground text-sm">
              No transactions yet. Start posting to earn coins.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
