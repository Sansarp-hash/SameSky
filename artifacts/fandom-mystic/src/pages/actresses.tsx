import { useState } from "react";
import { useActresses, useCreateActress, useDeleteActress, useDashboardSummary } from "@/hooks/use-mystic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, Trash2, Plus } from "lucide-react";
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

const actressSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  rankPosition: z.coerce.number().min(1).max(30),
});

export default function Actresses() {
  const { data: actresses, isLoading } = useActresses();
  const { data: summary } = useDashboardSummary();
  const createActress = useCreateActress();
  const deleteActress = useDeleteActress();
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(actressSchema),
    defaultValues: { name: "", rankPosition: 1 },
  });

  const onSubmit = async (data: z.infer<typeof actressSchema>) => {
    await createActress.mutateAsync(data);
    setOpen(false);
    form.reset();
  };

  const isAtLimit = summary && summary.totalActresses >= summary.limits.actresses;

  if (isLoading || !actresses) return <Skeleton className="h-64" />;

  const sortedActresses = [...actresses].sort((a, b) => a.rankPosition - b.rankPosition);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-secondary flex items-center gap-3">
            <Star className="w-8 h-8" /> Favorite Actresses
          </h1>
          <p className="text-muted-foreground mt-1">Honor the stars that light up your world.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={isAtLimit} className="bg-secondary/20 text-secondary hover:bg-secondary/30 border border-secondary/50">
              <Plus className="w-4 h-4 mr-2" />
              Add Actress
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-secondary/20">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-secondary">Acknowledge a Star</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Actress Name</Label>
                <Input {...form.register("name")} placeholder="Name..." className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label>Rank (1-30)</Label>
                <Input type="number" {...form.register("rankPosition")} className="bg-background/50" />
              </div>
              <Button type="submit" disabled={createActress.isPending} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Acknowledge
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isAtLimit && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
          You've reached your limit of {summary.limits.actresses} actresses. Upgrade to Premium in Settings for more.
        </div>
      )}

      {sortedActresses.length === 0 ? (
        <Card className="border-dashed bg-transparent">
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Star className="w-12 h-12 mb-4 opacity-20" />
            <p>Your night sky is empty. Add an actress to start.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedActresses.map((actress) => (
            <Card key={actress.id} className="bg-card/50 backdrop-blur border-secondary/10 hover:border-secondary/30 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center font-serif text-secondary font-bold">
                    #{actress.rankPosition}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{actress.name}</h3>
                    <p className="text-xs text-muted-foreground">Added {new Date(actress.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => deleteActress.mutate(actress.id)}
                  disabled={deleteActress.isPending}
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
