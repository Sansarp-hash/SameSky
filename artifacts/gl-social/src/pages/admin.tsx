import { useState } from "react";
import { useAdminGetStats, getAdminGetStatsQueryKey, useAdminListUsers, getAdminListUsersQueryKey, useAdminBanUser, useAdminAddCoins, useListRaffles, getListRafflesQueryKey, useCreateRaffle, useDrawRaffleWinner } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Activity, Ticket, Coins, Search, UserMinus, UserCheck, Plus, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AdminPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm">Platform metrics and control center.</p>
      </header>

      <StatsOverview />

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-card/40 backdrop-blur-md border border-white/5 mb-6 rounded-xl p-1">
          <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white">Users</TabsTrigger>
          <TabsTrigger value="raffles" className="rounded-lg data-[state=active]:bg-white/10 data-[state=active]:text-white">Raffles</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UsersManagement />
        </TabsContent>
        <TabsContent value="raffles">
          <RafflesManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsOverview() {
  const { data: stats, isLoading } = useAdminGetStats({ query: { queryKey: getAdminGetStatsQueryKey() } });

  const metrics = [
    { label: "Total Users", value: stats?.totalUsers, icon: Users },
    { label: "Total Posts", value: stats?.totalPosts, icon: Activity },
    { label: "Active Raffles", value: stats?.activeRaffles, icon: Ticket },
    { label: "Coins Dist.", value: stats?.totalCoinsDistributed, icon: Coins },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, i) => (
        <Card key={i} className="bg-card/40 backdrop-blur-md border border-white/5 p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
            <metric.icon className="w-4 h-4 text-white/40" />
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className="text-2xl font-semibold tracking-tight text-white">{metric.value?.toLocaleString()}</div>
          )}
        </Card>
      ))}
    </div>
  );
}

function UsersManagement() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useAdminListUsers({ search }, { query: { queryKey: getAdminListUsersQueryKey({ search }) } });
  
  const banUser = useAdminBanUser();
  const addCoins = useAdminAddCoins();

  const handleBanToggle = (userId: number, currentStatus: boolean) => {
    banUser.mutate({ userId: String(userId), data: { banned: !currentStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey({ search }) });
        toast({ title: `User ${!currentStatus ? 'banned' : 'unbanned'} successfully.` });
      }
    });
  };

  const handleAddCoins = (userId: number) => {
    const amount = parseInt(prompt("Enter amount to add:") || "0", 10);
    if (!amount || amount <= 0) return;
    
    addCoins.mutate({ userId: String(userId), data: { amount, description: "Admin granted coins" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey({ search }) });
        toast({ title: `Added ${amount} coins successfully.` });
      }
    });
  };

  return (
    <div className="bg-card/40 backdrop-blur-md border border-white/5 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 rounded-xl"
            data-testid="input-search-users"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-white/5 hover:bg-transparent"><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : data?.users.map(user => (
              <TableRow key={user.id} className="border-white/5 hover:bg-white/5">
                <TableCell>
                  <div className="font-medium text-white">{user.username}</div>
                  <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                </TableCell>
                <TableCell><Badge variant="outline" className="bg-white/5 border-white/10">{user.role}</Badge></TableCell>
                <TableCell>{user.coinBalance.toLocaleString()} GL</TableCell>
                <TableCell>
                  {user.isBanned ? <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/20">Banned</Badge> : <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/20">Active</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleAddCoins(user.id)} className="h-8 hover:bg-white/10">
                      <Plus className="w-4 h-4 mr-1" /> Coins
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleBanToggle(user.id, user.isBanned)} className="h-8 hover:bg-red-500/20 hover:text-red-400">
                      {user.isBanned ? <UserCheck className="w-4 h-4 mr-1" /> : <UserMinus className="w-4 h-4 mr-1" />}
                      {user.isBanned ? 'Unban' : 'Ban'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && data?.users.length === 0 && (
              <TableRow className="border-white/5 hover:bg-transparent"><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function RafflesManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useListRaffles({}, { query: { queryKey: getListRafflesQueryKey({}) } });
  
  const drawWinner = useDrawRaffleWinner();
  
  const handleDraw = (raffleId: number) => {
    if (!confirm("Are you sure you want to draw a winner? This action cannot be undone.")) return;
    drawWinner.mutate({ raffleId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRafflesQueryKey({}) });
        toast({ title: "Winner drawn successfully." });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <CreateRaffleDialog />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : data?.map(raffle => (
          <div key={raffle.id} className="bg-card/40 backdrop-blur-md border border-white/5 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-white text-lg">{raffle.title}</h3>
                <Badge variant="outline" className={
                  raffle.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/20' : 
                  raffle.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' : 
                  'bg-white/10 text-white/60 border-white/10'
                }>{raffle.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground mb-2">{raffle.prize} • {raffle.entryCost} GL per entry</div>
              <div className="text-xs text-white/40">
                {format(new Date(raffle.startTime), "PPp")} - {format(new Date(raffle.endTime), "PPp")}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-3">{raffle.entryCount} Entries</div>
              {raffle.status === 'active' && (
                <Button size="sm" onClick={() => handleDraw(raffle.id)} disabled={drawWinner.isPending} className="bg-white/10 hover:bg-white/20 text-white">
                  <Trophy className="w-4 h-4 mr-2" /> Draw Winner
                </Button>
              )}
              {raffle.status === 'ended' && raffle.winner && (
                <div className="text-sm font-medium text-primary">Winner: {raffle.winner.username}</div>
              )}
            </div>
          </div>
        ))}
        {!isLoading && data?.length === 0 && (
          <div className="text-center p-8 bg-card/20 border border-white/5 rounded-2xl text-muted-foreground">No raffles found.</div>
        )}
      </div>
    </div>
  );
}

function CreateRaffleDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createRaffle = useCreateRaffle();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    prize: "",
    entryCost: "100",
    startTime: "",
    endTime: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRaffle.mutate({ 
      data: {
        ...formData,
        entryCost: parseInt(formData.entryCost, 10) || 100,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString()
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRafflesQueryKey({}) });
        toast({ title: "Raffle created successfully." });
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full"><Plus className="w-4 h-4 mr-2" /> New Raffle</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Create New Raffle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="bg-white/5 border-white/10" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Prize</label>
            <Input required value={formData.prize} onChange={e => setFormData({...formData, prize: e.target.value})} className="bg-white/5 border-white/10" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-white/5 border-white/10" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Entry Cost (GL)</label>
            <Input required type="number" min="1" value={formData.entryCost} onChange={e => setFormData({...formData, entryCost: e.target.value})} className="bg-white/5 border-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Start Time</label>
              <Input required type="datetime-local" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">End Time</label>
              <Input required type="datetime-local" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="bg-white/5 border-white/10" />
            </div>
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={createRaffle.isPending}>Create Raffle</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
