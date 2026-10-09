import { authHeaders, getUser } from "@/utils/users/Helpers";

const KEY = "sf_journey_v1";
const SYNC_DELAY = 500;
let syncTimer = null;
let hydrated = null;

function ownerKey() {
  const user = typeof window === "undefined" ? null : getUser();
  return String(user?.result?.username || user?.data?.username || user?.result?.email || "");
}

export const PLANS = [
  { id: "starter", name: "Starter", price: 29, annual: 24, sites: 1, keywords: 10, prompts: 5, audits: 2, desc: "One site. A clear next step." },
  { id: "growth", name: "Growth", price: 79, annual: 65, sites: 3, keywords: 50, prompts: 30, audits: 8, desc: "More coverage as you grow." },
  { id: "agency", name: "Agency", price: 199, annual: 165, sites: 10, keywords: 200, prompts: 100, audits: 30, desc: "A workspace for your clients." },
];

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
  return PLANS.find((plan) => plan.id === id) || null;
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
