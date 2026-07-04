import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Ticket, Users, Coins } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-white overflow-hidden relative">
      {/* Noise overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}></div>
      
      <header className="px-6 py-4 flex items-center justify-between border-b-4 border-black relative z-10 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center rotate-3">
            <span className="text-white font-black text-xl -rotate-3">GL</span>
          </div>
          <span className="text-2xl font-black uppercase tracking-tighter text-primary">Social</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="hidden sm:flex font-bold uppercase tracking-widest border-2 border-black">Log In</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all bg-primary">
              Join Now
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-block bg-secondary/10 border-2 border-secondary px-4 py-2 rounded-full mb-4">
            <span className="text-secondary font-black uppercase tracking-widest text-sm">The Next Generation of Social</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-6 text-black drop-shadow-[4px_4px_0_rgba(200,0,255,1)]">
            Post.<br/> Earn.<br/> <span className="text-primary">Win.</span>
          </h1>
          
          <p className="text-xl md:text-2xl font-medium text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            GL Social isn't just a feed. It's an arena. Earn GL Coins for your activity and enter exclusive raffles for real prizes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-xl font-black uppercase tracking-widest border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all bg-primary">
                Start Playing <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto text-left w-full">
          <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative group hover:-translate-y-2 transition-transform">
            <div className="w-14 h-14 bg-secondary text-white rounded-lg flex items-center justify-center mb-6 border-2 border-black">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black uppercase mb-3">Connect</h3>
            <p className="text-gray-600 font-medium">Build your audience. Share your wins. The feed is where the energy lives.</p>
          </div>
          
          <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative group hover:-translate-y-2 transition-transform">
            <div className="w-14 h-14 bg-accent text-black rounded-lg flex items-center justify-center mb-6 border-2 border-black">
              <Coins className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black uppercase mb-3">Earn</h3>
            <p className="text-gray-600 font-medium">Every post, every like, every interaction adds GL Coins to your wallet.</p>
          </div>

          <div className="bg-white p-8 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative group hover:-translate-y-2 transition-transform">
            <div className="w-14 h-14 bg-primary text-white rounded-lg flex items-center justify-center mb-6 border-2 border-black">
              <Ticket className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black uppercase mb-3">Win</h3>
            <p className="text-gray-600 font-medium">Spend your coins on high-stakes raffles. Real prizes. Real winners.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
