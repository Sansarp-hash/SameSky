import { useGetMe, getGetMeQueryKey, useListNotifications, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useClerk } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Tv, 
  User as UserIcon, 
  Star, 
  Bell, 
  Settings, 
  ShieldAlert,
  LogOut,
  Menu,
  Heart,
  Search,
  Sparkles,
  Film,
  Play,
  Anchor
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: notifs } = useListNotifications({ unreadOnly: true }, { query: { queryKey: getListNotificationsQueryKey({ unreadOnly: true }) } });
  
  const { signOut } = useClerk();
  const [location] = useLocation();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const navItems = [
    { href: "/feed", label: "Feed", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: "/ships", label: "Ships", icon: Anchor },
    { href: "/series", label: "Canons", icon: Film },
    { href: "/shorts", label: "Shorts", icon: Play },
    { href: "/raffles", label: "Community", icon: Tv },
    { href: "/mystic", label: "Mystic Profile", icon: Sparkles },
    { href: "/profile", label: "Profile", icon: UserIcon },
    { href: "/coins", label: "Stars Wallet", icon: Star },
    { href: "/notifications", label: "Notifications", icon: Bell, badge: notifs?.length },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  if (me?.role === "admin") {
    navItems.push({ href: "/admin", label: "Admin", icon: ShieldAlert });
  }

  const NavContent = () => (
    <div className="flex flex-col h-full bg-background border-r border-white/5 w-64 p-6 z-10 relative">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-full flex items-center justify-center border border-primary/40 bg-primary/10">
          <Heart className="w-4.5 h-4.5 text-primary fill-primary" />
        </div>
        <span className="font-display text-2xl tracking-wide text-foreground">SameSky</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/feed" && location.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-4 px-4 py-3 rounded-full font-medium text-[15px] transition-all cursor-pointer ${isActive ? 'bg-white/10 text-white font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'text-primary' : ''}`} />
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 space-y-4 px-2">
        {me && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground mb-1">Stars Balance</span>
              <span className="font-semibold tracking-tight text-white flex items-center gap-1.5">
                <Star className="w-4 h-4 text-secondary fill-secondary" /> {me.coinBalance.toLocaleString()}
              </span>
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-4 font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-full px-4 h-12"
          onClick={() => signOut({ redirectUrl: basePath || "/" })}
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] flex bg-background text-foreground selection:bg-primary/30">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex z-10 sticky top-0 h-[100dvh] justify-end xl:w-1/3 min-w-[280px]">
        <NavContent />
      </div>

      {/* Mobile Header & Nav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-background/90 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center border border-primary/40 bg-primary/10">
            <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
          </div>
          <span className="font-display text-lg tracking-wide text-foreground">SameSky</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r border-white/10 bg-background/95 backdrop-blur-3xl">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full lg:max-w-[680px] lg:border-r lg:border-white/5 min-h-screen z-10 relative">
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
      
      {/* Right Sidebar (empty for layout balance on large screens) */}
      <div className="hidden xl:block flex-1 min-w-[300px]" />
    </div>
  );
}
