import { authHeaders } from "@/utils/users/Helpers";
import { HOT_FEATURES, invalidateV3Cache, useV3Store } from "@/lib/v3Store";
import { briefFromAnswers } from "@/lib/businessBrief";
import { activeJourneySite } from "@/lib/journey";

async function json(res) {
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
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
  return cachedFetch(
    "google",
    async () => json(await fetch("/api/v1/oauth/google/status", { headers: authHeaders() })),
    {
      force,
      getter: (s) => s.getGoogle(),
      setter: (s, res) => s.setGoogle(res),
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

export async function listGoogleSites() {
  return json(await fetch("/api/v1/oauth/google/sites", { headers: authHeaders() }));
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
  const res = await json(await fetch("/api/v1/oauth/google/disconnect", { method: "POST", headers: authHeaders() }));
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

export async function syncGoogle(cmsConnectionId = null) {
  return json(
    await fetch("/api/v1/oauth/google/sync", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(cmsConnectionId ? { cms_connection_id: cmsConnectionId } : {}),
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

export async function deleteCmsConnection(id) {
  const res = await json(await fetch(`/api/v1/operator/connections/${id}`, { method: "DELETE", headers: authHeaders() }));
  if (res.ok) invalidateV3Cache(["cms"]);
  return res;
}

export async function listChanges({ force = false } = {}) {
  return cachedFetch(
    "changes",
    async () => json(await fetch("/api/v1/operator/changes", { headers: authHeaders() })),
    {
      force,
      getter: (s) => s.getChanges(),
      setter: (s, res) => s.setChanges(res),
    },
  );
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

export function researchKeywords({ site, terms = [], country = "", force = false }) {
  return research("keywords", { site, terms, country, force });
}

export function researchBacklinks({ site, force = false }) {
  return research("backlinks", { site, force });
}

export function researchAudit({ site, force = false }) {
  return research("audit", { site, force });
}

export function researchVisibility({ site, brand = "", country = "", prompts = [], force = false }) {
  return research("visibility", { site, brand, country, prompts, force });
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
  if (res.ok) invalidateV3Cache(["changes"]);
  return res;
}

export async function executeChange(id, { forceDryRun = false } = {}) {
  const res = await json(
    await fetch(`/api/v1/operator/changes/${id}/execute`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ force_dry_run: forceDryRun }),
    }),
  );
  if (res.ok) invalidateV3Cache(["changes"]);
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

export async function generateMetaCopy(id, { tone = "", breadth = "balanced" } = {}) {
  const res = await json(
    await fetch(`/api/v1/operator/changes/${id}/generate-meta`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ tone, breadth }),
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
  return cachedFetch(
    `feature:${kind}`,
    async () => {
      const res = await json(
        await fetch(`/api/v1/features/${kind}`, {
          headers: authHeaders(),
          // Allow browser HTTP cache for repeat navigations; store handles freshness
        }),
      );
      return normalizeFeatureRes(res);
    },
    {
      force,
      getter: (s) => s.getFeature(kind),
      setter: (s, res) => s.setFeature(kind, res),
    },
  );
}

export async function loadWorkspace() {
  const res = await json(await fetch("/api/v1/operator/workspace", { headers: authHeaders() }));
  if (res.ok && res.data) {
    const store = useV3Store.getState();
    if (res.data.google) store.setGoogle({ ok: true, status: 200, data: res.data.google });
    if (res.data.cms) store.setCms({ ok: true, status: 200, data: res.data.cms });
    if (res.data.changes) store.setChanges({ ok: true, status: 200, data: res.data.changes });
    Object.entries(res.data.features || {}).forEach(([kind, feat]) => {
      if (!isLivePayload(feat?.payload || feat)) return;
      store.setFeature(kind, { ok: true, status: 200, data: feat });
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

export function featureKpi(payload, labelPart, fallback = "—") {
  const kpis = payload?.kpis || payload?.panels?.kpis || [];
  const row = kpis.find((k) => String(k[0] || "").toLowerCase().includes(String(labelPart).toLowerCase()));
  if (row) return String(row[1]);
  return fallback;
}

export function queueItems(changes = []) {
  return (changes || []).filter((c) => ["proposed", "awaiting_approval", "approved"].includes(c.status));
}

export function historyItems(changes = []) {
  return (changes || []).filter(
    (c) => ["applied", "monitoring", "closed", "failed", "undone"].includes(c.status) || c.appliedAt,
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
