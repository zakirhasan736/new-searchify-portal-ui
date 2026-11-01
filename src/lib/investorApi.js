import { authHeaders } from "@/utils/users/Helpers";

async function json(res) {
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function investorSignIn(body) {
  return json(
    await fetch("/api/v1/investors/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export async function getInvestorMe() {
  return json(await fetch("/api/v1/investors/me", { headers: authHeaders(), cache: "no-store" }));
}

export async function getInvestorStake() {
  return json(await fetch("/api/v1/investors/stake", { headers: authHeaders(), cache: "no-store" }));
}

export async function getInvestorEarnings() {
  return json(await fetch("/api/v1/investors/earnings", { headers: authHeaders(), cache: "no-store" }));
}

export async function getInvestorPlaybook() {
  return json(await fetch("/api/v1/investors/playbook", { headers: authHeaders(), cache: "no-store" }));
}

export async function sendInvestorMessage(note) {
  return json(
    await fetch("/api/v1/investors/message", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ note }),
    }),
  );
}
