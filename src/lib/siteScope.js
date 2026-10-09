import { hostnameOf } from "@/lib/businessBrief";
import { activeJourneySite, loadJourney, readySites } from "@/lib/journey";

const STORE = "sf_page_sites_v1";
const GLOBAL = "sf_global_site_v1";

const LOCAL_PAGES = {
  "/app/keywords": "keywords",
  "/app/backlinks": "backlinks",
  "/app/visibility": "visibility",
  "/app/results": "results",
  "/app/history": "history",
};

export function pageScope(pathname) {
  return LOCAL_PAGES[pathname] || "";
}

export function loadPageSites() {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(window.sessionStorage.getItem(STORE) || "");
    return raw && typeof raw === "object" ? raw : {};
  } catch {
    return {};
  }
}

export function clearPageSites() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORE);
}

export function saveGlobalSite(option) {
  if (!option?.key || typeof window === "undefined") return;
  window.sessionStorage.setItem(GLOBAL, JSON.stringify({
    key: option.key,
    id: option.id,
    kind: option.kind,
    label: option.label || "",
  }));
}

export function loadGlobalSite() {
  if (typeof window === "undefined") return null;
  try {
    const raw = JSON.parse(window.sessionStorage.getItem(GLOBAL) || "");
    return raw && raw.key ? raw : null;
  } catch {
    return null;
  }
}

export function setPageSiteKey(scope, option) {
  if (!scope || !option?.key) return;
  const next = {
    ...loadPageSites(),
    [scope]: { key: option.key, id: option.id, kind: option.kind, label: option.label || "" },
  };
  window.sessionStorage.setItem(STORE, JSON.stringify(next));
}

function savedChoice(scope) {
  if (!scope) return null;
  const saved = loadPageSites()[scope];
  if (!saved) return null;
  if (typeof saved === "string") return { key: saved, id: saved.split(":")[1], kind: saved.startsWith("cms:") ? "cms" : "journey" };
  return saved;
}

function siteFromChoice(choice, state) {
  if (!choice) return null;
  if (choice.kind === "journey") {
    return readySites(state).find((site) => String(site.id) === String(choice.id)) || null;
  }
  if (choice.kind === "cms") {
    const host = hostnameOf(choice.label) || String(choice.label || "").replace(/^https?:\/\//, "");
    const match = readySites(state).find((site) => hostnameOf(site?.answers?.site) === host);
    const base = match || activeJourneySite(state);
    const answers = { ...(base?.answers || {}) };
    if (host) answers.site = `https://${host}`;
    return { id: base?.id || choice.id, answers };
  }
  return null;
}

export function siteForScope(scope) {
  const state = loadJourney();
  const saved = (scope && savedChoice(scope)) || loadGlobalSite();
  return siteFromChoice(saved, state) || activeJourneySite(state);
}

export function effectiveSiteKey(scope, site = siteForScope(scope)) {
  const saved = (scope && savedChoice(scope)) || loadGlobalSite();
  if (saved?.key) return saved.key;
  return site?.id ? `journey:${site.id}` : "";
}
