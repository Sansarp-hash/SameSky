import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useCharacters, useCreateCharacter, useDeleteCharacter, useSeries } from "@/hooks/use-mystic";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
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
import { FLAG_EMOJI, FLAG_LABEL, type FlagType } from "@/lib/api";

const FLAG_TYPES: FlagType[] = ["red_flag", "yellow_flag", "green_flag", "green_forest", "red_magma"];

const characterSchema = z.object({
  characterName: z.string().min(1, "Name is required"),
  flagType: z.enum(["red_flag", "yellow_flag", "green_flag", "green_forest", "red_magma"]),
});

export default function Characters() {
  const [, params] = useRoute("/series/:id/characters");
  const seriesId = params ? parseInt(params.id) : undefined;

  const { data: seriesList } = useSeries();
  const { data: characters, isLoading } = useCharacters(seriesId);
  const createCharacter = useCreateCharacter();
  const deleteCharacter = useDeleteCharacter();
  const [open, setOpen] = useState(false);

  const seriesItem = seriesList?.find((s) => s.id === seriesId);

  const form = useForm<z.infer<typeof characterSchema>>({
    resolver: zodResolver(characterSchema),
    defaultValues: { characterName: "", flagType: "green_flag" },
  });

  const onSubmit = async (data: z.infer<typeof characterSchema>) => {
    if (!seriesId) return;
    await createCharacter.mutateAsync({ seriesId, ...data });
    setOpen(false);
    form.reset();
  };

  if (isLoading || !characters) return <Skeleton className="h-64" />;

  const grouped = FLAG_TYPES.reduce<Record<string, typeof characters>>((acc, f) => {
    acc[f] = characters.filter((c) => c.flagType === f);
    return acc;
  }, {} as Record<string, typeof characters>);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-2">
        <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Link href="/series">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-serif text-primary">
            {seriesItem ? seriesItem.seriesName : "Series"} — Characters
          </h1>
          <p className="text-sm text-muted-foreground">Flag each character based on their energy</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="border border-primary/50 bg-primary/10 text-primary hover:bg-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Add Character
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary/20">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-primary">Flag a Character</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Character Name</Label>
                <Input {...form.register("characterName")} placeholder="e.g. Fah" className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label>Flag</Label>
                <Select
                  defaultValue="green_flag"
                  onValueChange={(v) => form.setValue("flagType", v as FlagType)}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FLAG_TYPES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {FLAG_EMOJI[f]} {FLAG_LABEL[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={createCharacter.isPending} className="w-full">
                Flag Character
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {characters.length === 0 ? (
        <Card className="border-dashed bg-transparent">
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <span className="text-5xl mb-4">🏳️</span>
            <p>No characters flagged yet. Start analyzing.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {FLAG_TYPES.filter((f) => grouped[f].length > 0).map((flag) => (
            <div key={flag}>
              <h2 className="text-base font-serif mb-3 flex items-center gap-2 text-muted-foreground">
                <span className="text-xl">{FLAG_EMOJI[flag]}</span>
                {FLAG_LABEL[flag]}
                <span className="text-sm ml-1">({grouped[flag].length})</span>
              </h2>
              <div className="grid gap-2">
                {grouped[flag].map((c) => (
                  <Card key={c.id} className="bg-card/50 backdrop-blur border-primary/10 hover:border-primary/30 transition-all">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{FLAG_EMOJI[c.flagType as FlagType]}</span>
                        <span className="font-medium">{c.characterName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-8 h-8"
                        onClick={() => deleteCharacter.mutate(c.id)}
                        disabled={deleteCharacter.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
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
