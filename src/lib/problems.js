/**
 * Turn API responses into "problems" for <ProblemNotice>.
 *
 * The backend sends, on errors:   { detail, problem: { code, area, severity, title, message, steps, action, helpUrl, technical } }
 * and on success (some reports):  { ..., warnings: [problem, ...] }
 *
 * Older endpoints only send `detail`; we still build a usable problem from it so every screen
 * can show the same notice with a Help button.
 */

const AREA_LABELS = {
  keywords: "Keywords",
  backlinks: "Backlinks",
  ai_visibility: "AI visibility",
  site_audit: "Site audit",
  site_scan: "Site scan",
  search_console: "Search Console",
  analytics: "Analytics",
  google: "Google connection",
};

export const SUPPORT_EMAIL = "support@searchify.io";

function detailText(detail) {
  if (typeof detail === "string") return detail;
  if (detail && typeof detail.message === "string") return detail.message;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return "";
}

/** Problems for a failed response (empty array when the response is ok). */
export function errorProblems(res, area = "") {
  if (!res || res.ok) return [];
  const data = res.data || {};
  if (data.problem && typeof data.problem === "object") return [data.problem];
  const message = detailText(data.detail) || (typeof data.message === "string" ? data.message : "");
  const code = data.detail && typeof data.detail === "object" ? data.detail.code || "" : "";
  const label = AREA_LABELS[area] || "This report";
  const offline = !res.status;
  return [
    {
      code: code || (offline ? "network" : `http_${res.status || 0}`),
      area,
      severity: "error",
      title: offline ? "Could not reach Searchify" : `${label} could not load`,
      message: message || (offline ? "Check your internet connection." : "The server returned an error."),
      steps: offline
        ? ["Check your internet connection.", "Try again."]
        : ["Try again in a minute.", `If it keeps failing, email ${SUPPORT_EMAIL} with the details below.`],
      action: { label: "Try again", do: "retry" },
      helpUrl: "",
      technical: res.status ? `HTTP ${res.status}${code ? ` · ${code}` : ""}` : "",
    },
  ];
}

/** Warnings attached to a successful response. */
export function warningProblems(res) {
  if (!res?.ok) return [];
  const list = res.data?.warnings;
  return Array.isArray(list) ? list.filter((w) => w && typeof w === "object" && w.title) : [];
}

/** Errors + warnings for one response. */
export function problemsFrom(res, area = "") {
  return res?.ok ? warningProblems(res) : errorProblems(res, area);
}

/** Where an action button goes inside the app (null = handled by the caller, e.g. retry). */
export function actionHref(action) {
  if (!action) return null;
  if (action.href) return action.href;
  switch (action.do) {
    case "open_setup":
    case "open_market":
      return "/app/setup";
    case "open_plans":
      return "/app/plans";
    case "open_profile":
      return "/app/setup/profile";
    case "open_connections":
      return "/app/connections";
    case "reconnect_google":
      return "/app/connections/google";
    case "open_property_picker":
      return action.value ? `/app/connections/google?gsc=${encodeURIComponent(action.value)}` : "/app/connections/google";
    case "contact_support":
      return `mailto:${SUPPORT_EMAIL}`;
    default:
      return null;
  }
}

/** Plain-text summary for "Copy details" (what support needs). */
export function problemReport(problem, extra = {}) {
  const lines = [
    `Area: ${AREA_LABELS[problem.area] || problem.area || "—"}`,
    `Code: ${problem.code || "—"}`,
    `Title: ${problem.title || ""}`,
    `Message: ${problem.message || ""}`,
  ];
  if (problem.technical) lines.push(`Technical: ${problem.technical}`);
  for (const [k, v] of Object.entries(extra)) if (v) lines.push(`${k}: ${v}`);
  if (typeof window !== "undefined") lines.push(`Page: ${window.location.pathname}`, `Time: ${new Date().toISOString()}`);
  return lines.join("\n");
}

export function supportMailto(problem) {
  const subject = encodeURIComponent(`Searchify help: ${problem.title || problem.code || "problem"}`);
  const body = encodeURIComponent(`${problemReport(problem)}\n\nWhat I was trying to do:\n`);
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}
