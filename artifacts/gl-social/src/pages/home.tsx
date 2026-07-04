import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Globe, Heart } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-hidden relative text-foreground selection:bg-primary/30">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full blur-[140px] opacity-20" style={{ background: "radial-gradient(circle, #e879f9, transparent)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] opacity-15" style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }} />
        <div className="absolute top-[50%] left-[40%] w-[35%] h-[35%] rounded-full blur-[120px] opacity-10" style={{ background: "radial-gradient(circle, #818cf8, transparent)" }} />
      </div>

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between relative z-10 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="SameSky" className="w-9 h-9 rounded-xl" />
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-fuchsia-400 via-violet-400 to-sky-400 bg-clip-text text-transparent">SameSky</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" className="font-medium text-white/70 hover:text-white hover:bg-white/8 transition-colors text-sm">
              Log In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="rounded-full px-5 text-sm font-semibold bg-white text-black hover:bg-white/90 transition-all shadow-[0_0_24px_rgba(232,121,249,0.3)] hover:shadow-[0_0_32px_rgba(232,121,249,0.45)]">
              Join SameSky
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative z-10 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-sm text-white/60 font-medium mb-2">
            <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
            Thai GL Series, Ships &amp; Shorts
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05] text-white">
            One sky.<br />
            <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-sky-400 bg-clip-text text-transparent">
              Every ship.
            </span>
          </h1>

          <p className="text-base md:text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
            SameSky is where Thai GL fans live — discover series, celebrate ships, share clips, and connect with the global GL community.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/sign-up">
              <Button
                size="lg"
                data-testid="button-get-started"
                className="h-12 rounded-full px-8 text-sm font-semibold bg-white text-black hover:bg-white/90 transition-all shadow-[0_0_28px_rgba(232,121,249,0.25)] hover:shadow-[0_0_36px_rgba(232,121,249,0.4)] hover:-translate-y-0.5"
              >
                Start watching <ArrowRight className="ml-1.5 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button
                size="lg"
                variant="ghost"
                data-testid="button-log-in"
                className="h-12 rounded-full px-8 text-sm font-medium text-white/60 hover:text-white hover:bg-white/8"
              >
                Already a member
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 max-w-4xl mx-auto w-full text-left">
          <FeatureCard
            icon={<Play className="w-5 h-5" />}
            iconColor="text-fuchsia-400"
            title="Thai GL Series"
            description="Discuss and discover the best Thai GL dramas — from GAP and Y-Destiny to the latest drops."
          />
          <FeatureCard
            icon={<Heart className="w-5 h-5" />}
            iconColor="text-violet-400"
            title="Ships &amp; Shorts"
            description="Celebrate your favorite GL ships and share GL short clips from Thailand and beyond."
          />
          <FeatureCard
            icon={<Globe className="w-5 h-5" />}
            iconColor="text-sky-400"
            title="Global Community"
            description="Connect with GL fans from Thailand and across the world. One community, same sky."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/25">
        <span>© 2026 SameSky. All rights reserved.</span>
        <div className="flex items-center gap-5">
          <Link href="/terms"><span className="hover:text-white/60 transition-colors cursor-pointer">Terms of Service</span></Link>
          <Link href="/privacy"><span className="hover:text-white/60 transition-colors cursor-pointer">Privacy Policy</span></Link>
          <a href="mailto:legal@samesky.app" className="hover:text-white/60 transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  iconColor,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/4 backdrop-blur-xl p-6 rounded-2xl border border-white/8 hover:bg-white/7 hover:border-white/12 transition-all group">
      <div className={`mb-4 ${iconColor}`}>{icon}</div>
      <h3 className="text-base font-semibold mb-2 text-white">{title}</h3>
      <p className="text-sm text-white/45 leading-relaxed">{description}</p>
    </div>
  );
}
