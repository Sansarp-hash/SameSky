import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Ticket, Users, Coins, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-hidden relative text-white selection:bg-primary selection:text-primary-foreground">
      {/* Sleek ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] mix-blend-screen opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary/20 rounded-full blur-[120px] mix-blend-screen opacity-50" />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-accent/20 rounded-full blur-[100px] mix-blend-screen opacity-40" />
      </div>
      
      <header className="px-6 py-5 flex items-center justify-between relative z-10 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-white/10 to-white/20 rounded-xl flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <span className="text-white font-bold text-lg tracking-tighter">GL</span>
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">Social</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="hidden sm:flex font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors">Log In</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="rounded-full px-6 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] transition-all bg-white text-black hover:bg-white/90">
              Join the Club
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto space-y-8 mt-12 mb-24">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-white/80 font-medium text-sm tracking-wide">The Premium Social Experience</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1] mb-6 text-white animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Connect. <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Earn.</span> <br className="md:hidden" />
            Win.
          </h1>
          
          <p className="text-lg md:text-xl font-normal text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
            A refined social network where your interactions carry real value. Earn GL Coins for your activity and gain access to exclusive high-stakes raffles.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto h-14 rounded-full px-8 text-base font-semibold shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:-translate-y-1 transition-all bg-white text-black hover:bg-white/90">
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto text-left w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 pb-24">
          <FeatureCard 
            icon={<Users className="w-6 h-6" />}
            title="The Feed"
            description="Share your moments in a beautifully crafted environment designed for focus and quality."
          />
          <FeatureCard 
            icon={<Coins className="w-6 h-6" />}
            title="The Treasury"
            description="Every post and interaction deposits GL Coins into your secure personal wallet."
          />
          <FeatureCard 
            icon={<Ticket className="w-6 h-6" />}
            title="The Vault"
            description="Redeem your earned coins to enter exclusive raffles for premium physical and digital prizes."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors group">
      <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 ease-out border border-white/5 shadow-inner">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 tracking-tight text-white">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
