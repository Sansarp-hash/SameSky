import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpgrade, useChangePassword } from "@/hooks/use-mystic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Lock, Sparkles, Crown, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(4, "Password must be at least 4 characters"),
  confirmPassword: z.string().min(1),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function Settings() {
  const { user, logout } = useAuth();
  const upgrade = useUpgrade();
  const changePassword = useChangePassword();
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  const isPremium = user?.subscriptionTier === "premium";

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onPasswordChange = async (data: z.infer<typeof passwordSchema>) => {
    try {
      setPwError("");
      await changePassword.mutateAsync({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      setPwSuccess(true);
      form.reset();
    } catch (err: any) {
      setPwError(err.message ?? "Failed to change password");
    }
  };

  const handleUpgrade = async () => {
    await upgrade.mutateAsync(undefined);
    setUpgradeSuccess(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif text-primary flex items-center gap-3">
          <SettingsIcon className="w-8 h-8" /> Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your mystical sanctuary.</p>
      </div>

      {/* Profile overview */}
      <Card className="bg-card/60 backdrop-blur border-primary/20">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{user?.username}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Badge
              variant="outline"
              className={isPremium
                ? "border-secondary/50 text-secondary bg-secondary/10"
                : "border-muted-foreground/40 text-muted-foreground"
              }
            >
              {isPremium ? <><Crown className="w-3 h-3 mr-1 inline" /> Premium</> : "Free Tier"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade */}
      {!isPremium && (
        <Card className="bg-card/60 backdrop-blur border-secondary/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 pointer-events-none" />
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2 text-secondary">
              <Crown className="w-5 h-5" /> Upgrade to Premium
            </CardTitle>
            <CardDescription>Unlock the full power of your fandom sanctuary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-secondary" /> Track up to <strong>30 ships</strong> (vs 3 free)</li>
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-secondary" /> Add up to <strong>30 actresses</strong> (vs 3 free)</li>
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-secondary" /> Unlimited series & characters</li>
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-secondary" /> Priority support for new GL features</li>
            </ul>
            {upgradeSuccess ? (
              <div className="p-3 rounded-md bg-secondary/10 text-secondary text-sm border border-secondary/30">
                ✨ You are now Premium! Enjoy your expanded sanctuary.
              </div>
            ) : (
              <Button
                onClick={handleUpgrade}
                disabled={upgrade.isPending}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-serif tracking-wider"
              >
                <Crown className="w-4 h-4 mr-2" />
                {upgrade.isPending ? "Upgrading..." : "Upgrade Now"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Change Password */}
      <Card className="bg-card/60 backdrop-blur border-primary/15">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pwSuccess && (
            <div className="p-3 rounded-md bg-primary/10 text-primary text-sm border border-primary/30 mb-4">
              Password changed successfully.
            </div>
          )}
          {pwError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20 mb-4">
              {pwError}
            </div>
          )}
          <form onSubmit={form.handleSubmit(onPasswordChange)} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" {...form.register("currentPassword")} className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" {...form.register("newPassword")} className="bg-background/50" />
              {form.formState.errors.newPassword && (
                <p className="text-xs text-destructive">{form.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" {...form.register("confirmPassword")} className="bg-background/50" />
              {form.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" disabled={changePassword.isPending} variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
              <Lock className="w-4 h-4 mr-2" />
              {changePassword.isPending ? "Saving..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sign out */}
      <Card className="bg-card/50 backdrop-blur border-destructive/15">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sign Out</p>
              <p className="text-sm text-muted-foreground">Leave your sanctuary until next time</p>
            </div>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border border-destructive/20"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
