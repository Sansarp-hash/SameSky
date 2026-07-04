import { useState } from "react";
import MysticNav from "@/components/mystic/MysticNav";
import { useDrawTarot, useTarotHistory } from "@/hooks/use-mystic";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Moon } from "lucide-react";
import { type ReadingType, READING_TYPE_EMOJI, READING_TYPE_LABEL, type TarotReading } from "@/lib/mystic-api";

const READING_TYPES: ReadingType[] = ["daily", "love", "career"];

const READING_PROMPTS: Record<ReadingType, string> = {
  daily: "What energy surrounds you today in your fandom journey?",
  love: "What do the cards reveal about your ship energy right now?",
  career: "What path opens before you in your creative pursuits?",
};

function CardDisplay({ reading }: { reading: TarotReading }) {
  return (
    <div className="space-y-3">
      {(reading.cards as any[]).map((card, i) => (
        <div key={i} className="bg-white/5 border border-white/5 rounded-2xl px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Moon className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-white">{card.name}</span>
                {card.isReversed && (
                  <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">Reversed</span>
                )}
              </div>
              <p className="text-xs text-white/40 mt-0.5">{card.suit}</p>
              <p className="text-sm text-white/70 mt-2 leading-relaxed">{card.meaning}</p>
            </div>
          </div>
        </div>
      ))}
      <p className="text-xs text-white/25 text-center">
        Drawn {new Date(reading.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}

export default function MysticTarotPage() {
  const [activeType, setActiveType] = useState<ReadingType>("daily");
  const drawTarot = useDrawTarot();
  const { data: history = [] } = useTarotHistory();
  const { toast } = useToast();

  const today = new Date().toISOString().slice(0, 10);
  const todayReadings = history.filter(
    (r) => r.createdAt.slice(0, 10) === today
  );
  const currentReading = todayReadings.find((r) => r.readingType === activeType);
  const pastReadings = history.filter((r) => r.readingType === activeType && r.createdAt.slice(0, 10) !== today);

  async function handleDraw() {
    try {
      await drawTarot.mutateAsync(activeType);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Could not draw", description: e.message });
    }
  }

  return (
    <div>
      <MysticNav />
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Tarot Reading</h1>
            <p className="text-xs text-white/40 mt-0.5">One reading per type per day</p>
          </div>
          <Moon className="w-5 h-5 text-purple-400" />
        </div>

        {/* Reading type selector */}
        <div className="flex gap-2 bg-white/5 rounded-2xl p-1.5">
          {READING_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeType === type ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              <span>{READING_TYPE_EMOJI[type]}</span>
              <span className="hidden sm:inline">{READING_TYPE_LABEL[type]}</span>
              <span className="sm:hidden capitalize">{type}</span>
            </button>
          ))}
        </div>

        {/* Prompt */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl px-4 py-3">
          <p className="text-sm text-white/70 italic">{READING_PROMPTS[activeType]}</p>
        </div>

        {/* Current reading or draw button */}
        {currentReading ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest px-1">Today's reading</p>
            <CardDisplay reading={currentReading} />
          </div>
        ) : (
          <Button
            onClick={handleDraw}
            disabled={drawTarot.isPending}
            className="w-full rounded-2xl h-14 bg-gradient-to-r from-purple-600 to-primary hover:from-purple-500 hover:to-primary/90 font-semibold text-base"
          >
            {drawTarot.isPending ? "Drawing..." : `Draw ${READING_TYPE_LABEL[activeType]} Cards`}
          </Button>
        )}

        {/* History */}
        {pastReadings.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest px-1">Past readings</p>
            <div className="space-y-4">
              {pastReadings.slice(0, 5).map((r) => (
                <div key={r.id}>
                  <CardDisplay reading={r} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
