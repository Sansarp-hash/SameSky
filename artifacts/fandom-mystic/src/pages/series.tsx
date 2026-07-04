import { useState } from "react";
import { useSeries, useCreateSeries, useDeleteSeries } from "@/hooks/use-mystic";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tv, Trash2, Plus, Users } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";
import { EMOTIONAL_STATUS_EMOJI, EMOTIONAL_STATUS_LABEL, type EmotionalStatus } from "@/lib/api";

const STATUSES: EmotionalStatus[] = ["loved", "liked", "somehow", "really"];

const seriesSchema = z.object({
  title: z.string().min(1, "Title is required"),
  status: z.enum(["loved", "liked", "somehow", "really"]),
});

export default function Series() {
  const { data: series, isLoading } = useSeries();
  const createSeries = useCreateSeries();
  const deleteSeries = useDeleteSeries();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof seriesSchema>>({
    resolver: zodResolver(seriesSchema),
    defaultValues: { title: "", status: "liked" },
  });

  const onSubmit = async (data: z.infer<typeof seriesSchema>) => {
    await createSeries.mutateAsync(data);
    setOpen(false);
    form.reset();
  };

  if (isLoading || !series) return <Skeleton className="h-64" />;

  const grouped = STATUSES.reduce<Record<string, typeof series>>((acc, s) => {
    acc[s] = series.filter((item) => item.status === s);
    return acc;
  }, {} as Record<string, typeof series>);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-primary flex items-center gap-3">
            <Tv className="w-8 h-8" /> Series Tracker
          </h1>
          <p className="text-muted-foreground mt-1">Track every GL series you've journeyed through, emotionally.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Add Series
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary/20">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-primary">Chronicle a Series</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Series Title</Label>
                <Input {...form.register("title")} placeholder="e.g. Between Us" className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label>Emotional Status</Label>
                <Select
                  defaultValue="liked"
                  onValueChange={(v) => form.setValue("status", v as EmotionalStatus)}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {EMOTIONAL_STATUS_EMOJI[s]} {EMOTIONAL_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={createSeries.isPending} className="w-full">
                Chronicle
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {series.length === 0 ? (
        <Card className="border-dashed bg-transparent">
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Tv className="w-12 h-12 mb-4 opacity-20" />
            <p>No series tracked yet. Add your first GL journey.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {STATUSES.filter((s) => grouped[s].length > 0).map((status) => (
            <div key={status}>
              <h2 className="text-lg font-serif mb-3 flex items-center gap-2 text-muted-foreground">
                <span className="text-xl">{EMOTIONAL_STATUS_EMOJI[status]}</span>
                {EMOTIONAL_STATUS_LABEL[status]}
                <span className="text-sm ml-1">({grouped[status].length})</span>
              </h2>
              <div className="grid gap-3">
                {grouped[status].map((s) => (
                  <Card key={s.id} className="bg-card/50 backdrop-blur border-primary/10 hover:border-primary/30 transition-all group">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{EMOTIONAL_STATUS_EMOJI[s.status as EmotionalStatus]}</span>
                        <div>
                          <h3 className="font-semibold">{s.title}</h3>
                          <p className="text-xs text-muted-foreground">Added {new Date(s.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Link href={`/series/${s.id}/characters`}>
                            <Users className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteSeries.mutate(s.id)}
                          disabled={deleteSeries.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
