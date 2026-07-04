import { useDashboardSummary } from "@/hooks/use-mystic";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Heart, Star, Tv, Moon, Sun } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading } = useDashboardSummary();

  if (isLoading || !summary) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const shipPercentage = (summary.totalShips / summary.limits.ships) * 100;
  const actressPercentage = (summary.totalActresses / summary.limits.actresses) * 100;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-serif text-primary mb-2">Welcome, {user?.username}</h1>
        <p className="text-muted-foreground">Your mystical sanctuary awaits. Explore the stars and your favorite ships.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" /> Ships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalShips}</div>
            <Progress value={shipPercentage} className="h-1 mt-3 bg-primary/20" />
            <p className="text-xs text-muted-foreground mt-2">{summary.totalShips} / {summary.limits.ships} limit</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4 text-secondary" /> Actresses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalActresses}</div>
            <Progress value={actressPercentage} className="h-1 mt-3 bg-secondary/20" />
            <p className="text-xs text-muted-foreground mt-2">{summary.totalActresses} / {summary.limits.actresses} limit</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Tv className="w-4 h-4 text-accent" /> Series
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSeries}</div>
            <p className="text-xs text-muted-foreground mt-2">Tracked emotionally</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-destructive" /> Characters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCharacters}</div>
            <p className="text-xs text-muted-foreground mt-2">Analyzed & flagged</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card/50 backdrop-blur border-primary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Moon className="w-32 h-32 text-primary" />
          </div>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2 text-primary">
              <Moon className="w-5 h-5" /> Daily Tarot
            </CardTitle>
            <CardDescription>Seek guidance from the cards</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.todayTarotDone ? (
              <p className="text-sm text-muted-foreground mb-4">You've drawn your cards for today. Reflect on their meaning.</p>
            ) : (
              <p className="text-sm mb-4">The cards are waiting for you today. What will they reveal?</p>
            )}
            <Button asChild variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
              <Link href="/tarot">{summary.todayTarotDone ? "View Reading" : "Draw Cards"}</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-secondary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sun className="w-32 h-32 text-secondary" />
          </div>
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2 text-secondary">
              <Star className="w-5 h-5" /> Astrology Profile
            </CardTitle>
            <CardDescription>Align with the stars</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.hasAstrology ? (
              <p className="text-sm text-muted-foreground mb-4">Your celestial chart is mapped. Review your destined paths.</p>
            ) : (
              <p className="text-sm mb-4">You haven't generated your astrology profile yet. Discover your cosmic traits.</p>
            )}
            <Button asChild variant="outline" className="border-secondary/50 text-secondary hover:bg-secondary/10">
              <Link href="/astrology">{summary.hasAstrology ? "View Profile" : "Generate Profile"}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
