"use client";

import { useEffect, useState } from "react";
import { Btn, Pill, useV3Toast } from "@/components/v3/V3Shell";
import { listGoogleSites, selectGoogleProperties, syncGoogleLive } from "@/lib/v1Api";

function hostOf(url) {
  try {
    const raw = String(url || "").replace(/^sc-domain:/i, "https://");
    const href = raw.startsWith("http") ? raw : `https://${raw}`;
    return new URL(href).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export default function GooglePropertyPicker({ google, onSaved, compact = false, cmsConnectionId = null, siteLabel = "" }) {
  const toast = useV3Toast();
  const [gscSites, setGscSites] = useState([]);
  const [ga4Props, setGa4Props] = useState([]);
  const [gsc, setGsc] = useState(google?.gscSiteUrl || "");
  const [ga4, setGa4] = useState(google?.ga4PropertyId || "");
  const [busy, setBusy] = useState(false);
  const siteHost = hostOf(siteLabel);
  const gscHost = hostOf(gsc);
  const mismatch = Boolean(siteHost && gscHost && siteHost !== gscHost);

  useEffect(() => {
    setGsc(google?.gscSiteUrl || "");
    setGa4(google?.ga4PropertyId || "");
  }, [google?.gscSiteUrl, google?.ga4PropertyId]);

  useEffect(() => {
    if (!google?.connected && google?.status !== "connected") return;
    listGoogleSites().then((res) => {
      if (!res.ok) {
        toast(typeof res.data?.detail === "string" ? res.data.detail : "Could not load Google properties.");
        return;
      }
      const sites = res.data?.gscSites || [];
      setGscSites(sites);
      setGa4Props(res.data?.ga4Properties || []);
      const want = hostOf(siteLabel);
      if (!want || !sites.length) return;
      const match = sites.find((s) => hostOf(s.siteUrl) === want);
      if (match && hostOf(google?.gscSiteUrl) !== want) {
        setGsc(match.siteUrl);
      }
    });
  }, [google?.connected, google?.status, google?.gscSiteUrl, siteLabel, toast]);

  const save = async ({ thenSync = false } = {}) => {
    if (!gsc && !ga4) {
      toast("Select a Search Console property and a GA4 property.");
      return;
    }
    setBusy(true);
    const ga4Name = ga4Props.find((p) => p.propertyId === ga4)?.displayName || google?.ga4PropertyName || "";
    const res = await selectGoogleProperties({
      gsc_site_url: gsc,
      ga4_property_id: ga4,
      ga4_property_name: ga4Name,
      cms_connection_id: cmsConnectionId || undefined,
    });
    if (!res.ok) {
      setBusy(false);
      toast(typeof res.data?.detail === "string" ? res.data.detail : "Could not save properties.");
      return;
    }
    if (thenSync) {
      toast("Properties saved. Syncing Search Console, GA4, PageSpeed and Places…");
      const sync = await syncGoogleLive(cmsConnectionId);
      setBusy(false);
      if (!sync.ok) {
        toast(sync.data?.detail || "Saved, but sync failed.");
        onSaved?.(res.data);
        return;
      }
      const s = sync.data?.synced || {};
      const opened = sync.data?.queue?.created;
      toast(
        `Synced — GSC:${s.gsc ? "✓" : "–"} GA4:${s.ga4 ? "✓" : "–"} PSI:${s.pagespeed ? "✓" : "–"} Places:${s.places ? "✓" : "–"}` +
          (opened != null ? ` · ${opened} review item${opened === 1 ? "" : "s"}` : ""),
      );
      if (sync.data?.queueError) toast(sync.data.queueError);
      onSaved?.(res.data);
      return;
    }
    setBusy(false);
    toast("Properties saved.");
    onSaved?.(res.data);
  };

  return (
    <div className={compact ? "" : "sf-box sf-ai sf-gap"}>
      {!compact ? (
        <div className="sf-row sf-between">
          <h2>Choose Google properties</h2>
          <Pill neutral>One Google sign-in</Pill>
        </div>
      ) : null}
      <p style={{ fontSize: 13 }}>
        Sign-in is done. Pick the Search Console property and GA4 property
        {siteLabel ? ` for ${siteLabel}` : " for this website"}. PageSpeed and Places use the same site URL.
      </p>
      {google?.googleEmail ? <div className="sf-small">Signed in as {google.googleEmail}</div> : null}
      {mismatch ? (
        <div className="sf-small" style={{ color: "var(--sf-warn, #c47b18)" }}>
          Search Console is {gsc}, but this website is {siteLabel}. Pick the matching property or results stay empty.
        </div>
      ) : null}
      {google?.lastError ? <div className="sf-small">Last sync: {google.lastError}</div> : null}
      <label className="sf-field">
        Search Console property
        <select value={gsc} onChange={(e) => setGsc(e.target.value)}>
          <option value="">Select a property / domain</option>
          {gscSites.map((s) => (
            <option key={s.siteUrl} value={s.siteUrl}>
              {s.siteUrl}
              {s.permissionLevel ? ` · ${s.permissionLevel}` : ""}
            </option>
          ))}
        </select>
      </label>
      <label className="sf-field">
        GA4 property
        <select value={ga4} onChange={(e) => setGa4(e.target.value)}>
          <option value="">Select an Analytics property</option>
          {ga4Props.map((p) => (
            <option key={p.propertyId} value={p.propertyId}>
              {p.displayName} · {p.propertyId}
              {p.accountName ? ` · ${p.accountName}` : ""}
            </option>
          ))}
        </select>
      </label>
      <div className="sf-row sf-gap">
        <Btn onClick={() => save({ thenSync: false })} disabled={busy}>
          Save selection
        </Btn>
        <Btn primary onClick={() => save({ thenSync: true })} disabled={busy}>
          {busy ? "Working…" : "Save & sync"}
        </Btn>
      </div>
    </div>
  );
}
