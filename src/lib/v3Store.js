import { create } from "zustand";

const FEATURE_TTL_MS = 90_000;
const STATUS_TTL_MS = 120_000;

/**
 * Client cache for /app navigation — avoids refetching GSC/GA4/features on every nav click.
 * Invalidate after sync / disconnect / workspace reset / publish.
 */
export const useV3Store = create((set, get) => ({
  features: {}, // kind -> { at, res }
  google: null, // { at, res }
  cms: null, // { at, res }
  changes: null, // { at, res }
  profile: null, // { at, res }
  activeSiteId: null,
  inflight: {}, // key -> Promise

  getFeature(kind) {
    const hit = get().features[kind];
    if (hit && Date.now() - hit.at < FEATURE_TTL_MS) return hit.res;
    return null;
  },

  setFeature(kind, res) {
    set((s) => ({ features: { ...s.features, [kind]: { at: Date.now(), res } } }));
  },

  getGoogle() {
    const hit = get().google;
    if (hit && Date.now() - hit.at < STATUS_TTL_MS) return hit.res;
    return null;
  },

  setGoogle(res) {
    set({ google: { at: Date.now(), res } });
  },

  getCms() {
    const hit = get().cms;
    if (hit && Date.now() - hit.at < STATUS_TTL_MS) return hit.res;
    return null;
  },

  setCms(res) {
    set({ cms: { at: Date.now(), res } });
  },

  getChanges() {
    const hit = get().changes;
    if (hit && Date.now() - hit.at < FEATURE_TTL_MS) return hit.res;
    return null;
  },

  setChanges(res) {
    set({ changes: { at: Date.now(), res } });
  },

  getProfile() {
    const hit = get().profile;
    if (hit && Date.now() - hit.at < STATUS_TTL_MS) return hit.res;
    return null;
  },

  setProfile(res) {
    set({ profile: { at: Date.now(), res } });
  },

  setActiveSite(id) {
    const next = Number(id) || null;
    try {
      if (typeof window !== "undefined") {
        if (next) window.localStorage.setItem("sf_active_site", String(next));
        else window.localStorage.removeItem("sf_active_site");
      }
    } catch {
      /* ignore */
    }
    set({ activeSiteId: next });
  },

  beginInflight(key, promise) {
    set((s) => ({ inflight: { ...s.inflight, [key]: promise } }));
  },

  endInflight(key) {
    set((s) => {
      const next = { ...s.inflight };
      delete next[key];
      return { inflight: next };
    });
  },

  getInflight(key) {
    return get().inflight[key] || null;
  },

  invalidate(keys = "all") {
    if (keys === "all") {
      set({ features: {}, google: null, cms: null, changes: null, profile: null, inflight: {} });
      return;
    }
    const list = Array.isArray(keys) ? keys : [keys];
    set((s) => {
      const features = { ...s.features };
      let google = s.google;
      let cms = s.cms;
      let changes = s.changes;
      let profile = s.profile;
      for (const k of list) {
        if (k === "google") google = null;
        else if (k === "cms") cms = null;
        else if (k === "changes") changes = null;
        else if (k === "profile") profile = null;
        else delete features[k];
      }
      return { features, google, cms, changes, profile };
    });
  },
}));

export function invalidateV3Cache(keys = "all") {
  useV3Store.getState().invalidate(keys);
}

/** Warm common routes so first click feels instant. */
export const HOT_FEATURES = [
  "organic-search",
  "traffic-analytics",
  "top-pages",
  "site-audit",
  "local-seo",
  "keyword-research",
  "google-ads",
];
