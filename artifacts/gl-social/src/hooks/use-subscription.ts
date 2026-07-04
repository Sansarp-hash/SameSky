import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export type PlanId = "premium_monthly" | "premium_yearly" | "premium_lifetime";

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  description: string;
  priceUsd: number;
  usdCents: number;
  interval: "month" | "year" | null;
  kind: "subscription" | "one_time";
  trialDays: number;
  features: string[];
  highlight: boolean;
}

export interface SubscriptionStatus {
  active: boolean;
  isLifetime: boolean;
  hasStripeCustomer: boolean;
  plan: PlanId | null;
  planName: string | null;
  status: string | null;
  interval: "month" | "year" | null;
  currency: string | null;
  amountMinorUnits: number | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Request failed");
  return res.json();
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export const SUB_STATUS_KEY = ["subscription-status"];

export function usePlans() {
  return useQuery<{ plans: SubscriptionPlan[] }>({
    queryKey: ["subscription-plans"],
    queryFn: () => getJson("/api/subscriptions/plans"),
    staleTime: 60 * 60 * 1000,
  });
}

export function useSubscriptionStatus() {
  return useQuery<SubscriptionStatus>({
    queryKey: SUB_STATUS_KEY,
    queryFn: () => getJson("/api/subscriptions/me"),
  });
}

export function useSubscriptionActions() {
  const [pending, setPending] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const refresh = () => queryClient.invalidateQueries({ queryKey: SUB_STATUS_KEY });

  async function checkout(plan: PlanId, currency: string) {
    setPending(plan);
    try {
      const data = await postJson<{
        url: string;
        chargeCurrency: string;
        requestedCurrency: string;
        fellBackToUsd: boolean;
      }>("/api/subscriptions/checkout", { plan, currency });
      if (data.fellBackToUsd) {
        toast({
          title: "Charged in USD",
          description: `${data.requestedCurrency} isn't supported for payments, so you'll be billed in USD.`,
        });
      }
      window.location.href = data.url;
    } catch (err) {
      toast({
        title: "Checkout error",
        description: err instanceof Error ? err.message : "Could not start checkout.",
        variant: "destructive",
      });
      setPending(null);
    }
  }

  async function confirm(sessionId: string) {
    return postJson<SubscriptionStatus>("/api/subscriptions/confirm", { sessionId });
  }

  async function openPortal() {
    setPending("portal");
    try {
      const data = await postJson<{ url: string }>("/api/subscriptions/portal");
      window.location.href = data.url;
    } catch (err) {
      toast({
        title: "Could not open billing",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
      setPending(null);
    }
  }

  async function cancel() {
    setPending("cancel");
    try {
      await postJson("/api/subscriptions/cancel");
      toast({ title: "Subscription cancelled", description: "You'll keep access until the end of your billing period." });
      refresh();
    } catch (err) {
      toast({
        title: "Could not cancel",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPending(null);
    }
  }

  async function resume() {
    setPending("resume");
    try {
      await postJson("/api/subscriptions/resume");
      toast({ title: "Subscription resumed", description: "Auto-renew is back on." });
      refresh();
    } catch (err) {
      toast({
        title: "Could not resume",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPending(null);
    }
  }

  async function changePlan(plan: PlanId) {
    setPending(plan);
    try {
      await postJson("/api/subscriptions/change", { plan });
      toast({ title: "Plan updated", description: "Your subscription has been changed." });
      refresh();
    } catch (err) {
      toast({
        title: "Could not change plan",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPending(null);
    }
  }

  return { pending, checkout, confirm, openPortal, cancel, resume, changePlan };
}
