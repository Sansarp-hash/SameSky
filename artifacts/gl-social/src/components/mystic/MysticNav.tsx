import { Link, useLocation } from "wouter";
import { LayoutDashboard, Heart, Star, Tv, Sparkles, Moon } from "lucide-react";

const TABS = [
  { href: "/mystic", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/mystic/ships", label: "Ships", icon: Heart },
  { href: "/mystic/actresses", label: "Actresses", icon: Star },
  { href: "/mystic/series", label: "Series", icon: Tv },
  { href: "/mystic/tarot", label: "Tarot", icon: Moon },
  { href: "/mystic/astrology", label: "Astrology", icon: Sparkles },
];

export default function MysticNav() {
  const [location] = useLocation();

  return (
    <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center gap-1 px-4 overflow-x-auto scrollbar-hide py-1">
        {TABS.map((tab) => {
          const isActive = tab.exact ? location === tab.href : location.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link key={tab.href} href={tab.href}>
              <button
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-secondary" : ""}`} />
                {tab.label}
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
