/**
 * Post-trial lock: after a free month ends (and before a paid plan starts),
 * Today's moves shows the trial report and other product tabs stay locked.
 */

export function accountNeedsPaidPlan(account) {
  if (!account || typeof account !== "object") return false;
  if (account.needsPaidPlan === true || account.trialEnded === true) return true;
  const status = String(account.status || "").toLowerCase();
  if (status === "trial_ended" || status === "past_due") return true;
  if (status === "active" || status === "paid" || status === "cancelled" || status === "paused") return false;
  if (status !== "trial" && !account.freeMonth && !Number(account.trialDays)) return false;
  const endsRaw = account.trialEndsAt || account.paidThrough || account.renewsAt;
  if (!endsRaw) return false;
  const ends = new Date(endsRaw).getTime();
  if (!Number.isFinite(ends)) return false;
  return Date.now() > ends;
}

/** Routes still reachable while the workspace is locked after trial. */
export function isTrialLockAllowedPath(pathname = "") {
  const p = String(pathname || "");
  if (p === "/app" || p === "/app/") return true;
  if (p === "/app/trial-report" || p.startsWith("/app/trial-report/")) return true;
  if (p === "/app/billing" || p.startsWith("/app/billing/")) return true;
  if (p === "/app/plans" || p.startsWith("/app/plans/")) return true;
  if (p === "/app/plan" || p.startsWith("/app/plan/")) return true;
  if (p === "/app/settings" || p.startsWith("/app/settings/")) return true;
  if (p === "/app/cancel" || p.startsWith("/app/cancel/")) return true;
  return false;
}

export function trialLockRedirect(pathname = "") {
  if (isTrialLockAllowedPath(pathname)) return null;
  return "/app";
}
