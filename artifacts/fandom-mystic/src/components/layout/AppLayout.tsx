import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Heart, 
  Star, 
  Tv, 
  Sparkles, 
  Moon, 
  Settings, 
  LogOut, 
  Menu 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: Sparkles },
    { href: "/ships", label: "My Ships", icon: Heart },
    { href: "/actresses", label: "Actresses", icon: Star },
    { href: "/series", label: "Series Tracker", icon: Tv },
    { href: "/tarot", label: "Tarot Reader", icon: Moon },
    { href: "/astrology", label: "Astrology", icon: Star },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <h1 className="font-serif text-xl font-bold text-primary">Mystic Fandom</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-card border-r-border">
            <SheetHeader>
              <SheetTitle className="font-serif text-primary text-2xl mb-4">Mystic</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    location === link.href
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              ))}
              <Button
                variant="ghost"
                className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10 mt-4"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 p-4">
        <div className="mb-8 px-3">
          <h1 className="font-serif text-2xl font-bold text-primary mb-1">Mystic</h1>
          <p className="text-xs text-muted-foreground">Your GL Sanctuary</p>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                location.startsWith(link.href)
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <link.icon className="w-4 h-4" />
              <span className="font-medium text-sm">{link.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-border">
          <div className="px-3 mb-2">
            <p className="text-sm font-medium">{user?.username}</p>
            <p className="text-xs text-muted-foreground uppercase">{user?.subscriptionTier} tier</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto relative">
        {/* Subtle background decoration */}
        <div className="fixed top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="fixed bottom-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
