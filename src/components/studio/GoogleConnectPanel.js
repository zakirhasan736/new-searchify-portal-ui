"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authHeaders } from "@/utils/users/Helpers";
import { enrichFromGoogle } from "@/lib/clientApi";

export default function GoogleConnectPanel({ compact = false }) {
  const params = useSearchParams();
  const [status, setStatus] = useState(null);
  const [sites, setSites] = useState({ gscSites: [], ga4Properties: [] });
  const [gsc, setGsc] = useState("");
  const [ga4, setGa4] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  const load = async () => {
    try {
      const response = await fetch("/api/v1/oauth/google/status", { headers: authHeaders() });
      if (!response.ok) {
        setStatus({ configured: false, connection: { connected: false, status: "sign_in_required" } });
        return;
      }
      const data = await response.json();
      setStatus(data);
      const conn = data.connection || {};
      setGsc(conn.gscSiteUrl || "");
      setGa4(conn.ga4PropertyId || "");
      if (conn.connected) {
        const sitesRes = await fetch("/api/v1/oauth/google/sites", { headers: authHeaders() });
        if (sitesRes.ok) {
          const siteData = await sitesRes.json();
          setSites(siteData);
        }
      }
    } catch {
      setMessage("Could not load Google connection status.");
    }
  };

  useEffect(() => {
    load();
    const flag = params?.get("google");
    if (flag === "connected") {
      setMessage(`Google connected${params.get("email") ? ` · ${params.get("email")}` : ""}. Pick site + GA4 property, then Sync.`);
    } else if (flag === "synced") {
      setMessage("Sync complete. Open Google Services hub, Organic Search, or Traffic Analytics.");
    } else if (flag === "error") {
      setMessage(`Google connect failed: ${params.get("detail") || "unknown"}`);
    }
  }, [params]);

  const connect = async () => {
    setBusy(true);
    setMessage("Opening Google…");
    const response = await fetch("/api/v1/oauth/google/start?services=gsc,ga4", { headers: authHeaders() });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !data.authUrl) {
      setMessage(data.detail || "Sign in to Searchify first, then connect Google.");
      return;
    }
    window.location.href = data.authUrl;
  };

  const saveSelection = async () => {
    setBusy(true);
    const ga4Name = (sites.ga4Properties || []).find((p) => p.propertyId === ga4)?.displayName || "";
    const response = await fetch("/api/v1/oauth/google/select", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        gsc_site_url: gsc,
        ga4_property_id: ga4,
        ga4_property_name: ga4Name,
      }),
    });
    setBusy(false);
    if (!response.ok) {
      setMessage("Could not save property selection.");
      return;
    }
    setMessage("Selection saved. Click Sync data.");
    load();
  };

  const sync = async () => {
    setBusy(true);
    setMessage("Syncing GSC + GA4 + PageSpeed + Places…");
    const response = await fetch("/api/v1/oauth/google/sync", {
      method: "POST",
      headers: authHeaders(),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage(data.detail || "Sync failed.");
      return;
    }
    setLastSynced(data.synced || null);
    const s = data.synced || {};
    const e = data.enriched || {};
    const enrichBits = [
      e.topics && "topics",
      e.keywords && "keywords",
      e.prompts && "prompts",
      e.narratives && "narratives",
    ].filter(Boolean);
    setMessage(
      `Synced · GSC: ${s.gsc ? "yes" : "no"} · GA4: ${s.ga4 ? "yes" : "no"} · PageSpeed: ${s.pagespeed ? "yes" : "no"} · Places: ${s.places ? "yes" : "no"}` +
        (enrichBits.length ? ` · AI layers: ${enrichBits.join(", ")}` : e.note ? ` · Enrich: ${e.note}` : ""),
    );
    load();
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        window.location.assign("/market/google-services?google=synced");
      }, 700);
    }
  };

  const enrich = async () => {
    setBusy(true);
    setMessage("Building topics / keywords / prompts / narratives from GSC…");
    const response = await enrichFromGoogle();
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage(data.detail || "Enrich failed.");
      return;
    }
    const e = data.enriched || {};
    setMessage(
      e.note
        ? e.note
        : `AI layers · topics:${e.topics ? "✓" : "—"} keywords:${e.keywords ? "✓" : "—"} prompts:${e.prompts ? "✓" : "—"} narratives:${e.narratives ? "✓" : "—"}`,
    );
  };

  const runPageSpeed = async () => {
    setBusy(true);
    setMessage("Running PageSpeed…");
    const response = await fetch("/api/v1/oauth/google/pagespeed", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ strategy: "mobile" }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage(data.detail || "PageSpeed failed.");
      return;
    }
    setMessage(`PageSpeed saved · perf ${data.result?.scores?.performance || "—"}`);
  };

  const runPlaces = async () => {
    setBusy(true);
    setMessage("Searching Places…");
    const response = await fetch("/api/v1/oauth/google/places", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage(data.detail || "Places failed.");
      return;
    }
    setMessage(`Places saved · ${data.count || 0} results for “${data.query || ""}”`);
  };

  const disconnect = async () => {
    setBusy(true);
    await fetch("/api/v1/oauth/google/disconnect", { method: "POST", headers: authHeaders() });
    setBusy(false);
    setMessage("Disconnected Google.");
    setSites({ gscSites: [], ga4Properties: [] });
    setLastSynced(null);
    load();
  };

  const conn = status?.connection || {};
  const connected = Boolean(conn.connected);
  const chips = [
    ["GSC", conn.gscSiteUrl || lastSynced?.gsc],
    ["GA4", conn.ga4PropertyId || lastSynced?.ga4],
    ["PageSpeed", lastSynced?.pagespeed],
    ["Places", lastSynced?.places],
  ];

  return (
    <div className={`rounded-2xl border border-line bg-panel ${compact ? "p-4" : "p-5"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Google · GSC · GA4 · PageSpeed · Places</p>
          <h2 className="mt-1 font-sans text-xl font-semibold">Connect accounts</h2>
          <p className="mt-1 text-sm text-white/50">
            {connected
              ? `Connected as ${conn.googleEmail || "Google user"} · ${conn.status}`
              : status?.configured === false
                ? "Server Google OAuth is not configured."
                : "Connect once to pull Search Console, GA4, PageSpeed, and Places into Searchify."}
          </p>
        </div>
        {!connected ? (
          <button type="button" disabled={busy} onClick={connect} className="h-11 rounded-full bg-gradient-to-r from-blush to-brand px-5 text-sm font-semibold disabled:opacity-50">
            {busy ? "…" : "Connect Google"}
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={disconnect} className="h-10 rounded-full border border-line px-4 text-sm text-white/60 hover:text-blush">
            Disconnect
          </button>
        )}
      </div>

      {connected ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-white/45">Search Console site</span>
            <select value={gsc} onChange={(e) => setGsc(e.target.value)} className="h-11 rounded-xl border border-line bg-ink px-3">
              <option value="">Select site…</option>
              {(sites.gscSites || []).map((site) => (
                <option key={site.siteUrl} value={site.siteUrl}>
                  {site.siteUrl}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-white/45">GA4 property</span>
            <select value={ga4} onChange={(e) => setGa4(e.target.value)} className="h-11 rounded-xl border border-line bg-ink px-3">
              <option value="">Select property…</option>
              {(sites.ga4Properties || []).map((prop) => (
                <option key={prop.propertyId} value={prop.propertyId}>
                  {prop.displayName} ({prop.propertyId})
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="button" disabled={busy || (!gsc && !ga4)} onClick={saveSelection} className="h-10 rounded-full border border-line px-4 text-sm disabled:opacity-50">
              Save selection
            </button>
            <button type="button" disabled={busy || (!conn.gscSiteUrl && !conn.ga4PropertyId && !gsc && !ga4)} onClick={sync} className="h-10 rounded-full bg-brand/30 px-4 text-sm font-medium text-brand disabled:opacity-50">
              Sync all Google data
            </button>
            <button type="button" disabled={busy} onClick={enrich} className="h-10 rounded-full border border-brand/40 px-4 text-sm text-brand disabled:opacity-50">
              Enrich AI layers
            </button>
            {!compact ? (
              <>
                <button type="button" disabled={busy} onClick={runPageSpeed} className="h-10 rounded-full border border-line px-4 text-sm disabled:opacity-50">
                  Run PageSpeed
                </button>
                <button type="button" disabled={busy} onClick={runPlaces} className="h-10 rounded-full border border-line px-4 text-sm disabled:opacity-50">
                  Run Places
                </button>
              </>
            ) : null}
            <Link href="/market/google-services" className="inline-flex h-10 items-center rounded-full border border-brand/40 px-4 text-sm text-brand">
              Open hub
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            {chips.map(([label, on]) => (
              <span key={label} className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.08em] ${on ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/40"}`}>
                {label} {on ? "· on" : "· —"}
              </span>
            ))}
          </div>
          {conn.lastSyncAt ? <p className="text-xs text-white/35 sm:col-span-2">Last sync: {conn.lastSyncAt}</p> : null}
          {conn.lastError ? <p className="text-xs text-blush sm:col-span-2">{conn.lastError}</p> : null}
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm text-brand">{message}</p> : null}
    </div>
  );
}
