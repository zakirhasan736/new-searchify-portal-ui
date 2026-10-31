import { authHeaders } from "@/utils/users/Helpers";

async function json(res) {
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function getBillingCatalog() {
  return json(await fetch("/api/v1/billing/catalog", { cache: "no-store" }));
}

export async function getBillingAccount() {
  return json(
    await fetch("/api/v1/billing/account", {
      cache: "no-store",
      headers: authHeaders(),
    }),
  );
}

export async function startCheckout({ planId, billing = "monthly", email = "" }) {
  return json(
    await fetch("/api/v1/billing/checkout", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ planId, billing, email }),
    }),
  );
}

export async function requestEnterpriseQuote({ email, sites, note = "" }) {
  const headers = { "Content-Type": "application/json", ...authHeaders() };
  return json(
    await fetch("/api/v1/billing/enterprise-quote", {
      method: "POST",
      headers,
      body: JSON.stringify({ email, sites, note }),
    }),
  );
}

export async function cancelSubscription({ reason = "", detail = "", note = "" } = {}) {
  return json(
    await fetch("/api/v1/billing/cancel", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ reason, detail, note }),
    }),
  );
}

export async function reactivateSubscription() {
  return json(
    await fetch("/api/v1/billing/reactivate", {
      method: "POST",
      headers: authHeaders(),
    }),
  );
}

export async function takeRetentionOffer({ action, reason = "", detail = "", note = "" }) {
  return json(
    await fetch("/api/v1/billing/retention", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ action, reason, detail, note }),
    }),
  );
}
