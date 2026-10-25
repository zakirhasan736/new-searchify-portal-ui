import { authHeaders, getUser } from "@/utils/users/Helpers";

const KEY = "sf_journey_v1";
const PENDING_SITE_KEY = "sf_pending_site_v1";
const SYNC_DELAY = 500;
let syncTimer = null;
let hydrated = null;

/** Normalize a marketing-form URL into https://… for setup / scan. */
export function normalizeSiteUrl(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) return text;
  return `https://${text.replace(/^\/+/, "")}`;
}

/** Stash a site from the public landing hero until signup → setup. */
export function stashPendingSite(url) {
  if (typeof window === "undefined") return;
  const normalized = normalizeSiteUrl(url);
  try {
    if (!normalized) sessionStorage.removeItem(PENDING_SITE_KEY);
    else sessionStorage.setItem(PENDING_SITE_KEY, normalized);
  } catch {
    /* ignore */
  }
}

export function peekPendingSite() {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(PENDING_SITE_KEY) || "";
  } catch {
    return "";
  }
}

export function takePendingSite() {
  const value = peekPendingSite();
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(PENDING_SITE_KEY);
    } catch {
      /* ignore */
    }
  }
  return value;
}

/** Put a pending / query site onto the active draft so /app/start opens prefilled. */
export function seedDraftSite(url) {
  const siteUrl = normalizeSiteUrl(url);
  if (!siteUrl) return null;
  const state = loadJourney();
  let draft = state.sites.find((site) => site.status === "draft");
  if (!draft) {
    const id = Date.now();
    draft = { id, answers: {}, status: "draft", createdAt: id };
    state.sites.push(draft);
  }
  draft.answers = { ...(draft.answers || {}), site: siteUrl };
  state.activeId = draft.id;
  save(state);
  stashPendingSite("");
  return draft;
}

function ownerKey() {
  const user = typeof window === "undefined" ? null : getUser();
  return String(user?.result?.username || user?.data?.username || user?.result?.email || "");
}

/** V8 public names (Solo / Pro / Premium). Ids stay starter/growth/agency for quotas + stored journeys. */
export const PLANS = [
  {
    id: "starter",
    alias: "solo",
    name: "Solo",
    price: 29,
    annual: 24,
    sites: 1,
    keywords: 10,
    prompts: 5,
    audits: 2,
    desc: "One business. One website.",
  },
  {
    id: "growth",
    alias: "pro",
    name: "Pro",
    price: 79,
    annual: 66,
    sites: 5,
    keywords: 50,
    prompts: 30,
    audits: 8,
    desc: "Growing teams. Up to five websites.",
  },
  {
    id: "agency",
    alias: "premium",
    name: "Premium",
    price: 399,
    annual: 332,
    sites: 25,
    keywords: 200,
    prompts: 100,
    audits: 30,
    desc: "Agencies. Up to 25 websites.",
  },
];

export const PLAN_ALIAS = {
  solo: "starter",
  pro: "growth",
  premium: "agency",
  starter: "starter",
  growth: "growth",
  agency: "agency",
};

function empty() {
  return { planId: null, billing: "monthly", sites: [], activeId: null };
}

export function loadJourney() {
  if (typeof window === "undefined") return empty();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "");
    if (!raw || !Array.isArray(raw.sites)) return empty();
    return {
      planId: raw.planId || null,
      billing: raw.billing === "annual" ? "annual" : "monthly",
      sites: raw.sites,
      activeId: raw.activeId || null,
      owner: raw.owner || "",
      dirty: Boolean(raw.dirty),
    };
  } catch {
    return empty();
  }
}

function writeLocal(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
  return state;
}

function save(state) {
  writeLocal({ ...state, owner: ownerKey(), dirty: true });
  if (syncTimer) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    syncTimer = null;
    syncJourneyNow().catch(() => {});
  }, SYNC_DELAY);
  return state;
}

function serverShape(state) {
  const { planId, billing, sites, activeId } = state;
  return { planId, billing, sites, activeId };
}

/** Push the local journey to the server. Resolves to { ok, error }. */
export async function syncJourneyNow() {
  if (typeof window === "undefined") return { ok: false, error: "Not in a browser." };
  if (syncTimer) {
    window.clearTimeout(syncTimer);
    syncTimer = null;
  }
  const state = loadJourney();
  let res;
  try {
    res = await fetch("/api/v1/operator/journey", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ state: serverShape(state) }),
    });
  } catch {
    return { ok: false, error: "Could not reach Searchify. Your answers are kept on this device; try again." };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof data.detail === "string" ? data.detail : data.detail?.message;
    return { ok: false, error: detail || `Saving your setup failed (HTTP ${res.status}).` };
  }
  const latest = loadJourney();
  if (JSON.stringify(serverShape(latest)) === JSON.stringify(serverShape(state))) {
    writeLocal({ ...latest, dirty: false, owner: ownerKey() });
  }
  return { ok: true, profiles: data.profiles || [] };
}

/** Load the signed-in user's journey from the server once per page load. */
export function hydrateJourney({ force = false } = {}) {
  if (typeof window === "undefined") return Promise.resolve(empty());
  if (hydrated && !force) return hydrated;
  hydrated = (async () => {
    const local = loadJourney();
    const me = ownerKey();
    const mine = !local.owner || local.owner === me;
    let server = null;
    try {
      const res = await fetch("/api/v1/operator/journey", { headers: authHeaders(), cache: "no-store" });
      if (!res.ok) return mine ? local : empty();
      server = (await res.json().catch(() => ({})))?.journey?.state || null;
    } catch {
      return mine ? local : empty();
    }
    if (mine && local.dirty && local.sites.length) {
      await syncJourneyNow();
      return loadJourney();
    }
    if (server) {
      writeLocal({ ...empty(), ...server, owner: me, dirty: false });
    } else if (mine && local.sites.length) {
      writeLocal({ ...local, owner: me, dirty: true });
      await syncJourneyNow();
    } else {
      writeLocal({ ...empty(), owner: me, dirty: false });
    }
    window.dispatchEvent(new CustomEvent("sf-site", { detail: { id: loadJourney().activeId } }));
    return loadJourney();
  })();
  return hydrated;
}

export function planById(id) {
  const canonical = PLAN_ALIAS[String(id || "").toLowerCase()] || id;
  return PLANS.find((plan) => plan.id === canonical || plan.alias === id) || null;
}

export function readySites(state = loadJourney()) {
  return state.sites.filter((site) => site.status === "ready");
}

export function activeJourneySite(state = loadJourney()) {
  return state.sites.find((site) => site.id === state.activeId) || readySites(state).at(-1) || null;
}

export function websiteLabel(site) {
  const raw = site?.answers?.site || "";
  if (!raw) return "Website";
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return String(raw).replace(/^https?:\/\//, "") || "Website";
  }
}

export function selectJourneySite(id) {
  const state = loadJourney();
  const site = readySites(state).find((item) => String(item.id) === String(id));
  if (!site) return null;
  state.activeId = site.id;
  save(state);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sf-site", { detail: { id: site.id } }));
  }
  return site;
}

export function requiredJourneyPath(pathname) {
  if (!pathname?.startsWith("/app")) return null;
  if (pathname === "/app/start" || pathname === "/app/plans") return null;
  // Account settings (password, email) must work before a website is set up.
  if (pathname === "/app/settings") return null;
  const state = loadJourney();
  if (!readySites(state).length) return "/app/start";
  if (!state.planId) return "/app/plans";
  return null;
}

export function postLoginPath() {
  return requiredJourneyPath("/app") || "/app";
}

export function resumeSetup() {
  const state = loadJourney();
  const site = activeJourneySite(state) || state.sites.at(-1);
  if (!site) return beginAnotherWebsite();
  site.status = "draft";
  site.answers = site.answers || {};
  state.activeId = site.id;
  save(state);
  return "/app/start";
}

export async function dropReadyWebsite(site) {
  const href = site?.answers?.site || site?.siteUrl || site?.url || "";
  removeJourneySite(site?.id);
  const saved = await syncJourneyNow();
  return { ...saved, href };
}

export function removeJourneySite(id) {
  const state = loadJourney();
  state.sites = state.sites.filter((site) => String(site.id) !== String(id));
  if (String(state.activeId) === String(id)) {
    const next = state.sites.find((site) => site.status === "ready") || state.sites.at(-1);
    state.activeId = next?.id || null;
  }
  save(state);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sf-site", { detail: { id: state.activeId } }));
  }
  return state;
}

export function assignGoogleAccount(siteId, email) {
  const state = loadJourney();
  const site = state.sites.find((item) => String(item.id) === String(siteId));
  if (!site) return null;
  site.answers = { ...(site.answers || {}), googleEmail: email || "" };
  save(state);
  return site;
}

export function setSiteAnswer(siteId, key, value) {
  const state = loadJourney();
  const site = state.sites.find((item) => String(item.id) === String(siteId));
  if (!site) return null;
  site.answers = { ...(site.answers || {}), [key]: value };
  save(state);
  return site;
}

export function addReadyWebsite(raw, limit) {
  const state = loadJourney();
  const cap = Number(limit) > 0 ? Number(limit) : planById(state.planId)?.sites || 1;
  let href = String(raw || "").trim();
  if (!href) return { ok: false, error: "Enter the website address." };
  if (!/^https?:\/\//i.test(href)) href = `https://${href}`;
  let host = "";
  try {
    const url = new URL(href);
    host = url.hostname.replace(/^www\./, "");
    if (!host.includes(".")) return { ok: false, error: "Enter a full website address, like example.com." };
    href = url.origin;
  } catch {
    return { ok: false, error: "Enter a full website address, like example.com." };
  }
  const ready = readySites(state);
  const existing = ready.find((site) => {
    const current = String(site.answers?.site || "")
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./, "")
      .split("/")[0];
    return current === host;
  });
  if (existing) {
    state.activeId = existing.id;
    save(state);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sf-site", { detail: { id: existing.id } }));
    }
    return { ok: true, site: existing, switched: true, limit: cap };
  }
  if (ready.length >= cap) return { ok: false, error: "limit", limit: cap };
  const id = Date.now();
  const site = { id, answers: { site: href }, status: "ready", createdAt: id };
  state.sites.push(site);
  state.activeId = id;
  save(state);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sf-site", { detail: { id } }));
  }
  return { ok: true, site, limit: cap };
}

export function beginAnotherWebsite() {
  const state = loadJourney();
  const plan = planById(state.planId);
  if (plan && readySites(state).length >= plan.sites) return "/app/plans?upgrade=1";
  const existing = state.sites.find((site) => site.status === "draft");
  if (!existing) {
    const id = Date.now();
    state.sites.push({ id, answers: {}, status: "draft", createdAt: id });
    state.activeId = id;
    save(state);
  } else {
    state.activeId = existing.id;
    save(state);
  }
  return "/app/start?new=1";
}

export function draftForSetup(isNew) {
  const state = loadJourney();
  let draft = state.sites.find((site) => site.status === "draft");
  if (!draft && (isNew || !readySites(state).length)) {
    const id = Date.now();
    draft = { id, answers: {}, status: "draft", createdAt: id };
    state.sites.push(draft);
    state.activeId = id;
    save(state);
  }
  return draft;
}

export function markConnection(key, value) {
  const state = loadJourney();
  const site = state.sites.find((item) => item.id === state.activeId) || state.sites.at(-1);
  if (!site) return state;
  site.answers = { ...(site.answers || {}), [key]: value };
  return save(state);
}

export function saveDraft(answers, step) {
  const state = loadJourney();
  const draft = state.sites.find((site) => site.status === "draft");
  if (!draft) return;
  draft.answers = answers;
  if (Number.isFinite(step)) draft.step = step;
  state.activeId = draft.id;
  save(state);
}

export function profileFromAnswers(answers = {}) {
  return {
    business: "",
    services: "",
    areas: answers.market || "",
    locations: answers.market || "",
    claims: "Only facts that are visible on the live page.",
    voice: "",
    restrictions: [answers.industry, answers.avoid].filter((item) => item && item !== "No special category").join(". "),
  };
}

export function completeDraft(answers) {
  const state = loadJourney();
  let draft = state.sites.find((site) => site.status === "draft");
  if (!draft) {
    const id = Date.now();
    draft = { id, answers, status: "ready", createdAt: id };
    state.sites.push(draft);
  } else {
    draft.answers = answers;
    draft.status = "ready";
  }
  state.activeId = draft.id;
  save(state);
  return state.planId ? "/app" : "/app/plans";
}

export function choosePlan(planId, billing) {
  const plan = planById(planId);
  if (!plan) return null;
  const state = loadJourney();
  if (readySites(state).length > plan.sites) return null;
  state.planId = plan.id;
  state.billing = billing === "annual" ? "annual" : "monthly";
  save(state);
  return "/app";
}

export function recommendationsFor(site) {
  if (!site?.answers) return [];
  const answers = site.answers;
  const market = answers.market || "your market";
  const offer = answers.businessType || "your offer";
  const page = answers.site || "your homepage";
  return [
    {
      title: `Name ${market} in the page title`,
      detail: `The setup brief says customers are in ${market}. A title that names the place is the first review.`,
      path: page,
    },
    {
      title: `Describe ${offer} in the meta description`,
      detail: "Draft a factual summary from the business type you confirmed. Nothing goes live until you approve it.",
      path: page,
    },
    {
      title: "Check pages that do not match the brief",
      detail: answers.avoid
        ? `Keep these out of suggestions: ${answers.avoid}.`
        : "Searchify will hold live edits until you approve each title and description.",
      path: page,
    },
  ];
}
