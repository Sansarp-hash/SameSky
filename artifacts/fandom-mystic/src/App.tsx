import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Ships from "@/pages/ships";
import Actresses from "@/pages/actresses";
import Series from "@/pages/series";
import Characters from "@/pages/characters";
import Tarot from "@/pages/tarot";
import Astrology from "@/pages/astrology";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/ships" component={() => <ProtectedRoute component={Ships} />} />
      <Route path="/actresses" component={() => <ProtectedRoute component={Actresses} />} />
      <Route path="/series" component={() => <ProtectedRoute component={Series} />} />
      <Route path="/series/:id/characters" component={() => <ProtectedRoute component={Characters} />} />
      <Route path="/tarot" component={() => <ProtectedRoute component={Tarot} />} />
      <Route path="/astrology" component={() => <ProtectedRoute component={Astrology} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
