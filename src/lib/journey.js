const KEY = "sf_journey_v1";

export const PLANS = [
  { id: "starter", name: "Starter", price: 29, annual: 24, sites: 1, keywords: 25, prompts: 5, audits: 2, desc: "One site. A clear next step." },
  { id: "growth", name: "Growth", price: 79, annual: 65, sites: 3, keywords: 150, prompts: 30, audits: 8, desc: "More coverage as you grow." },
  { id: "agency", name: "Agency", price: 199, annual: 165, sites: 10, keywords: 500, prompts: 100, audits: 30, desc: "A workspace for your clients." },
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
    };
  } catch {
    return empty();
  }
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
  return state;
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
  const offer = answers.businessType || "";
  const market = answers.market || "";
  const reach = answers.reach || "";
  return {
    business: [offer, market].filter(Boolean).join(" in ") || offer,
    services: offer,
    areas: [market, reach].filter(Boolean).join(" · "),
    locations: market,
    claims: "Only facts that are visible on the live page.",
    voice: answers.shortGoal || "specific, local, and concrete",
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
