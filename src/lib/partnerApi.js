import { authHeaders } from "@/utils/users/Helpers";

async function json(res) {
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function partnerSignIn(email, password) {
  return json(
    await fetch("/api/v1/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email.trim(), password }),
    }),
  );
}

export async function partnerApply(body) {
  return json(
    await fetch("/api/v1/partners/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export async function partnerResetPassword(email) {
  return json(
    await fetch("/api/v1/partners/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }),
  );
}

export async function getPartnerMe() {
  return json(await fetch("/api/v1/partners/me", { headers: authHeaders(), cache: "no-store" }));
}

export async function getPartnerOverview() {
  return json(await fetch("/api/v1/partners/overview", { headers: authHeaders(), cache: "no-store" }));
}

export async function getPartnerEarnings() {
  return json(await fetch("/api/v1/partners/earnings", { headers: authHeaders(), cache: "no-store" }));
}

export async function getPartnerPayout() {
  return json(await fetch("/api/v1/partners/payout", { headers: authHeaders(), cache: "no-store" }));
}

export async function savePartnerPayout(body) {
  return json(
    await fetch("/api/v1/partners/payout", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export function partnerInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function partnerSetPassword(token, password) {
  return json(
    await fetch("/api/v1/partners/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    }),
  );
}
