const KEY = "sf_guardrails_v1";

export const BREADTH_LABELS = ["Exact-match suggestions", "Balanced suggestions", "Broader discovery"];

export function breadthKey(value) {
  return ["exact", "balanced", "broad"][Number(value)] || "balanced";
}

export function loadGuardrails() {
  if (typeof window === "undefined") return { breadth: 1, mode: "review" };
  try {
    const saved = JSON.parse(window.localStorage.getItem(KEY) || "{}");
    const breadth = [0, 1, 2].includes(Number(saved.breadth)) ? Number(saved.breadth) : 1;
    const mode = saved.mode === "drafts" ? "drafts" : "review";
    return { breadth, mode };
  } catch {
    return { breadth: 1, mode: "review" };
  }
}

export function saveGuardrails(next) {
  const breadth = [0, 1, 2].includes(Number(next.breadth)) ? Number(next.breadth) : 1;
  const mode = next.mode === "drafts" ? "drafts" : "review";
  const value = { breadth, mode };
  window.localStorage.setItem(KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("sf-guardrails", { detail: value }));
  return value;
}
