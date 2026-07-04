import { useState } from "react";
import MysticNav from "@/components/mystic/MysticNav";
import { useShips, useCreateShip, useDeleteShip, useMysticProfile } from "@/hooks/use-mystic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Heart } from "lucide-react";
import { FREE_LIMIT, PREMIUM_LIMIT } from "@/lib/mystic-api";

export default function MysticShipsPage() {
  const { data: ships = [], isLoading } = useShips();
  const { data: profile } = useMysticProfile();
  const createShip = useCreateShip();
  const deleteShip = useDeleteShip();
  const { toast } = useToast();
  const [newShipName, setNewShipName] = useState("");

  const limit = profile?.subscriptionTier === "premium" ? PREMIUM_LIMIT : FREE_LIMIT;
  const canAdd = ships.length < limit;

  async function handleAdd() {
    const name = newShipName.trim();
    if (!name) return;
    try {
      await createShip.mutateAsync({ shipName: name, rankPosition: ships.length + 1 });
      setNewShipName("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Could not add ship", description: e.message });
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteShip.mutateAsync(id);
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
            <h1 className="text-xl font-bold text-white">GL Ships</h1>
            <p className="text-xs text-white/40 mt-0.5">
              {ships.length} / {limit} ships
            </p>
          </div>
          <Heart className="w-5 h-5 text-primary" />
        </div>

        {/* Add form */}
        {canAdd ? (
          <div className="flex gap-2">
            <Input
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-full"
              placeholder="Ship name (e.g. EngSub, PatPran)"
              value={newShipName}
              onChange={(e) => setNewShipName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button
              onClick={handleAdd}
              disabled={!newShipName.trim() || createShip.isPending}
              className="rounded-full bg-primary hover:bg-primary/90 px-4"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="bg-secondary/10 border border-secondary/20 rounded-2xl px-4 py-3 text-sm text-white/60">
            {profile?.subscriptionTier === "premium"
              ? `Maximum of ${PREMIUM_LIMIT} ships reached.`
              : `Free limit of ${FREE_LIMIT} reached. Upgrade to Premium for up to ${PREMIUM_LIMIT} ships.`}
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : ships.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No ships yet. Add your favourite GL pairs.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ships.map((ship, idx) => (
              <div key={ship.id} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5">
                <span className="text-xs text-white/20 w-5 text-center font-mono">#{idx + 1}</span>
                <Heart className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="flex-1 text-sm font-medium text-white">{ship.shipName}</span>
                <button
                  onClick={() => handleDelete(ship.id)}
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
