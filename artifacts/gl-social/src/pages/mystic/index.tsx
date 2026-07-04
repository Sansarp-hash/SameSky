import MysticNav from "@/components/mystic/MysticNav";
import { useDashboardSummary, useMysticProfile } from "@/hooks/use-mystic";
import { Link } from "wouter";
import { Heart, Star, Tv, Moon, Sparkles, Zap, ChevronRight, Loader2 } from "lucide-react";
import { usePaystack } from "@/hooks/use-paystack";

export default function MysticDashboardPage() {
  const { data: summary, isLoading } = useDashboardSummary();
  const { data: profile } = useMysticProfile();
  const { upgradeMystic, loading } = usePaystack();

  return (
    <div>
      <MysticNav />

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Mystic Profile
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Your personal GL sanctuary — ships, series, tarot and the stars.
          </p>
          {profile && (
            <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${profile.subscriptionTier === "premium" ? "bg-secondary/20 text-secondary" : "bg-white/10 text-white/60"}`}>
              {profile.subscriptionTier === "premium" ? "Premium" : "Free tier"}
            </span>
          )}
        </div>

        {/* Stats grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 gap-3">
            <Link href="/mystic/ships">
              <div className="bg-white/5 hover:bg-white/8 border border-white/5 rounded-2xl p-4 cursor-pointer transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <Heart className="w-5 h-5 text-primary" />
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                </div>
                <div className="text-2xl font-bold text-white">{summary.totalShips}</div>
                <div className="text-xs text-white/50 mt-0.5">
                  Ships <span className="text-white/30">/ {summary.limits.ships}</span>
                </div>
              </div>
            </Link>

            <Link href="/mystic/actresses">
              <div className="bg-white/5 hover:bg-white/8 border border-white/5 rounded-2xl p-4 cursor-pointer transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <Star className="w-5 h-5 text-secondary fill-secondary/30" />
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                </div>
                <div className="text-2xl font-bold text-white">{summary.totalActresses}</div>
                <div className="text-xs text-white/50 mt-0.5">
                  Actresses <span className="text-white/30">/ {summary.limits.actresses}</span>
                </div>
              </div>
            </Link>

            <Link href="/mystic/series">
              <div className="bg-white/5 hover:bg-white/8 border border-white/5 rounded-2xl p-4 cursor-pointer transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <Tv className="w-5 h-5 text-blue-400" />
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                </div>
                <div className="text-2xl font-bold text-white">{summary.totalSeries}</div>
                <div className="text-xs text-white/50 mt-0.5">Series tracked</div>
              </div>
            </Link>

            <Link href="/mystic/tarot">
              <div className="bg-white/5 hover:bg-white/8 border border-white/5 rounded-2xl p-4 cursor-pointer transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <Moon className="w-5 h-5 text-purple-400" />
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                </div>
                <div className="text-sm font-semibold text-white">
                  {summary.todayTarotDone ? "Read today" : "Draw now"}
                </div>
                <div className="text-xs text-white/50 mt-0.5">Daily tarot</div>
              </div>
            </Link>
          </div>
        ) : null}

        {/* Quick actions */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest px-1">Quick actions</p>

          <Link href="/mystic/tarot">
            <div className="flex items-center gap-4 bg-white/5 hover:bg-white/8 border border-white/5 rounded-2xl px-4 py-3.5 cursor-pointer transition-all group">
              <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Moon className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">Daily Tarot Reading</p>
                <p className="text-xs text-white/40">
                  {summary?.todayTarotDone ? "Already drawn — view your cards" : "Draw your cards for today"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60" />
            </div>
          </Link>

          <Link href="/mystic/astrology">
            <div className="flex items-center gap-4 bg-white/5 hover:bg-white/8 border border-white/5 rounded-2xl px-4 py-3.5 cursor-pointer transition-all group">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">Astrology Profile</p>
                <p className="text-xs text-white/40">
                  {summary?.hasAstrology ? "View your cosmic profile" : "Generate your zodiac profile"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60" />
            </div>
          </Link>

          {/* Upgrade banner — only shown on free tier */}
          {!summary?.isPremium && (
            <div className="flex items-center gap-4 bg-secondary/10 border border-secondary/20 rounded-2xl px-4 py-4">
              <div className="w-9 h-9 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">Free tier — {summary?.limits.ships ?? 3} item limit</p>
                <p className="text-xs text-white/40">Premium unlocks 30 ships, actresses and more</p>
              </div>
              <button
                onClick={() => upgradeMystic()}
                disabled={loading === "mystic"}
                className="shrink-0 text-xs font-semibold bg-secondary/20 hover:bg-secondary/30 border border-secondary/30 text-secondary px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading === "mystic" ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Wait...</>
                ) : (
                  "Upgrade — GHS 15"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
