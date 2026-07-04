import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type PackId = "starter" | "fan" | "superfan" | "legend";

export function usePaystack() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  async function buyStars(packId: PackId) {
    setLoading(packId);
    try {
      const resp = await fetch("/api/paystack/checkout/coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ packId }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.authorizationUrl;
    } catch (err) {
      toast({
        title: "Payment error",
        description: err instanceof Error ? err.message : "Could not start payment. Please try again.",
        variant: "destructive",
      });
      setLoading(null);
    }
  }

  async function upgradeMystic() {
    setLoading("mystic");
    try {
      const resp = await fetch("/api/paystack/checkout/mystic-premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.authorizationUrl;
    } catch (err) {
      toast({
        title: "Payment error",
        description: err instanceof Error ? err.message : "Could not start payment. Please try again.",
        variant: "destructive",
      });
      setLoading(null);
    }
  }

  return { buyStars, upgradeMystic, loading };
}
