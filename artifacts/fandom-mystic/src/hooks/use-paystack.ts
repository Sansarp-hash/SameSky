import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function usePaystack() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function upgradeMystic() {
    setLoading(true);
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
      setLoading(false);
    }
  }

  return { upgradeMystic, loading };
}
