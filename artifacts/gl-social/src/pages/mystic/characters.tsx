import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useCharacters, useCreateCharacter, useDeleteCharacter } from "@/hooks/use-mystic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, User } from "lucide-react";
import { type FlagType, FLAG_EMOJI, FLAG_LABEL } from "@/lib/mystic-api";

const FLAGS: FlagType[] = ["red", "yellow", "green", "forest", "magma"];

export default function MysticCharactersPage() {
  const [, params] = useRoute("/mystic/series/:id/characters");
  const seriesId = params?.id ? parseInt(params.id) : 0;

  const { data: characters = [], isLoading } = useCharacters(seriesId);
  const createCharacter = useCreateCharacter();
  const deleteCharacter = useDeleteCharacter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [flagType, setFlagType] = useState<FlagType>("green");
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function handleAdd() {
    const n = name.trim();
    if (!n) return;
    try {
      await createCharacter.mutateAsync({ seriesId, name: n, flagType, notes: notes.trim() || undefined });
      setName("");
      setNotes("");
      setShowForm(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Could not add character", description: e.message });
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteCharacter.mutateAsync(id);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  }

  return (
    <div>
      {/* Back nav */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <Link href="/mystic/series">
          <button className="text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <h1 className="text-sm font-semibold text-white">Characters</h1>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/40">{characters.length} characters in this series</p>
          <Button
            size="sm"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-full bg-primary hover:bg-primary/90 h-8 px-3 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>

        {showForm && (
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
            <Input
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
              placeholder="Character name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="flex gap-2 flex-wrap">
              {FLAGS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFlagType(f)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    flagType === f ? "bg-primary/20 text-primary border border-primary/30" : "bg-white/5 text-white/50 border border-white/10 hover:text-white/70"
                  }`}
                >
                  {FLAG_EMOJI[f]} {FLAG_LABEL[f]}
                </button>
              ))}
            </div>
            <Textarea
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl resize-none text-sm"
              placeholder="Notes (optional)"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="rounded-full text-white/50 hover:text-white flex-1">
                Cancel
              </Button>
              <Button size="sm" disabled={!name.trim() || createCharacter.isPending} onClick={handleAdd} className="rounded-full bg-primary hover:bg-primary/90 flex-1">
                Add Character
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : characters.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No characters yet for this series.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {characters.map((char) => (
              <div key={char.id} className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{FLAG_EMOJI[char.flagType as FlagType]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{char.name}</p>
                    <p className="text-xs text-white/40">{FLAG_LABEL[char.flagType as FlagType]}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(char.id)}
                    className="text-white/20 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-400/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {char.notes && (
                  <p className="mt-2 text-xs text-white/40 leading-relaxed pl-9">{char.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
