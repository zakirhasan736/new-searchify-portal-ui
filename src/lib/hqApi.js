import { authHeaders } from "@/utils/users/Helpers";

async function json(res) {
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function getHqOverview(range = "30") {
  const q = new URLSearchParams({ range: String(range) });
  return json(await fetch(`/api/v1/hq/overview?${q}`, { headers: authHeaders(), cache: "no-store" }));
}

export async function getHqCustomers({ q = "", status = "all" } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status && status !== "all") params.set("status", status);
  const qs = params.toString();
  return json(
    await fetch(`/api/v1/hq/customers${qs ? `?${qs}` : ""}`, { headers: authHeaders(), cache: "no-store" }),
  );
}

export async function hqCustomerAction(customerId, body) {
  return json(
    await fetch(`/api/v1/hq/customers/${encodeURIComponent(customerId)}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function getHqPartners() {
  return json(await fetch("/api/v1/hq/partners", { headers: authHeaders(), cache: "no-store" }));
}

export async function saveHqPartners(body) {
  return json(
    await fetch("/api/v1/hq/partners", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function getHqProblems() {
  return json(await fetch("/api/v1/hq/problems", { headers: authHeaders(), cache: "no-store" }));
}

export async function hqProblemAction(problemId, action) {
  return json(
    await fetch(`/api/v1/hq/problems/${encodeURIComponent(problemId)}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ action }),
    }),
  );
}

export async function getHqShareholders() {
  return json(await fetch("/api/v1/hq/shareholders", { headers: authHeaders(), cache: "no-store" }));
}

export async function saveHqShareholders(body) {
  return json(
    await fetch("/api/v1/hq/shareholders", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function approvePartnerApplication(id, { rate = 30, founding = false } = {}) {
  return json(
    await fetch(`/api/v1/hq/partners/applications/${encodeURIComponent(id)}/approve`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ rate, founding }),
    }),
  );
}

export async function declinePartnerApplication(id) {
  return json(
    await fetch(`/api/v1/hq/partners/applications/${encodeURIComponent(id)}/decline`, {
      method: "POST",
      headers: authHeaders(),
    }),
  );
}

export async function resendPartnerInvite(partnerId) {
  return json(
    await fetch(`/api/v1/hq/partners/${encodeURIComponent(partnerId)}/invite`, {
      method: "POST",
      headers: authHeaders(),
    }),
  );
}

export async function runPartnerPayout(ids) {
  return json(
    await fetch("/api/v1/hq/partners/payout", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(ids ? { ids } : {}),
    }),
  );
}
