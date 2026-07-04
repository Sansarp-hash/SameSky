import { useState } from "react";
import { useDrawTarot, useTarotHistory } from "@/hooks/use-mystic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sparkles, RotateCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  type TarotCard,
  type ReadingType,
  READING_TYPE_EMOJI,
  READING_TYPE_LABEL,
} from "@/lib/api";

const READING_TYPES: ReadingType[] = ["daily", "love", "career"];

const SUIT_COLOR: Record<string, string> = {
  "Major Arcana": "text-primary border-primary/40 bg-primary/10",
  "Cups": "text-blue-400 border-blue-400/40 bg-blue-400/10",
  "Wands": "text-orange-400 border-orange-400/40 bg-orange-400/10",
  "Pentacles": "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  "Swords": "text-slate-400 border-slate-400/40 bg-slate-400/10",
};

function TarotCardDisplay({ card, index }: { card: TarotCard; index: number }) {
  const suitClass = SUIT_COLOR[card.suit] ?? "text-muted-foreground border-border bg-muted/10";
  return (
    <Card
      className="bg-card/60 backdrop-blur border-primary/20 hover:border-primary/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-serif text-lg leading-snug">
            {card.isReversed ? "🔄 " : ""}{card.name}
          </CardTitle>
          <Badge variant="outline" className={`text-xs shrink-0 ${suitClass}`}>
            {card.suit}
          </Badge>
        </div>
        {card.isReversed && (
          <p className="text-xs text-muted-foreground italic">Reversed</p>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{card.meaning}</p>
      </CardContent>
    </Card>
  );
}

export default function Tarot() {
  const { data: history, isLoading } = useTarotHistory();
  const drawTarot = useDrawTarot();
  const [selectedType, setSelectedType] = useState<ReadingType>("daily");

  const today = new Date().toISOString().slice(0, 10);

  const todayReadings = history?.filter(
    (r) => new Date(r.createdAt).toISOString().slice(0, 10) === today
  ) ?? [];

  const todayReading = todayReadings.find((r) => r.readingType === selectedType);

  const handleDraw = () => {
    drawTarot.mutate(selectedType);
  };

  if (isLoading) return <Skeleton className="h-64" />;

  const pastReadings = history?.filter(
    (r) => new Date(r.createdAt).toISOString().slice(0, 10) !== today
  ) ?? [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif text-primary flex items-center gap-3">
          <Moon className="w-8 h-8" /> Tarot Reader
        </h1>
        <p className="text-muted-foreground mt-1">Draw your daily cards and seek cosmic guidance for your GL journey.</p>
      </div>

      {/* Reading type selector */}
      <div className="flex gap-2 flex-wrap">
        {READING_TYPES.map((type) => {
          const done = todayReadings.some((r) => r.readingType === type);
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                selectedType === type
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                  : "bg-card/50 border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
            >
              {READING_TYPE_EMOJI[type]} {READING_TYPE_LABEL[type]}
              {done && <span className="ml-2 text-xs opacity-70">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Today's reading for the selected type */}
      <Card className="bg-card/60 backdrop-blur border-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {READING_TYPE_EMOJI[selectedType]} {READING_TYPE_LABEL[selectedType]}
          </CardTitle>
          <CardDescription>
            {todayReading
              ? `${todayReading.cards.length} card${todayReading.cards.length > 1 ? "s" : ""} drawn today`
              : "This reading is waiting for you"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayReading ? (
            <div className="space-y-4">
              {(todayReading.cards as TarotCard[]).map((card, i) => (
                <TarotCardDisplay key={i} card={card} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 gap-4">
              <Moon className="w-20 h-20 text-primary/30" />
              <p className="text-muted-foreground text-center max-w-xs">
                {selectedType === "daily"
                  ? "Clear your mind and receive today's guidance."
                  : selectedType === "love"
                  ? "Open your heart and let the cards speak about your connections."
                  : "Focus on your ambitions. The cards will illuminate your path."}
              </p>
              <Button
                onClick={handleDraw}
                disabled={drawTarot.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-serif tracking-widest px-8"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {drawTarot.isPending ? "Drawing..." : "Draw Cards"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past readings */}
      {pastReadings.length > 0 && (
        <div>
          <h2 className="text-xl font-serif mb-4 flex items-center gap-2 text-muted-foreground">
            <RotateCcw className="w-4 h-4" /> Past Readings
          </h2>
          <div className="space-y-6">
            {pastReadings.slice(0, 9).map((reading) => (
              <div key={reading.id}>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {new Date(reading.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {READING_TYPE_EMOJI[reading.readingType as ReadingType]} {READING_TYPE_LABEL[reading.readingType as ReadingType]}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {(reading.cards as TarotCard[]).map((card, i) => (
                    <TarotCardDisplay key={i} card={card} index={0} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
