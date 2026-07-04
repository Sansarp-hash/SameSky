import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-hidden relative text-foreground selection:bg-primary/30">
      {/* Ambient — single restrained warm glow + fine vignette */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-[-25%] left-1/2 -translate-x-1/2 w-[70%] h-[55%] rounded-full blur-[160px] opacity-[0.12]"
          style={{ background: "radial-gradient(circle, #d8b06a, transparent 70%)" }}
        />
        <div className="absolute inset-0 opacity-[0.5]" style={{ background: "radial-gradient(120% 80% at 50% 0%, transparent 40%, rgba(0,0,0,0.6))" }} />
      </div>

      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="SameSky" className="w-8 h-8 rounded-md opacity-95" />
          <span className="font-display text-xl tracking-wide text-foreground">SameSky</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/sign-in">
            <span className="text-sm font-medium text-foreground/55 hover:text-foreground transition-colors cursor-pointer">
              Log In
            </span>
          </Link>
          <Link href="/sign-up">
            <Button className="rounded-full px-6 text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
              Join SameSky
            </Button>
          </Link>
        </div>
      </header>

      {/* Thin gold divider under header */}
      <div className="h-px w-full hairline-gold opacity-40 relative z-10" />

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative z-10 text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <p className="eyebrow text-primary/90 mb-8">
            Thai GL · Series · Ships · Shorts
          </p>

          <h1 className="font-display text-6xl md:text-8xl font-medium leading-[1.02] text-foreground tracking-tight">
            One sky.
            <br />
            <span className="italic text-primary">Every ship.</span>
          </h1>

          <div className="h-px w-16 hairline-gold my-10 opacity-70" />

          <p className="text-base md:text-lg text-foreground/50 max-w-xl mx-auto leading-relaxed font-light">
            The dedicated home for Thai GL. Discover series, celebrate ships, share
            clips, and belong to a global community — refined for the fans who love it most.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-12">
            <Link href="/sign-up">
              <Button
                size="lg"
                data-testid="button-get-started"
                className="h-12 rounded-full px-9 text-[13px] font-semibold tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:-translate-y-0.5"
              >
                Enter SameSky <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <span className="text-sm font-medium text-foreground/45 hover:text-foreground transition-colors cursor-pointer border-b border-transparent hover:border-primary/40 pb-0.5">
                Already a member
              </span>
            </Link>
          </div>
        </div>

        {/* Editorial feature row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px mt-28 max-w-4xl mx-auto w-full bg-border/40">
          <FeatureCard
            index="01"
            title="Thai GL Series"
            description="Discuss and discover the finest Thai GL dramas — from GAP and Y-Destiny to the latest releases."
          />
          <FeatureCard
            index="02"
            title="Ships & Shorts"
            description="Celebrate the pairings you adore and share short clips from Thailand and beyond."
          />
          <FeatureCard
            index="03"
            title="Global Community"
            description="Connect with fans across the world. One community, gathered under the same sky."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-foreground/30">
        <span>© 2026 SameSky. All rights reserved.</span>
        <div className="flex items-center gap-6">
          <Link href="/terms"><span className="hover:text-foreground/60 transition-colors cursor-pointer">Terms of Service</span></Link>
          <Link href="/privacy"><span className="hover:text-foreground/60 transition-colors cursor-pointer">Privacy Policy</span></Link>
          <a href="mailto:legal@samesky.app" className="hover:text-foreground/60 transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-background px-7 py-9 text-left group transition-colors hover:bg-card/40">
      <span className="font-display text-primary/70 text-sm tracking-widest">{index}</span>
      <h3 className="font-display text-xl mt-4 mb-3 text-foreground">{title}</h3>
      <p className="text-sm text-foreground/45 leading-relaxed font-light">{description}</p>
    </div>
  );
}
