// Partner referral links look like https://searchify.io/?ref=<handle>&c=<campaign>.
// The handle is kept for 60 days (the partner terms' tracking window) and sent with sign-up.
const KEY = "searchify-ref";
const WINDOW_MS = 60 * 24 * 60 * 60 * 1000;

function clean(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
}

export function captureReferral() {
  if (typeof window === "undefined") return;
  let ref = "";
  let campaign = "";
  try {
    const params = new URLSearchParams(window.location.search);
    ref = clean(params.get("ref"));
    campaign = clean(params.get("c"));
  } catch {
    return;
  }
  if (!ref) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ref, c: campaign, at: Date.now() }));
  } catch {
    /* storage blocked: the click is still counted below */
  }
  // Count one click per browser session per partner.
  const seen = `searchify-ref-click-${ref}`;
  try {
    if (sessionStorage.getItem(seen)) return;
    sessionStorage.setItem(seen, "1");
  } catch {
    /* ignore */
  }
  fetch("/api/v1/partners/click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref, c: campaign }),
    keepalive: true,
  }).catch(() => {});
}

export function readReferral() {
  if (typeof window === "undefined") return "";
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!saved?.ref || Date.now() - Number(saved.at || 0) > WINDOW_MS) return "";
    return saved.ref;
  } catch {
    return "";
  }
}
