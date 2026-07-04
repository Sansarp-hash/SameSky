import { useState, useEffect } from "react";
import { useGetMe, getGetMeQueryKey, useUpdateMe, useVerifyAge } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: me, isLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  
  const updateMe = useUpdateMe();
  const verifyAge = useVerifyAge();

  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    country: ""
  });
  
  const [birthYear, setBirthYear] = useState("");

  useEffect(() => {
    if (me) {
      setFormData({
        username: me.username || "",
        bio: me.bio || "",
        country: me.country || ""
      });
    }
  }, [me]);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateMe.mutate({ data: formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Profile updated successfully." });
      }
    });
  };

  const handleAgeVerification = (e: React.FormEvent) => {
    e.preventDefault();
    const year = parseInt(birthYear, 10);
    if (!year || year < 1900 || year > new Date().getFullYear()) {
      toast({ title: "Invalid birth year", variant: "destructive" });
      return;
    }
    
    verifyAge.mutate({ data: { birthYear: year } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Age verified successfully." });
      },
      onError: () => {
        toast({ title: "Verification failed. You must be 18+.", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-2xl">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your profile and account preferences.</p>
      </header>

      <section className="bg-card/20 backdrop-blur-md border border-white/5 p-8 rounded-3xl shadow-lg">
        <h2 className="text-xl font-medium text-white mb-6">Profile Information</h2>
        <form onSubmit={handleProfileUpdate} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</label>
            <Input 
              value={formData.username} 
              onChange={e => setFormData({...formData, username: e.target.value})} 
              className="bg-white/5 border-white/10 focus-visible:ring-primary/50 text-white h-12 rounded-xl px-4" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bio</label>
            <Textarea 
              value={formData.bio} 
              onChange={e => setFormData({...formData, bio: e.target.value})} 
              className="bg-white/5 border-white/10 focus-visible:ring-primary/50 text-white min-h-[100px] rounded-xl p-4 resize-none" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Country</label>
            <Input 
              value={formData.country} 
              onChange={e => setFormData({...formData, country: e.target.value})} 
              className="bg-white/5 border-white/10 focus-visible:ring-primary/50 text-white h-12 rounded-xl px-4" 
            />
          </div>
          <div className="pt-4 flex justify-end">
            <Button 
              type="submit" 
              disabled={updateMe.isPending}
              className="rounded-full px-8 font-medium shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] bg-white text-black hover:bg-white/90"
              data-testid="button-save-profile"
            >
              {updateMe.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </section>

      <section className="bg-card/20 backdrop-blur-md border border-white/5 p-8 rounded-3xl shadow-lg relative overflow-hidden">
        {me?.ageVerified && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[40px] pointer-events-none" />
        )}
        <h2 className="text-xl font-medium text-white mb-2">Age Verification</h2>
        <p className="text-sm text-muted-foreground mb-6">Required to enter physical prize raffles. Must be 18+.</p>
        
        {me?.ageVerified ? (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,1)]" />
            <span className="font-medium text-sm">Your age has been verified.</span>
          </div>
        ) : (
          <form onSubmit={handleAgeVerification} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Birth Year</label>
              <Input 
                type="number" 
                placeholder="YYYY" 
                value={birthYear} 
                onChange={e => setBirthYear(e.target.value)} 
                className="bg-white/5 border-white/10 focus-visible:ring-primary/50 text-white h-12 rounded-xl px-4 max-w-[200px]" 
              />
            </div>
            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={verifyAge.isPending || !birthYear}
                variant="outline"
                className="rounded-full px-6 bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                {verifyAge.isPending ? "Verifying..." : "Verify Age"}
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
