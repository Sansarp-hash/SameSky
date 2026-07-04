import { useState } from "react";
import MysticNav from "@/components/mystic/MysticNav";
import { useActresses, useCreateActress, useDeleteActress, useMysticProfile } from "@/hooks/use-mystic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Star } from "lucide-react";
import { FREE_LIMIT, PREMIUM_LIMIT } from "@/lib/mystic-api";

export default function MysticActressesPage() {
  const { data: actresses = [], isLoading } = useActresses();
  const { data: profile } = useMysticProfile();
  const createActress = useCreateActress();
  const deleteActress = useDeleteActress();
  const { toast } = useToast();
  const [newName, setNewName] = useState("");

  const limit = profile?.subscriptionTier === "premium" ? PREMIUM_LIMIT : FREE_LIMIT;
  const canAdd = actresses.length < limit;

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    try {
      await createActress.mutateAsync({ name, rankPosition: actresses.length + 1 });
      setNewName("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Could not add actress", description: e.message });
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteActress.mutateAsync(id);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  }

  return (
    <div>
      <MysticNav />
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Favourite Actresses</h1>
            <p className="text-xs text-white/40 mt-0.5">
              {actresses.length} / {limit} actresses
            </p>
          </div>
          <Star className="w-5 h-5 text-secondary" />
        </div>

        {canAdd ? (
          <div className="flex gap-2">
            <Input
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-full"
              placeholder="Actress name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button
              onClick={handleAdd}
              disabled={!newName.trim() || createActress.isPending}
              className="rounded-full bg-primary hover:bg-primary/90 px-4"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="bg-secondary/10 border border-secondary/20 rounded-2xl px-4 py-3 text-sm text-white/60">
            {profile?.subscriptionTier === "premium"
              ? `Maximum of ${PREMIUM_LIMIT} actresses reached.`
              : `Free limit of ${FREE_LIMIT} reached. Upgrade to Premium for up to ${PREMIUM_LIMIT} actresses.`}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : actresses.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No actresses yet. Add your favourite GL stars.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {actresses.map((actress, idx) => (
              <div key={actress.id} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5">
                <span className="text-xs text-white/20 w-5 text-center font-mono">#{idx + 1}</span>
                <Star className="w-4 h-4 text-secondary fill-secondary/30 flex-shrink-0" />
                <span className="flex-1 text-sm font-medium text-white">{actress.name}</span>
                <button
                  onClick={() => handleDelete(actress.id)}
                  className="text-white/20 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-400/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
