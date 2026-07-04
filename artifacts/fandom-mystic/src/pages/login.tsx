import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Moon } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

const registerSchema = z.object({
  username: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(4),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, register, user } = useAuth();
  const [error, setError] = useState("");

  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    try {
      setError("");
      await login(data);
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to login");
    }
  };

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    try {
      setError("");
      await register(data);
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to register");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Mystical background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
      
      <Card className="w-full max-w-md border-primary/20 shadow-2xl shadow-primary/10 relative z-10 backdrop-blur-sm bg-card/90">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Moon className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="font-serif text-3xl text-primary">Mystic Fandom</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            Your secret GL sanctuary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Enter</TabsTrigger>
              <TabsTrigger value="register">Join</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">{error}</div>}
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input {...loginForm.register("email")} placeholder="your@email.com" className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" {...loginForm.register("password")} className="bg-background/50" />
                </div>
                <Button type="submit" className="w-full font-serif tracking-widest mt-2">
                  <Sparkles className="w-4 h-4 mr-2" />
                  REVEAL
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">{error}</div>}
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input {...registerForm.register("username")} placeholder="stargazer" className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input {...registerForm.register("email")} placeholder="your@email.com" className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" {...registerForm.register("password")} className="bg-background/50" />
                </div>
                <Button type="submit" className="w-full font-serif tracking-widest mt-2">
                  <Sparkles className="w-4 h-4 mr-2" />
                  MANIFEST
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
