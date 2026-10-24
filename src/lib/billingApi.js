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
