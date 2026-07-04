import { useState } from "react";
import MysticNav from "@/components/mystic/MysticNav";
import { useSeries, useCreateSeries, useDeleteSeries } from "@/hooks/use-mystic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Tv, ChevronRight } from "lucide-react";
import { type EmotionalStatus, EMOTIONAL_STATUS_EMOJI, EMOTIONAL_STATUS_LABEL } from "@/lib/mystic-api";
import { Link } from "wouter";

const STATUSES: EmotionalStatus[] = ["loved", "liked", "somehow", "really"];

export default function MysticSeriesPage() {
  const { data: series = [], isLoading } = useSeries();
  const createSeries = useCreateSeries();
  const deleteSeries = useDeleteSeries();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<EmotionalStatus>("liked");

  async function handleAdd() {
    const t = title.trim();
    if (!t) return;
    try {
      await createSeries.mutateAsync({ title: t, status });
      setTitle("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Could not add series", description: e.message });
    }
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteSeries.mutateAsync(id);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  }

  const grouped = STATUSES.reduce<Record<EmotionalStatus, typeof series>>((acc, s) => {
    acc[s] = series.filter((x) => x.status === s);
    return acc;
  }, {} as any);

  return (
    <div>
      <MysticNav />
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Series Tracker</h1>
            <p className="text-xs text-white/40 mt-0.5">{series.length} series tracked</p>
          </div>
          <Tv className="w-5 h-5 text-blue-400" />
        </div>

        {/* Add form */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
          <Input
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
            placeholder="Series title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  status === s ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/5 text-white/50 border border-white/10 hover:text-white/70"
                }`}
              >
                {EMOTIONAL_STATUS_EMOJI[s]} {EMOTIONAL_STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <Button
            onClick={handleAdd}
            disabled={!title.trim() || createSeries.isPending}
            className="w-full rounded-xl bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Series
          </Button>
        </div>

        {/* Grouped list */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : series.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Tv className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No series tracked yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {STATUSES.filter((s) => grouped[s].length > 0).map((s) => (
              <div key={s}>
                <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2 px-1">
                  {EMOTIONAL_STATUS_EMOJI[s]} {EMOTIONAL_STATUS_LABEL[s]}
                </p>
                <div className="space-y-2">
                  {grouped[s].map((item) => (
                    <Link key={item.id} href={`/mystic/series/${item.id}/characters`}>
                      <div className="flex items-center gap-3 bg-white/5 border border-white/5 hover:bg-white/8 rounded-2xl px-4 py-3.5 cursor-pointer transition-all group">
                        <Tv className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="flex-1 text-sm font-medium text-white">{item.title}</span>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                        <button
                          onClick={(e) => handleDelete(item.id, e)}
                          className="text-white/20 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-400/10 ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
