import { useState } from "react";
import MysticNav from "@/components/mystic/MysticNav";
import { useAstrologyProfile, useGenerateAstrology } from "@/hooks/use-mystic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, RefreshCw } from "lucide-react";

const ELEMENT_COLOR: Record<string, string> = {
  Fire: "text-orange-400",
  Earth: "text-green-400",
  Air: "text-blue-300",
  Water: "text-cyan-400",
};

const ZODIAC_SYMBOL: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌",
  Virgo: "♍", Libra: "♎", Scorpio: "♏", Sagittarius: "♐",
  Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

export default function MysticAstrologyPage() {
  const { data: profile, isLoading } = useAstrologyProfile();
  const generateAstrology = useGenerateAstrology();
  const { toast } = useToast();
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthLocation, setBirthLocation] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function handleGenerate() {
    if (!birthDate) return;
    try {
      await generateAstrology.mutateAsync({
        birthDate,
        birthTime: birthTime || undefined,
        birthLocation: birthLocation || undefined,
      });
      setShowForm(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Could not generate profile", description: e.message });
    }
  }

  const profileData = profile?.profileData as Record<string, any> | undefined;

  return (
    <div>
      <MysticNav />
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Astrology Profile</h1>
            <p className="text-xs text-white/40 mt-0.5">Your cosmic fandom identity</p>
          </div>
          <Sparkles className="w-5 h-5 text-amber-400" />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : profile && !showForm ? (
          <div className="space-y-4">
            {/* Sign card */}
            <div className="bg-gradient-to-br from-amber-500/10 to-purple-500/10 border border-white/10 rounded-3xl p-6 text-center">
              <div className="text-6xl mb-2">{ZODIAC_SYMBOL[profile.zodiacSign] ?? "✨"}</div>
              <h2 className="text-3xl font-bold text-white mb-1">{profile.zodiacSign}</h2>
              <p className={`text-sm font-semibold ${ELEMENT_COLOR[profile.element] ?? "text-white/60"}`}>
                {profile.element} · {profile.rulingPlanet}
              </p>
              {profile.birthTime && (
                <p className="text-xs text-white/30 mt-2">{profile.birthDate} at {profile.birthTime}</p>
              )}
              {profile.birthLocation && (
                <p className="text-xs text-white/30">{profile.birthLocation}</p>
              )}
            </div>

            {profileData?.description && (
              <div className="bg-white/5 border border-white/5 rounded-2xl px-4 py-4">
                <p className="text-sm text-white/70 leading-relaxed">{profileData.description}</p>
              </div>
            )}

            {profileData?.traits && (
              <div className="bg-white/5 border border-white/5 rounded-2xl px-4 py-4 space-y-2">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-widest">Traits</p>
                <div className="flex flex-wrap gap-2">
                  {(profileData.traits as string[]).map((trait: string) => (
                    <span key={trait} className="text-xs bg-white/10 text-white/70 px-3 py-1 rounded-full capitalize">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profileData?.glCompatibility && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-4 space-y-1">
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest">GL Compatibility</p>
                <p className="text-sm text-white/70 leading-relaxed">{profileData.glCompatibility}</p>
              </div>
            )}

            <Button
              variant="ghost"
              onClick={() => {
                setBirthDate(profile.birthDate);
                setBirthTime(profile.birthTime ?? "");
                setBirthLocation(profile.birthLocation ?? "");
                setShowForm(true);
              }}
              className="w-full rounded-2xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 h-11"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Regenerate Profile
            </Button>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
            <p className="text-sm font-semibold text-white">
              {profile ? "Update your birth details" : "Enter your birth details"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="text-xs text-white/40 mb-1.5 block">Birth date *</label>
                <Input
                  type="date"
                  className="bg-white/5 border-white/10 text-white rounded-xl"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Birth time</label>
                <Input
                  type="time"
                  className="bg-white/5 border-white/10 text-white rounded-xl"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Location</label>
                <Input
                  type="text"
                  placeholder="Bangkok, TH"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
                  value={birthLocation}
                  onChange={(e) => setBirthLocation(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              {profile && (
                <Button variant="ghost" onClick={() => setShowForm(false)} className="rounded-xl text-white/50 hover:text-white flex-1">
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleGenerate}
                disabled={!birthDate || generateAstrology.isPending}
                className="flex-1 rounded-xl bg-gradient-to-r from-amber-600 to-primary hover:from-amber-500 hover:to-primary/90 font-semibold"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generateAstrology.isPending ? "Generating..." : "Generate Profile"}
              </Button>
            </div>
          </div>
        )}

        {!profile && !showForm && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-amber-400/30" />
            <p className="text-white/30 text-sm mb-4">No astrology profile yet.</p>
            <Button
              onClick={() => setShowForm(true)}
              className="rounded-full bg-gradient-to-r from-amber-600 to-primary hover:from-amber-500"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Create Your Profile
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
