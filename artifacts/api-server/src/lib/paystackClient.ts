/**
 * Paystack API client for SameSky.
 * Currency: GHS (Ghanaian Cedi). All amounts in pesewas (1 GHS = 100 pesewas).
 * Docs: https://paystack.com/docs/api
 */

const PAYSTACK_BASE = "https://api.paystack.co";

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error(
      "PAYSTACK_SECRET_KEY environment variable is not set. " +
      "Add your Paystack secret key in the Secrets tab.",
    );
  }
  return key;
}

async function paystackFetch<T>(
  method: "GET" | "POST",
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const resp = await fetch(`${PAYSTACK_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });

  const data = await resp.json() as { status: boolean; message?: string; data: T };

  if (!resp.ok || !data.status) {
    throw new Error(
      `Paystack error [${resp.status}]: ${data.message ?? "Unknown error"}`,
    );
  }

  return data.data;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaystackInitData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyData {
  status: "success" | "failed" | "abandoned";
  reference: string;
  amount: number;       // in pesewas
  currency: string;
  paid_at: string;
  metadata: Record<string, string>;
  customer: { email: string };
}

// ─── API helpers ──────────────────────────────────────────────────────────────

/**
 * Initialize a Paystack transaction.
 * Returns the authorization_url to redirect the user to.
 */
export async function initializeTransaction(params: {
  email: string;
  amountPesewas: number;
  reference?: string;
  callbackUrl: string;
  metadata: Record<string, string>;
}): Promise<PaystackInitData> {
  return paystackFetch<PaystackInitData>("POST", "/transaction/initialize", {
    email: params.email,
    amount: params.amountPesewas,
    currency: "GHS",
    callback_url: params.callbackUrl,
    metadata: params.metadata,
    ...(params.reference ? { reference: params.reference } : {}),
  });
}

/**
 * Verify a Paystack transaction by reference.
 * Always verify server-side — never trust the client.
 */
export async function verifyTransaction(reference: string): Promise<PaystackVerifyData> {
  return paystackFetch<PaystackVerifyData>("GET", `/transaction/verify/${encodeURIComponent(reference)}`);
}
