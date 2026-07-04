import { useState } from "react";
import { useAstrologyProfile, useGenerateAstrology } from "@/hooks/use-mystic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, RefreshCw, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const ELEMENT_ICON: Record<string, string> = {
  Fire: "🔥",
  Earth: "🌍",
  Air: "💨",
  Water: "💧",
};

const ZODIAC_ICON: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

export default function Astrology() {
  const { data: profile, isLoading } = useAstrologyProfile();
  const generate = useGenerateAstrology();
  const [birthDate, setBirthDate] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate) return;
    await generate.mutateAsync({ birthDate });
    setShowForm(false);
  };

  if (isLoading) return <Skeleton className="h-64" />;

  const profileData = profile?.profileData as {
    traits: string[];
    compatibility: string[];
    strengths: string[];
    description: string;
    glCompatibility: string;
  } | undefined;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-secondary flex items-center gap-3">
            <Star className="w-8 h-8" /> Astrology Profile
          </h1>
          <p className="text-muted-foreground mt-1">Discover how the stars shape your GL fandom soul.</p>
        </div>
        {profile && (
          <Button
            variant="outline"
            className="border-secondary/40 text-secondary hover:bg-secondary/10"
            onClick={() => setShowForm(!showForm)}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
        )}
      </div>

      {(!profile || showForm) && (
        <Card className="bg-card/60 backdrop-blur border-secondary/20">
          <CardHeader>
            <CardTitle className="font-serif text-xl text-secondary">
              {profile ? "Update Your Birthdate" : "Generate Your Cosmic Profile"}
            </CardTitle>
            <CardDescription>Enter your birth date to receive your personalized astrology reading</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="space-y-2 flex-1">
                <Label>Birth Date</Label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="bg-background/50"
                  max={new Date().toISOString().slice(0, 10)}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={generate.isPending || !birthDate}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-serif tracking-widest"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generate.isPending ? "Reading stars..." : "Read the Stars"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {profile && profileData && (
        <div className="space-y-6">
          {/* Main identity card */}
          <Card className="bg-card/60 backdrop-blur border-secondary/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 pointer-events-none" />
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-24 h-24 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center">
                    <span className="text-5xl">{ZODIAC_ICON[profile.zodiacSign] ?? "✨"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(profile.birthDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-serif text-secondary mb-1">{profile.zodiacSign}</h2>
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                    <Badge variant="outline" className="border-secondary/40 text-secondary">
                      {ELEMENT_ICON[profile.element]} {profile.element}
                    </Badge>
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      ⊕ {profile.rulingPlanet}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                    {profileData.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Traits & Strengths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur border-primary/15">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-primary">Your Traits ✨</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profileData.traits.map((trait) => (
                    <Badge key={trait} variant="outline" className="border-primary/30 text-primary capitalize">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-secondary/15">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-serif text-secondary">Core Strengths 💫</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profileData.strengths.map((s) => (
                    <Badge key={s} variant="outline" className="border-secondary/30 text-secondary capitalize">
                      {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* GL Compatibility */}
          <Card className="bg-card/50 backdrop-blur border-accent/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif flex items-center gap-2">
                <span>🌸</span> GL Compatibility
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{profileData.glCompatibility}</p>
              {profileData.compatibility.length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Resonates with:</span>
                  {profileData.compatibility.map((sign) => (
                    <Badge key={sign} variant="outline" className="text-xs border-accent/30">
                      {ZODIAC_ICON[sign] ?? ""} {sign}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
