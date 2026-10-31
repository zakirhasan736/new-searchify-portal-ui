import { authHeaders } from "@/utils/users/Helpers";
import { HOT_FEATURES, invalidateV3Cache, useV3Store } from "@/lib/v3Store";
import { briefFromAnswers } from "@/lib/businessBrief";
import { activeJourneySite } from "@/lib/journey";
import { activeSiteContext } from "@/lib/siteContext";

function activeHost() {
  if (typeof window === "undefined") return "";
  const host = activeSiteContext().hostname || "";
  return host && host !== "your-site" ? host : "";
}

function withSite(path) {
  const host = activeHost();
  if (!host) return path;
  const join = path.includes("?") ? "&" : "?";
  return `${path}${join}site=${encodeURIComponent(host)}`;
}

async function json(res) {
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/** Plain message from an API error. `detail` may be a string or {code, message}. */
export function errorText(res, fallback = "Something went wrong.") {
  const detail = res?.data?.detail;
  if (typeof detail === "string" && detail) return detail;
  if (detail && typeof detail.message === "string") return detail.message;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  if (typeof res?.data?.message === "string" && res.data.message) return res.data.message;
  return fallback;
}

export function errorCode(res) {
  const detail = res?.data?.detail;
  return detail && typeof detail === "object" && !Array.isArray(detail) ? detail.code || "" : "";
}

async function cachedFetch(key, runner, { force = false, getter, setter } = {}) {
  const store = useV3Store.getState();
  if (!force) {
    const hit = getter?.(store);
    if (hit) return hit;
    const pending = store.getInflight(key);
    if (pending) return pending;
  }
  const promise = (async () => {
    try {
      const res = await runner();
      setter?.(useV3Store.getState(), res);
      return res;
    } finally {
      useV3Store.getState().endInflight(key);
    }
  })();
  store.beginInflight(key, promise);
  return promise;
}

export async function getGoogleStatus({ force = false } = {}) {
  const host = activeHost();
  return cachedFetch(
    host ? `google:${host}` : "google",
    async () => json(await fetch(withSite("/api/v1/oauth/google/status"), { headers: authHeaders() })),
    {
      force,
      getter: (s) => s.getGoogle(host),
      setter: (s, res) => s.setGoogle(res, host),
    },
  );
}

export async function startGoogleOAuth(services = "gsc,ga4,ads", options = {}) {
  const value =
    typeof services === "string" && services && !services.includes("[object")
      ? services
      : "gsc,ga4,ads";
  const qs = new URLSearchParams({ services: value });
  if (options.add) qs.set("add", "1");
  const res = await json(await fetch(`/api/v1/oauth/google/start?${qs}`, { headers: authHeaders() }));
  if (res.ok && res.data && !res.data.url && res.data.authUrl) {
    return { ...res, data: { ...res.data, url: res.data.authUrl } };
  }
  return res;
}

export async function listGoogleSites(site = "") {
  const qs = site ? `?site=${encodeURIComponent(site)}` : "";
  return json(await fetch(`/api/v1/oauth/google/sites${qs}`, { headers: authHeaders(), cache: "no-store" }));
}

export async function selectGoogleProperties(body) {
  const res = await json(
    await fetch("/api/v1/oauth/google/select", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
  if (res.ok) invalidateV3Cache(["google"]);
  return res;
}

export async function listAdsAccounts(cmsConnectionId = null) {
  const qs = cmsConnectionId ? `?cms_connection_id=${cmsConnectionId}` : "";
  return json(await fetch(`/api/v1/oauth/google/ads/accounts${qs}`, { headers: authHeaders() }));
}

export async function selectAdsAccount(body) {
  const res = await json(
    await fetch("/api/v1/oauth/google/ads/select", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
  if (res.ok) invalidateV3Cache(["google", "google-ads", "paid-search"]);
  return res;
}

export async function syncAds(cmsConnectionId = null) {
  const res = await json(
    await fetch("/api/v1/oauth/google/ads/sync", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(cmsConnectionId ? { cms_connection_id: cmsConnectionId } : {}),
    }),
  );
  if (res.ok) invalidateV3Cache(["google", "google-ads", "paid-search"]);
  return res;
}

export async function disconnectAds(cmsConnectionId = null) {
  const res = await json(
    await fetch("/api/v1/oauth/google/ads/disconnect", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(cmsConnectionId ? { cms_connection_id: cmsConnectionId } : {}),
    }),
  );
  if (res.ok) invalidateV3Cache(["google", "google-ads", "paid-search"]);
  return res;
}

export async function useGoogleAccount(email) {
  const res = await json(
    await fetch("/api/v1/oauth/google/accounts/use", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ email }),
    }),
  );
  if (res.ok) invalidateV3Cache(["google"]);
  return res;
}

export async function removeGoogleAccount(email) {
  const res = await json(
    await fetch("/api/v1/oauth/google/accounts/remove", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ email }),
    }),
  );
  if (res.ok) invalidateV3Cache(["google"]);
  return res;
}

export async function disconnectGoogle() {
  const res = await json(
    await fetch("/api/v1/oauth/google/disconnect", {
      method: "POST",
      headers: authHeaders(),
      body: "{}",
    }),
  );
  invalidateV3Cache("all");
  return res;
}

/** Force-clear Google + WordPress + work queue + cached live metrics (fresh start). */
export async function resetWorkspace() {
  const res = await json(await fetch("/api/v1/operator/workspace/reset", { method: "POST", headers: authHeaders() }));
  invalidateV3Cache("all");
  return res;
}

export async function enrichGoogle() {
  return json(await fetch("/api/v1/oauth/google/enrich", { method: "POST", headers: authHeaders() }));
}

export async function activateGoogleSite(site) {
  const address = site || activeSiteContext().href || "";
  if (!address) return { ok: false, data: {} };
  return json(
    await fetch("/api/v1/oauth/google/activate-site", {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ site: address }),
    }),
  );
}

export async function syncGoogle(cmsConnectionId = null) {
  const body = {};
  if (cmsConnectionId) body.cms_connection_id = cmsConnectionId;
  const host = activeHost();
  if (host) body.site = host;
  return json(
    await fetch("/api/v1/oauth/google/sync", {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export async function syncGoogleLive(cmsConnectionId = null) {
  const sync = await syncGoogle(cmsConnectionId);
  if (!sync.ok) return sync;
  const enrich = await enrichGoogle();
  const queue = await proposeFromGsc();
  invalidateV3Cache("all");
  const queueError = !queue.ok
    ? typeof queue.data?.detail === "string"
      ? queue.data.detail
      : "Could not open review opportunities from Search Console."
    : "";
  return {
    ok: true,
    status: 200,
    data: {
      ...(sync.data || {}),
      enriched: enrich.ok ? enrich.data?.enriched || enrich.data : { error: enrich.data?.detail || "enrich skipped" },
      queue: queue.ok ? queue.data : null,
      queueError,
    },
  };
}

/** Google's own view of important URLs (URL Inspection): indexed or not and why, canonical, schema errors. */
export async function inspectGoogleIndex({ urls = [], limit = 20, cmsConnectionId = null } = {}) {
  const body = { urls, limit };
  if (cmsConnectionId) body.cms_connection_id = cmsConnectionId;
  const res = await json(
    await fetch("/api/v1/oauth/google/inspect", {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  if (res.ok) invalidateV3Cache(["gsc-index-inspection"]);
  return res;
}

export async function runPageSpeed(url = "") {
  const res = await json(
    await fetch("/api/v1/oauth/google/pagespeed", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ url, strategy: "mobile" }),
    }),
  );
  if (res.ok) invalidateV3Cache(["site-audit", "organic-search"]);
  return res;
}

export async function syncPlaces(query = "") {
  const res = await json(
    await fetch("/api/v1/oauth/google/places", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(query ? { query } : {}),
    }),
  );
  if (res.ok) invalidateV3Cache(["local-seo", "local-listings"]);
  return res;
}

export function setActiveSite(id) {
  useV3Store.getState().setActiveSite(id);
}

export function getActiveSite() {
  if (typeof window !== "undefined" && !useV3Store.getState().activeSiteId) {
    const saved = Number(window.localStorage.getItem("sf_active_site") || 0) || null;
    if (saved) useV3Store.getState().setActiveSite(saved);
  }
  return useV3Store.getState().activeSiteId;
}

export async function setWorkspacePlan(body) {
  const res = await json(
    await fetch("/api/v1/operator/workspace/plan", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
  if (res.ok) invalidateV3Cache(["cms"]);
  return res;
}

export async function listCmsConnections({ force = false } = {}) {
  return cachedFetch(
    "cms",
    async () => json(await fetch("/api/v1/operator/connections", { headers: authHeaders() })),
    {
      force,
      getter: (s) => s.getCms(),
      setter: (s, res) => s.setCms(res),
    },
  );
}

export async function saveCmsConnection(body) {
  const res = await json(
    await fetch("/api/v1/operator/connections", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
  if (res.ok) invalidateV3Cache(["cms"]);
  return res;
}

export async function forgetWebsite(site) {
  const res = await json(
    await fetch("/api/v1/operator/sites/forget", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ site }),
    }),
  );
  if (res.ok) invalidateV3Cache("all");
  return res;
}

export async function deleteCmsConnection(id) {
  const res = await json(
    await fetch(`/api/v1/operator/connections/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
      body: "{}",
    }),
  );
  if (res.ok) invalidateV3Cache(["cms", "google", "changes"]);
  return res;
}

export async function listChanges({ force = false, all = false } = {}) {
  if (all) {
    return json(await fetch("/api/v1/operator/changes", { headers: authHeaders() }));
  }
  const host = activeHost();
  return cachedFetch(
    host ? `changes:${host}` : "changes",
    async () => json(await fetch(withSite("/api/v1/operator/changes"), { headers: authHeaders() })),
    {
      force,
      getter: (s) => s.getChanges(host),
      setter: (s, res) => s.setChanges(res, host),
    },
  );
}

export async function pushPublicKey() {
  return json(await fetch("/api/v1/push/public-key", { headers: authHeaders() }));
}

export async function pushSubscribe(subscription) {
  return json(await fetch("/api/v1/push/subscribe", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  }));
}

export async function pushWeekly() {
  return json(await fetch("/api/v1/push/weekly", { method: "POST", headers: authHeaders() }));
}

export async function askAssistant(body) {
  return json(
    await fetch("/api/v1/operator/assistant", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function prepareWeightFix(body) {
  return json(await fetch("/api/v1/operator/changes/from-weight", {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));
}

export async function createChange(body) {
  const res = await json(await fetch("/api/v1/operator/changes", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  }));
  if (res.ok) invalidateV3Cache(["changes"]);
  return res;
}

export function scanBrief(site = activeJourneySite()) {
  const answers = site?.answers || {};
  const brief = briefFromAnswers(answers);
  return {
    site: brief.siteUrl,
    brief: {
      businessType: brief.businessType,
      market: brief.market,
      reach: brief.reach,
      goal: brief.goal,
      avoid: brief.avoid,
      sensitive: brief.sensitive,
      competitors: String(answers.competitors || ""),
    },
  };
}

export async function proposeFromGsc({ breadth = "balanced", site = null, limit = 8, rescan = false } = {}) {
  const scope = typeof window === "undefined" ? { site: "", brief: {} } : scanBrief(site || undefined);
  const res = await json(await fetch("/api/v1/operator/changes/from-gsc", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ breadth, limit, rescan, ...scope }),
  }));
  if (res.ok) invalidateV3Cache(["changes"]);
  return res;
}

export async function previewSiteScan(site) {
  return json(
    await fetch("/api/v1/public/site-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site }),
    }),
  );
}

export async function runSiteScan({ site = null, force = false } = {}) {
  return json(await fetch("/api/v1/operator/site-scan", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ force, ...scanBrief(site || undefined) }),
  }));
}

export async function researchStatus() {
  return json(await fetch("/api/v1/research/status", { headers: authHeaders() }));
}

async function research(kind, body) {
  return json(await fetch(`/api/v1/research/${kind}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  }));
}

export function researchKeywords({ site, terms = [], country = "", reach = "", force = false, storedOnly = false }) {
  return research("keywords", { site, terms, country, reach, force, stored_only: storedOnly });
}

export function researchBacklinks({ site, force = false, storedOnly = false }) {
  return research("backlinks", { site, force, stored_only: storedOnly });
}

export function researchAudit({ site, force = false }) {
  return research("audit", { site, force });
}

export function researchVisibility({ site, brand = "", country = "", reach = "", prompts = [], force = false }) {
  return research("visibility", { site, brand, country, reach, prompts, force });
}

export async function getMarket({ site = "", siteId = "" } = {}) {
  const params = new URLSearchParams();
  if (site) params.set("site", site);
  if (siteId != null && siteId !== "") params.set("siteId", String(siteId));
  const qs = params.toString();
  return json(await fetch(`/api/v1/operator/market${qs ? `?${qs}` : ""}`, { headers: authHeaders(), cache: "no-store" }));
}

export async function saveMarket({ site = "", siteId = null, countryIso = "", language = "", city = "", region = "", serviceArea = "" } = {}) {
  return json(await fetch("/api/v1/operator/market", {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ site, siteId, countryIso, language, city, region, serviceArea }),
  }));
}

export async function getJourney() {
  return json(await fetch("/api/v1/operator/journey", { headers: authHeaders(), cache: "no-store" }));
}

export async function putJourney(state) {
  return json(await fetch("/api/v1/operator/journey", {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ state }),
  }));
}

export async function getSiteScan(siteUrl = "") {
  const query = siteUrl ? `?site=${encodeURIComponent(siteUrl)}` : "";
  return json(await fetch(`/api/v1/operator/site-scan${query}`, { headers: authHeaders() }));
}

export async function getAiVisibility({ force = false } = {}) {
  return cachedFetch(
    "ai-visibility-report",
    async () => json(await fetch("/api/v1/operator/ai-visibility", { headers: authHeaders() })),
    {
      force,
      getter: (s) => s.getFeature("ai-visibility-report"),
      setter: (s, res) => s.setFeature("ai-visibility-report", res),
    },
  );
}

export async function runAiVisibility() {
  const res = await json(await fetch("/api/v1/operator/ai-visibility", { method: "POST", headers: authHeaders() }));
  if (res.ok) invalidateV3Cache(["ai-visibility", "ai-visibility-report"]);
  return res;
}

/** Re-run AI crawler (robots.txt per bot, firewall), llms.txt and indexing checks. */
export async function recheckAiReadiness() {
  const res = await json(await fetch("/api/v1/operator/ai-visibility/readiness", { method: "POST", headers: authHeaders() }));
  if (res.ok) invalidateV3Cache(["ai-visibility-report"]);
  return res;
}

export async function queueAiVisibilityFix(body) {
  const res = await json(
    await fetch("/api/v1/operator/ai-visibility/queue", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
  if (res.ok) invalidateV3Cache(["changes"]);
  return res;
}

export async function patchChange(id, body) {
  const res = await json(
    await fetch(`/api/v1/operator/changes/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
  if (res.ok) invalidateV3Cache(["changes"]);
  return res;
}

export async function dismissChange(id) {
  const res = await json(await fetch(`/api/v1/operator/changes/${id}/dismiss`, { method: "POST", headers: authHeaders() }));
  if (res.ok) invalidateV3Cache(["changes"]);
  return res;
}

export async function approveChange(id) {
  const res = await json(await fetch(`/api/v1/operator/changes/${id}/approve`, { method: "POST", headers: authHeaders() }));
  invalidateV3Cache(["changes"]);
  return res;
}

export async function executeChange(id, { forceDryRun = false, includeOpenGraph = false, includeJsonLd = false } = {}) {
  const res = await json(
    await fetch(`/api/v1/operator/changes/${id}/execute`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        force_dry_run: forceDryRun,
        include_open_graph: Boolean(includeOpenGraph),
        include_json_ld: Boolean(includeJsonLd),
      }),
    }),
  );
  invalidateV3Cache(["changes"]);
  return res;
}

export async function undoChange(id) {
  const res = await json(await fetch(`/api/v1/operator/changes/${id}/undo`, { method: "POST", headers: authHeaders() }));
  if (res.ok) invalidateV3Cache(["changes"]);
  return res;
}

export async function monitorChange(id) {
  return json(await fetch(`/api/v1/operator/changes/${id}/monitor`, { method: "POST", headers: authHeaders() }));
}

export async function generateMeta(id) {
  const res = await json(await fetch(`/api/v1/operator/changes/${id}/generate-meta`, { method: "POST", headers: authHeaders() }));
  if (res.ok) invalidateV3Cache(["changes"]);
  return res;
}

export async function generateMetaCopy(
  id,
  {
    tone = "",
    breadth = "balanced",
    objective = "balanced",
    focusTopic = "",
    audience = "",
    primaryKeyword = "",
    extraInstructions = "",
  } = {},
) {
  // Backend scrapes the live page, then OpenAI drafts title, description, Open Graph, and JSON-LD together.
  const res = await json(
    await fetch(`/api/v1/operator/changes/${id}/generate-meta`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        tone,
        breadth,
        objective,
        focusTopic,
        audience,
        primaryKeyword,
        extraInstructions,
      }),
    }),
  );
  if (res.ok) invalidateV3Cache(["changes"]);
  return res;
}

export async function getBusinessProfile({ force = false } = {}) {
  return cachedFetch(
    "profile",
    async () => json(await fetch("/api/v1/operator/business-profile", { headers: authHeaders() })),
    {
      force,
      getter: (s) => s.getProfile(),
      setter: (s, res) => s.setProfile(res),
    },
  );
}

export async function saveBusinessProfile(profile) {
  const res = await json(
    await fetch("/api/v1/operator/business-profile", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(profile),
    }),
  );
  if (res.ok) invalidateV3Cache(["profile"]);
  return res;
}

export function isLivePayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  const seed = String(payload.seedVersion || "");
  const source = String(payload.source || "");
  return seed === "google-live-v1" || source.startsWith("google") || source === "searchify_operator";
}

function liveOnly(record) {
  const payload = record?.payload || record;
  if (!isLivePayload(payload)) {
    return { ...(record || {}), payload: { rows: [], kpis: [], live: false } };
  }
  return record;
}

function normalizeFeatureRes(res) {
  if (res.ok && res.data) {
    if (res.data.payload) return { ...res, data: liveOnly(res.data) };
    if (Array.isArray(res.data) && res.data[0]?.payload) {
      const live = res.data.find((row) => isLivePayload(row.payload)) || null;
      return { ...res, data: liveOnly(live || { payload: {} }) };
    }
    if (res.data.records?.[0]?.payload) {
      const live = res.data.records.find((row) => isLivePayload(row.payload)) || null;
      return { ...res, data: liveOnly(live || { payload: {} }) };
    }
  }
  return res;
}

/**
 * Load a feature kind. Uses Zustand TTL cache (~90s) unless force=true.
 * Deduplicates concurrent requests for the same kind.
 */
export async function loadFeature(kind, { force = false } = {}) {
  const host = activeHost();
  const cacheKey = host ? `feature:${kind}:${host}` : `feature:${kind}`;
  return cachedFetch(
    cacheKey,
    async () => {
      const res = await json(
        await fetch(withSite(`/api/v1/features/${kind}`), {
          headers: authHeaders(),
        }),
      );
      return normalizeFeatureRes(res);
    },
    {
      force,
      getter: (s) => s.getFeature(cacheKey),
      setter: (s, res) => s.setFeature(cacheKey, res),
    },
  );
}

export async function loadWorkspace() {
  const res = await json(await fetch(withSite("/api/v1/operator/workspace"), { headers: authHeaders() }));
  if (res.ok && res.data) {
    const store = useV3Store.getState();
    const host = activeHost();
    if (res.data.google) store.setGoogle({ ok: true, status: 200, data: res.data.google }, host);
    if (res.data.cms) store.setCms({ ok: true, status: 200, data: res.data.cms });
    if (res.data.changes) store.setChanges({ ok: true, status: 200, data: res.data.changes }, host);
    Object.entries(res.data.features || {}).forEach(([kind, feat]) => {
      if (!isLivePayload(feat?.payload || feat)) return;
      const key = host ? `feature:${kind}:${host}` : kind;
      store.setFeature(key, { ok: true, status: 200, data: feat });
    });
  }
  return res;
}

/** Prefetch via one bootstrap call so nav stays instant. */
export function prefetchHotData() {
  if (typeof window === "undefined") return;
  const run = () => {
    loadWorkspace().catch(() => {
      getGoogleStatus().catch(() => {});
      listChanges().catch(() => {});
      listCmsConnections().catch(() => {});
      HOT_FEATURES.forEach((kind) => {
        loadFeature(kind).catch(() => {});
      });
    });
  };
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 1200 });
  } else {
    setTimeout(run, 80);
  }
}

export function featurePayload(res) {
  return res?.data?.payload || res?.data || {};
}

function rowMatch(row, needle) {
  return String(row?.[0] || "").toLowerCase().includes(String(needle || "").toLowerCase());
}

function firstRowValue(rows, needle) {
  const row = (rows || []).find((item) => rowMatch(item, needle));
  if (!row) return null;
  const value = row[1];
  if (value == null || value === "") return null;
  return String(value);
}

/** Read a KPI / vital from PageSpeed site-audit payloads (kpis, panels.audit, vitals, scores, tables). */
export function featureKpi(payload, labelPart, fallback = "—") {
  if (!payload || typeof payload !== "object") return fallback;
  const needle = String(labelPart || "").toLowerCase();
  if (!needle) return fallback;

  const fromKpis = firstRowValue(payload.kpis, needle);
  if (fromKpis != null && fromKpis !== "—") return fromKpis;

  const fromPanelKpis = firstRowValue(payload.panels?.kpis, needle);
  if (fromPanelKpis != null && fromPanelKpis !== "—") return fromPanelKpis;

  const fromAudit = firstRowValue(payload.panels?.audit, needle);
  if (fromAudit != null && fromAudit !== "—") return fromAudit;

  const fromOverview = firstRowValue(payload.rows, needle);
  if (fromOverview != null && fromOverview !== "—") return fromOverview;

  const vitalKey = needle.includes("lcp")
    ? "LCP"
    : needle.includes("cls")
      ? "CLS"
      : needle.includes("inp") || needle.includes("fid") || needle.includes("interaction")
        ? "INP"
        : needle.includes("fcp")
          ? "FCP"
          : needle.includes("tbt") || needle.includes("blocking")
            ? "TBT"
            : needle.includes("speed index") || needle === "si"
              ? "SI"
              : needle.includes("tti") || needle.includes("interactive")
                ? "TTI"
                : needle.includes("ttfb")
                  ? "TTFB"
                  : "";

  if (vitalKey) {
    const mobile = payload.vitals?.mobile || payload.vitals || {};
    const vital = mobile[vitalKey] ?? payload.vitals?.desktop?.[vitalKey];
    if (vital != null && vital !== "" && vital !== "—") return String(vital);

    for (const panel of payload.tablePanels || []) {
      const title = String(panel?.title || "").toLowerCase();
      if (!title.includes("vital") && !title.includes("chrome ux") && !title.includes("crux")) continue;
      const hit = firstRowValue(panel.rows, vitalKey);
      if (hit != null && hit !== "—") return hit;
      // CrUX rows look like "LCP (field)"
      const field = firstRowValue(panel.rows, `${vitalKey} (field)`);
      if (field != null && field !== "—") return field;
    }
  }

  if (needle.includes("performance") || needle === "perf") {
    const score =
      payload.scores?.mobile?.performance ??
      payload.scores?.performance ??
      firstRowValue(payload.kpis, "mobile perf") ??
      firstRowValue(payload.panels?.kpis, "perf");
    if (score != null && score !== "" && score !== "—") return String(score);
  }

  if (needle === "seo" || needle.includes("seo score")) {
    const score =
      payload.scores?.mobile?.seo ??
      payload.scores?.seo ??
      firstRowValue(payload.kpis, "seo") ??
      firstRowValue(payload.panels?.kpis, "seo");
    if (score != null && score !== "" && score !== "—") return String(score);
  }

  return fallback;
}

/** Convenience: Core Web Vitals from a site-audit / PageSpeed payload. */
export function featureVitals(payload = {}) {
  return {
    lcp: featureKpi(payload, "lcp"),
    cls: featureKpi(payload, "cls"),
    inp: featureKpi(payload, "inp"),
    fcp: featureKpi(payload, "fcp"),
    performance: featureKpi(payload, "performance"),
    seo: featureKpi(payload, "seo"),
    psiFails: Number(payload?.counts?.seoFails || 0) + Number(payload?.counts?.a11yFails || 0) + Number(payload?.counts?.bestPracticeFails || 0),
  };
}

export function queueItems(changes = []) {
  return (changes || []).filter((c) => ["proposed", "awaiting_approval", "approved", "failed", "needs_review"].includes(c.status));
}

export function historyItems(changes = []) {
  return (changes || []).filter(
    (c) => ["applied", "monitoring", "closed", "published_unverified", "undone"].includes(c.status) || c.appliedAt,
  );
}

export function changeTitle(c) {
  return c?.proposed?.title || c?.opportunity || "Untitled update";
}

export function changeDesc(c) {
  return c?.proposed?.metaDescription || "";
}

export async function getProductWorkspace({ force = false } = {}) {
  return cachedFetch(
    "product-workspace",
    async () => json(await fetch("/api/v1/product/workspace", { headers: authHeaders() })),
    { force, getter: () => null },
  );
}

export async function saveAgencyClient(body, id = null) {
  const res = await json(
    await fetch(id ? `/api/v1/product/clients/${id}` : "/api/v1/product/clients", {
      method: id ? "PATCH" : "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
  if (res.ok) invalidateV3Cache(["product-workspace"]);
  return res;
}

export async function deleteAgencyClient(id) {
  const res = await json(await fetch(`/api/v1/product/clients/${id}`, { method: "DELETE", headers: authHeaders() }));
  if (res.ok) invalidateV3Cache(["product-workspace"]);
  return res;
}

export async function inviteWorkspaceMember(body) {
  const res = await json(
    await fetch("/api/v1/product/members", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
  if (res.ok) invalidateV3Cache(["product-workspace"]);
  return res;
}

export async function patchWorkspaceMember(id, body) {
  const res = await json(
    await fetch(`/api/v1/product/members/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
  if (res.ok) invalidateV3Cache(["product-workspace"]);
  return res;
}

export async function removeWorkspaceMember(id) {
  const res = await json(await fetch(`/api/v1/product/members/${id}`, { method: "DELETE", headers: authHeaders() }));
  if (res.ok) invalidateV3Cache(["product-workspace"]);
  return res;
}

export async function getProductUsage() {
  return json(await fetch("/api/v1/product/usage", { headers: authHeaders() }));
}

export async function saveUsageControls(body) {
  return json(
    await fetch("/api/v1/product/usage/controls", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function getOps() {
  return json(await fetch("/api/v1/product/ops", { headers: authHeaders() }));
}

export async function ackOpsNotice(id, status = "acked") {
  return json(
    await fetch(`/api/v1/product/ops/notices/${id}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    }),
  );
}

export async function retryOps() {
  return json(await fetch("/api/v1/product/ops/retry", { method: "POST", headers: authHeaders() }));
}

export async function createOpsBackup() {
  return json(await fetch("/api/v1/product/ops/backup", { method: "POST", headers: authHeaders() }));
}

export async function restoreOpsBackup() {
  return json(await fetch("/api/v1/product/ops/restore", { method: "POST", headers: authHeaders() }));
}

export async function saveReportDefinition(body, id = null) {
  return json(
    await fetch(id ? `/api/v1/product/reports/${id}` : "/api/v1/product/reports", {
      method: id ? "PATCH" : "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function deleteReportDefinition(id) {
  return json(await fetch(`/api/v1/product/reports/${id}`, { method: "DELETE", headers: authHeaders() }));
}

export async function runReportDefinition(id) {
  return json(await fetch(`/api/v1/product/reports/${id}/run`, { method: "POST", headers: authHeaders() }));
}

export function changePath(c) {
  try {
    if (!c?.targetUrl) return "—";
    const u = new URL(c.targetUrl);
    return u.pathname || "/";
  } catch {
    return c?.targetUrl || "—";
  }
}
