import { useState } from "react";
import { useShips, useCreateShip, useDeleteShip, useDashboardSummary } from "@/hooks/use-mystic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Trash2, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const shipSchema = z.object({
  shipName: z.string().min(2, "Name must be at least 2 characters"),
  rankPosition: z.coerce.number().min(1).max(30),
});

export default function Ships() {
  const { data: ships, isLoading } = useShips();
  const { data: summary } = useDashboardSummary();
  const createShip = useCreateShip();
  const deleteShip = useDeleteShip();
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(shipSchema),
    defaultValues: { shipName: "", rankPosition: 1 },
  });

  const onSubmit = async (data: z.infer<typeof shipSchema>) => {
    await createShip.mutateAsync(data);
    setOpen(false);
    form.reset();
  };

  const isAtLimit = summary && summary.totalShips >= summary.limits.ships;

  if (isLoading || !ships) return <Skeleton className="h-64" />;

  const sortedShips = [...ships].sort((a, b) => a.rankPosition - b.rankPosition);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-primary flex items-center gap-3">
            <Heart className="w-8 h-8" /> My Ships
          </h1>
          <p className="text-muted-foreground mt-1">Curate your most cherished GL pairings.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={isAtLimit} className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50">
              <Plus className="w-4 h-4 mr-2" />
              Add Ship
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary/20">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-primary">Declare a New Ship</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Ship Name (e.g. FreenBecky)</Label>
                <Input {...form.register("shipName")} placeholder="Name..." className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label>Rank (1-30)</Label>
                <Input type="number" {...form.register("rankPosition")} className="bg-background/50" />
              </div>
              <Button type="submit" disabled={createShip.isPending} className="w-full">
                Manifest
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isAtLimit && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
          You've reached your limit of {summary.limits.ships} ships. Upgrade to Premium in Settings for more.
        </div>
      )}

      {sortedShips.length === 0 ? (
        <Card className="border-dashed bg-transparent">
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Heart className="w-12 h-12 mb-4 opacity-20" />
            <p>Your harbor is empty. Add a ship to start.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedShips.map((ship) => (
            <Card key={ship.id} className="bg-card/50 backdrop-blur border-primary/10 hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-serif text-primary font-bold">
                    #{ship.rankPosition}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{ship.shipName}</h3>
                    <p className="text-xs text-muted-foreground">Added {new Date(ship.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => deleteShip.mutate(ship.id)}
                  disabled={deleteShip.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
