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
    { href: "/notifications", label: "Notifs", icon: Bell, badge: notifs?.notifications?.length },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  if (me?.role === "admin") {
    navItems.push({ href: "/admin", label: "Admin", icon: ShieldAlert });
  }

  const NavContent = () => (
    <div className="flex flex-col h-full bg-white border-r-2 border-black shadow-[4px_0_0_0_rgba(0,0,0,1)] w-64 p-4 z-10 relative">
      <div className="flex items-center gap-2 mb-8 px-2">
        <img src={`${basePath}/logo.svg`} alt="GL Social" className="w-10 h-10" />
        <span className="text-2xl font-black uppercase tracking-tighter text-primary">GL Social</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = location.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold uppercase tracking-widest transition-all cursor-pointer border-2 ${isActive ? 'bg-primary text-white border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' : 'bg-transparent border-transparent hover:border-black hover:bg-gray-50'}`}>
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="ml-auto bg-destructive text-white text-xs px-2 py-0.5 rounded-full border-2 border-black">
                    {item.badge}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t-2 border-black space-y-4">
        {me && (
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase text-muted-foreground">Balance</span>
              <span className="font-black text-xl text-secondary">{me.coinBalance} GL</span>
            </div>
          </div>
        )}
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 font-bold uppercase border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
          onClick={() => signOut({ redirectUrl: basePath || "/" })}
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] flex bg-gray-50/50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <NavContent />
      </div>

      {/* Mobile Header & Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b-2 border-black z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src={`${basePath}/logo.svg`} alt="GL Social" className="w-8 h-8" />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="border-2 border-black">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r-2 border-black">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[800px] mx-auto md:p-8 p-4 pt-20 md:pt-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
