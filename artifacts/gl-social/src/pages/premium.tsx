import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, Loader2, Crown, Sparkles, Star, ShieldCheck } from "lucide-react";
import {
  usePlans,
  useSubscriptionStatus,
  useSubscriptionActions,
  SUB_STATUS_KEY,
  type SubscriptionPlan,
  type PlanId,
} from "@/hooks/use-subscription";
import { useCurrency } from "@/hooks/use-currency";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const PLAN_ICON: Record<PlanId, typeof Crown> = {
  premium_monthly: Sparkles,
  premium_yearly: Star,
  premium_lifetime: Crown,
};

export default function PremiumPage() {
  const { data: plansData, isLoading: plansLoading } = usePlans();
  const { data: status, isLoading: statusLoading } = useSubscriptionStatus();
  const { currency, formatFromUsd, isNativelyCharged } = useCurrency();
  const actions = useSubscriptionActions();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  // Handle Stripe Checkout redirect-back.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    const sessionId = params.get("session_id");
    if (!checkout) return;

    window.history.replaceState({}, "", window.location.pathname);

    if (checkout === "success" && sessionId) {
      setConfirming(true);
      actions
        .confirm(sessionId)
        .then(() => {
          toast({ title: "Welcome to Premium", description: "Your subscription is now active." });
          queryClient.invalidateQueries({ queryKey: SUB_STATUS_KEY });
        })
        .catch(() => {
          toast({
            title: "Almost there",
            description: "Payment received — your access will update shortly.",
          });
          queryClient.invalidateQueries({ queryKey: SUB_STATUS_KEY });
        })
        .finally(() => setConfirming(false));
    } else if (checkout === "cancelled") {
      toast({ title: "Checkout cancelled", description: "No charge was made." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plans = plansData?.plans ?? [];
  const isActive = status?.active ?? false;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
      <header className="max-w-2xl">
        <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-primary/30 bg-primary/10">
          <Crown className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium uppercase tracking-widest text-primary">SameSky Premium</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-white mb-3">
          Support the community you love
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Unlock the full SameSky experience — ad-free, unlimited, and closer to the Thai GL
          series and ships you follow. Prices shown in your currency; billed securely by Stripe.
        </p>
      </header>

      {confirming && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-white/80">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Confirming your subscription...
        </div>
      )}

      {/* Current subscription */}
      {statusLoading ? (
        <Skeleton className="h-32 w-full rounded-3xl" />
      ) : isActive && status ? (
        <ManageSubscription status={status} actions={actions} />
      ) : null}

      {/* Currency control */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-white/90">
            {isActive ? "Change your plan" : "Choose your plan"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isNativelyCharged
              ? `Billed in ${currency}.`
              : `${currency} isn't supported for payments — you'll be billed in USD.`}
          </p>
        </div>
        <div className="w-full sm:w-56">
          <CurrencySwitcher />
        </div>
      </div>

      {/* Plans */}
      {plansLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 w-full rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlan={status?.plan ?? null}
              isActive={isActive}
              isLifetime={status?.isLifetime ?? false}
              formatFromUsd={formatFromUsd}
              pending={actions.pending}
              onCheckout={() => actions.checkout(plan.id, currency)}
              onChange={() => actions.changePlan(plan.id)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-white/30">
        <ShieldCheck className="w-3.5 h-3.5" />
        Secure payments by Stripe. Cancel anytime. Prices converted live from USD.
      </div>
    </div>
  );
}

function ManageSubscription({
  status,
  actions,
}: {
  status: NonNullable<ReturnType<typeof useSubscriptionStatus>["data"]>;
  actions: ReturnType<typeof useSubscriptionActions>;
}) {
  const { formatMinorUnits } = useCurrency();
  const renews = status.currentPeriodEnd ? new Date(status.currentPeriodEnd) : null;
  const trialing = status.status === "trialing" && status.trialEnd;

  return (
    <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold text-white">{status.planName ?? "Premium"}</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              {status.isLifetime ? "Lifetime" : status.status}
            </span>
          </div>

          {status.isLifetime ? (
            <p className="text-sm text-white/70">You have lifetime access. Thank you for your support.</p>
          ) : (
            <div className="space-y-1 text-sm text-white/70">
              {status.amountMinorUnits != null && status.currency && (
                <p>
                  {formatMinorUnits(status.amountMinorUnits, status.currency)}
                  {status.interval ? ` / ${status.interval}` : ""}
                </p>
              )}
              {trialing && status.trialEnd && (
                <p className="text-primary">Free trial ends {format(new Date(status.trialEnd), "PP")}</p>
              )}
              {renews && (
                <p>
                  {status.cancelAtPeriodEnd ? "Access ends " : "Renews "}
                  {format(renews, "PP")}
                </p>
              )}
            </div>
          )}
        </div>

        {!status.isLifetime && (
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            {status.cancelAtPeriodEnd ? (
              <button
                onClick={actions.resume}
                disabled={actions.pending !== null}
                className="rounded-full bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 hover:bg-primary/90 transition-all disabled:opacity-60"
              >
                {actions.pending === "resume" ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Resume auto-renew"}
              </button>
            ) : (
              <button
                onClick={actions.cancel}
                disabled={actions.pending !== null}
                className="rounded-full border border-white/15 bg-white/5 text-white/80 text-sm font-medium px-5 py-2.5 hover:bg-white/10 transition-all disabled:opacity-60"
              >
                {actions.pending === "cancel" ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Cancel subscription"}
              </button>
            )}
            {status.hasStripeCustomer && (
              <button
                onClick={actions.openPortal}
                disabled={actions.pending !== null}
                className="rounded-full text-white/50 text-xs font-medium px-5 py-2 hover:text-white/80 transition-all disabled:opacity-60"
              >
                {actions.pending === "portal" ? "Opening..." : "Manage billing & invoices"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  currentPlan,
  isActive,
  isLifetime,
  formatFromUsd,
  pending,
  onCheckout,
  onChange,
}: {
  plan: SubscriptionPlan;
  currentPlan: PlanId | null;
  isActive: boolean;
  isLifetime: boolean;
  formatFromUsd: (usd: number) => string;
  pending: string | null;
  onCheckout: () => void;
  onChange: () => void;
}) {
  const Icon = PLAN_ICON[plan.id];
  const isCurrent = currentPlan === plan.id;
  const isBusy = pending === plan.id;
  const lockedByLifetime = isLifetime; // lifetime users need nothing more
  const canChange = isActive && !isLifetime && plan.kind === "subscription" && !isCurrent;

  let cta: { label: string; action: () => void; disabled: boolean; primary: boolean };
  if (isCurrent) {
    cta = { label: "Current plan", action: () => {}, disabled: true, primary: false };
  } else if (lockedByLifetime) {
    cta = { label: "Included", action: () => {}, disabled: true, primary: false };
  } else if (canChange) {
    cta = { label: "Switch to this plan", action: onChange, disabled: pending !== null, primary: plan.highlight };
  } else {
    cta = {
      label: plan.trialDays > 0 ? `Start ${plan.trialDays}-day free trial` : "Get started",
      action: onCheckout,
      disabled: pending !== null,
      primary: plan.highlight,
    };
  }

  return (
    <div
      className={`relative flex flex-col rounded-3xl border p-6 transition-all ${
        plan.highlight
          ? "border-primary/40 bg-gradient-to-b from-primary/10 to-transparent shadow-2xl shadow-primary/5"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
      }`}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-widest bg-primary text-primary-foreground px-3 py-1 rounded-full">
          Best value
        </span>
      )}

      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 border border-white/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-semibold uppercase tracking-widest text-white/60">{plan.name}</span>
      </div>

      <div className="mb-1">
        <span className="text-4xl font-bold tracking-tight text-white">{formatFromUsd(plan.priceUsd)}</span>
        {plan.interval && <span className="text-sm text-white/40 ml-1.5">/ {plan.interval}</span>}
      </div>
      <p className="text-sm text-muted-foreground mb-6 min-h-[40px]">{plan.description}</p>

      <ul className="space-y-2.5 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-white/75">
            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={cta.action}
        disabled={cta.disabled}
        className={`w-full rounded-full text-sm font-semibold px-5 py-3 transition-all disabled:cursor-not-allowed ${
          cta.primary
            ? "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            : cta.disabled && isCurrent
              ? "border border-primary/30 bg-primary/10 text-primary"
              : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 disabled:opacity-50"
        }`}
      >
        {isBusy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : cta.label}
      </button>
    </div>
  );
}
