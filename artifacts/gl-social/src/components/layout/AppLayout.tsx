import { useGetMe, getGetMeQueryKey, useListNotifications, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useClerk } from "@clerk/react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Ticket, 
  User as UserIcon, 
  Coins, 
  Bell, 
  Settings, 
  ShieldAlert,
  LogOut,
  Menu
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: notifs } = useListNotifications({ unreadOnly: true }, { query: { queryKey: getListNotificationsQueryKey({ unreadOnly: true }) } });
  
  const { signOut } = useClerk();
  const [location] = useLocation();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const navItems = [
    { href: "/feed", label: "Feed", icon: Home },
    { href: "/raffles", label: "Raffles", icon: Ticket },
    { href: "/profile", label: "Profile", icon: UserIcon },
    { href: "/coins", label: "Wallet", icon: Coins },
    { href: "/notifications", label: "Notifications", icon: Bell, badge: notifs?.notifications?.length },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  if (me?.role === "admin") {
    navItems.push({ href: "/admin", label: "Admin", icon: ShieldAlert });
  }

  const NavContent = () => (
    <div className="flex flex-col h-full bg-card/40 backdrop-blur-3xl border-r border-white/5 w-64 p-6 z-10 relative">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-gradient-to-tr from-white/10 to-white/20 rounded-xl flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
          <span className="text-white font-bold text-lg tracking-tighter">GL</span>
        </div>
        <span className="text-xl font-semibold tracking-tight text-white">Social</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/feed" && location.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-medium text-sm transition-all cursor-pointer ${isActive ? 'bg-white/10 text-white shadow-inner' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
        {me && (
          <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground mb-1">Balance</span>
              <span className="font-semibold tracking-tight text-white flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-primary" /> {me.coinBalance.toLocaleString()} GL
              </span>
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 font-medium text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl px-4"
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
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[20%] left-[-20%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[150px] mix-blend-screen opacity-50" />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block z-10 sticky top-0 h-[100dvh]">
        <NavContent />
      </div>

      {/* Mobile Header & Nav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-white/10 to-white/20 rounded-lg flex items-center justify-center border border-white/10">
            <span className="text-white font-bold text-sm tracking-tighter">GL</span>
          </div>
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
      <main className="flex-1 w-full max-w-[800px] mx-auto lg:p-10 p-4 pt-24 lg:pt-10 min-h-screen z-10 relative">
        {children}
      </main>
    </div>
  );
}
