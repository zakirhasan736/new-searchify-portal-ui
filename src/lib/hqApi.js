import { authHeaders } from "@/utils/users/Helpers";

async function json(res) {
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function getHqMoney() {
  return json(await fetch("/api/v1/hq/money", { headers: authHeaders(), cache: "no-store" }));
}

export async function declareHqDividend(pool, note = "") {
  return json(
    await fetch("/api/v1/hq/dividends/declare", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ pool, note }),
    }),
  );
}

export async function approveHqDividend(runId) {
  return json(
    await fetch(`/api/v1/hq/dividends/${encodeURIComponent(runId)}/approve`, {
      method: "POST",
      headers: authHeaders(),
    }),
  );
}

export async function markHqDividendPaid(runId, reference) {
  return json(
    await fetch(`/api/v1/hq/dividends/${encodeURIComponent(runId)}/paid`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ reference }),
    }),
  );
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

export async function getHqCancellations() {
  return json(await fetch("/api/v1/hq/cancellations", { headers: authHeaders(), cache: "no-store" }));
}

export async function hqCancellationAction(itemId, body) {
  return json(
    await fetch(`/api/v1/hq/cancellations/${encodeURIComponent(itemId)}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
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

/** Owner creates an invite-only investor login and emails a set-password link. */
export async function createHqInvestor(body) {
  return json(
    await fetch("/api/v1/hq/investors", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function resendHqInvestorInvite(investorId) {
  return json(
    await fetch(`/api/v1/hq/investors/${encodeURIComponent(investorId)}/invite`, {
      method: "POST",
      headers: authHeaders(),
    }),
  );
}

/** founding: investors and developers (35-40%). Otherwise the affiliate program (20-25%). Rate defaults to the program's start. */
export async function approvePartnerApplication(id, { rate = null, founding = false } = {}) {
  return json(
    await fetch(`/api/v1/hq/partners/applications/${encodeURIComponent(id)}/approve`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(rate == null ? { founding } : { rate, founding }),
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

export async function getPayoutSettings() {
  return json(await fetch("/api/v1/hq/payout-settings", { headers: authHeaders(), cache: "no-store" }));
}

export async function savePayoutSettings(body) {
  return json(
    await fetch("/api/v1/hq/payout-settings", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function getPayoutStatements() {
  return json(await fetch("/api/v1/hq/statements", { headers: authHeaders(), cache: "no-store" }));
}

export async function draftPayoutStatement(body) {
  return json(
    await fetch("/api/v1/hq/statements", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function editPayoutStatement(id, body) {
  return json(
    await fetch(`/api/v1/hq/statements/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function approvePayoutStatement(id, note = "") {
  return json(
    await fetch(`/api/v1/hq/statements/${encodeURIComponent(id)}/approve`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ note }),
    }),
  );
}

export async function rejectPayoutStatement(id, note = "") {
  return json(
    await fetch(`/api/v1/hq/statements/${encodeURIComponent(id)}/reject`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ note }),
    }),
  );
}
