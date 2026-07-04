/**
 * Stripe webhook processing. Delegates signature verification + data sync to
 * stripe-replit-sync, then reconciles the subscription state onto our own
 * users table (premium flag / role / expiry) so feature gating stays in sync.
 */

import { getStripeSync } from "./stripeClient";
import { reconcileSubscriptionsForCustomer } from "./subscriptionSync";

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "STRIPE WEBHOOK ERROR: Payload must be a Buffer. Received type: " +
          typeof payload +
          ". Ensure the webhook route is registered BEFORE app.use(express.json()).",
      );
    }

    const sync = await getStripeSync();
    // Verifies the signature (throws on mismatch) and syncs data into the stripe schema.
    await sync.processWebhook(payload, signature);

    // Payload is now verified; parse it to reconcile our own user flags.
    try {
      const event = JSON.parse(payload.toString("utf8")) as {
        type?: string;
        data?: { object?: Record<string, unknown> };
      };
      const obj = event.data?.object;
      let customerId: string | undefined;
      if (obj) {
        if (typeof obj.customer === "string") customerId = obj.customer;
        else if (typeof obj.id === "string" && event.type?.startsWith("customer.")) {
          customerId = obj.id as string;
        }
      }
      if (customerId) {
        await reconcileSubscriptionsForCustomer(customerId);
      }
    } catch {
      // Reconciliation is best-effort; the status-read path also reconciles.
    }
  }
}
