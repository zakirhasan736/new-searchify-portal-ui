import { briefFromAnswers } from "@/lib/businessBrief";
import { activeJourneySite, loadJourney, planById, readySites, websiteLabel } from "@/lib/journey";
import { effectiveSiteKey, siteForScope } from "@/lib/siteScope";

const DECISIONS = "sf_preview_decisions_v1";
const ACTIVITY = "sf_activity_v1";
const SESSION_ACTIVITY = "sf_preview_activity_v1";

export function sampleCards(site) {
  const brief = briefFromAnswers(site?.answers || {});
  const host = brief.hostname || site?.label || "Your website";
  const offer = brief.businessType || "your offer";
  const market = brief.market || "your market";
  const page = brief.siteUrl || "/";
  const titleAfter = brief.market ? `${offer} in ${market} | ${host}` : `${offer} | ${host}`;
  const summary = brief.goal
    ? `${offer} for customers in ${market}. ${brief.goal}`
    : `${offer} for customers in ${market}. Review the page details before publishing.`;
  return [
    {
      key: "title",
      kind: "TITLE + SEARCH INTENT",
      title: brief.market ? `Name ${market} in the page title` : "Review the page title against your offer",
      url: page,
      before: `${offer} | ${host}`,
      after: titleAfter,
      sources: ["Your setup · what you sell", brief.market ? `Market you named: ${market}` : "Market: not set yet"],
    },
    {
      key: "meta",
      kind: "META DESCRIPTION",
      title: brief.market ? `Describe ${offer} for ${market}` : "Make the page summary match the business you described",
      url: page,
      before: "Learn more about our services.",
      after: summary,
      sources: ["Your setup · market", brief.goal ? `90-day aim: ${brief.goal}` : "90-day aim: not set yet"],
    },
    {
      key: "focus",
      kind: "KEYWORD FOCUS",
      title: "Confirm the page for this search topic",
      url: `${offer} in ${market}`,
      before: "No target page confirmed",
      after: brief.avoid
        ? `Keep “${brief.avoid}” out of suggestions. Map “${offer} in ${market}” before a rewrite.`
        : `Review which page should represent “${offer} in ${market}” before a rewrite.`,
      sources: [
        "Your setup brief",
        brief.sensitive ? `Extra care: ${brief.sensitive}` : "No special category selected",
      ],
    },
  ];
}

function readStore(storage, key) {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(storage.getItem(key) || "");
  } catch {
    return null;
  }
}

function read(key) {
  return readStore(window.sessionStorage, key);
}

function isRealAction(item) {
  if (!item || typeof item.title !== "string") return false;
  if (item.title === "Sample audit completed" || item.title === "Questionnaire skipped") return false;
  if (/example pages|sample workspace/i.test(item.detail || "")) return false;
  return true;
}

function decisionBag() {
  const saved = read(DECISIONS);
  if (!saved || typeof saved !== "object") return {};
  if (saved.bySite && typeof saved.bySite === "object") return saved.bySite;
  if (saved.title || saved.meta || saved.focus) {
    const id = activeJourneySite()?.id;
    return id ? { [id]: { title: saved.title, meta: saved.meta, focus: saved.focus } } : {};
  }
  return {};
}

export function loadDecisions(siteId) {
  const id = siteId || activeJourneySite()?.id;
  if (!id) return {};
  return decisionBag()[id] || {};
}

export function loadActivity() {
  const local = readStore(window.localStorage, ACTIVITY);
  const session = read(SESSION_ACTIVITY);
  const merged = [...(Array.isArray(local) ? local : []), ...(Array.isArray(session) ? session : [])];
  const seen = new Set();
  return merged.filter(isRealAction).filter((item) => {
    const key = `${item.siteKey || ""}|${item.title}|${item.detail}|${item.time}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function recordActivity(entry) {
  const activity = [{
    title: entry.title,
    detail: entry.detail,
    time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    siteKey: entry.siteKey || "",
  }, ...loadActivity()].slice(0, 40);
  window.localStorage.setItem(ACTIVITY, JSON.stringify(activity));
  window.dispatchEvent(new CustomEvent("sf-preview-queue"));
  return activity;
}

function clock(value) {
  const time = Number(value);
  if (!time) return "";
  return new Date(time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function completionEntries(scope = "") {
  const state = loadJourney();
  const selected = scope ? siteForScope(scope) : null;
  const selectedKey = scope ? effectiveSiteKey(scope, selected) : "";
  const globalKey = activeJourneySite(state)?.id ? `journey:${activeJourneySite(state).id}` : "";
  const actions = loadActivity().filter((item) => {
    if (!scope) return true;
    if (!item.siteKey) return selectedKey === globalKey;
    return item.siteKey === selectedKey;
  });
  const facts = [];
  const plan = planById(state.planId);
  if (plan) {
    facts.push({ title: "Plan selected", detail: `${plan.name} is the active plan.`, time: "" });
  }
  const all = readySites(state);
  const listed = selected ? all.filter((site) => site.id === selected.id) : all;
  listed.forEach((site) => {
    const index = all.findIndex((item) => item.id === site.id);
    const brief = briefFromAnswers(site?.answers);
    const named = websiteLabel(site);
    const name = brief.hostname || (named === "Website" ? `Website ${index + 1}` : named);
    const time = clock(site?.createdAt);
    if (brief.ready) {
      facts.push({
        title: "Setup completed",
        detail: [name, brief.focus, brief.goal].filter(Boolean).join(" · "),
        time,
      });
    } else {
      facts.push({
        title: "Questionnaire skipped",
        detail: `${name} is in the workspace without business answers. Add the website, offer, and market any time.`,
        time,
      });
    }
  });
  return [...actions, ...facts];
}

export function pendingPreviewCount() {
  const decisions = loadDecisions();
  return ["title", "meta", "focus"].filter((key) => !decisions[key]).length;
}

export function savePreviewDecision(card, decision, siteId) {
  const id = siteId || activeJourneySite()?.id || "workspace";
  const bySite = { ...decisionBag(), [id]: { ...loadDecisions(id), [card.key]: decision } };
  window.sessionStorage.setItem(DECISIONS, JSON.stringify({ bySite }));
  recordActivity({
    title: decision === "approved" ? "Draft approved" : "Suggestion dismissed",
    detail: card.title,
    siteKey: `journey:${id}`,
  });
  return bySite[id];
}
