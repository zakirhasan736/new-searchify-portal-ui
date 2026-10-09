"use client";

import { useEffect, useState } from "react";
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

export default function PropertyPicker({ google, cmsConnectionId = null, siteLabel = "", onSaved }) {
  const [gscSites, setGscSites] = useState([]);
  const [ga4Props, setGa4Props] = useState([]);
  const [gsc, setGsc] = useState(google?.gscSiteUrl || "");
  const [ga4, setGa4] = useState(google?.ga4PropertyId || "");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const signedIn = Boolean(google?.connected || google?.status === "connected");
  const siteHost = hostOf(siteLabel);
  const mismatch = Boolean(siteHost && hostOf(gsc) && siteHost !== hostOf(gsc));

  useEffect(() => {
    setGsc(google?.gscSiteUrl || "");
    setGa4(google?.ga4PropertyId || "");
  }, [google?.gscSiteUrl, google?.ga4PropertyId]);

  useEffect(() => {
    if (!signedIn) return;
    let cancel = false;
    listGoogleSites().then((res) => {
      if (cancel) return;
      if (!res.ok) {
        setError(typeof res.data?.detail === "string" ? res.data.detail : "Could not load Google properties.");
        return;
      }
      const sites = res.data?.gscSites || [];
      const props = res.data?.ga4Properties || [];
      setGscSites(sites);
      setGa4Props(props);
      setError("");
      const want = hostOf(siteLabel);
      if (want && !google?.gscSiteUrl) {
        const match = sites.find((site) => hostOf(site.siteUrl) === want);
        if (match) setGsc(match.siteUrl);
      }
    });
    return () => { cancel = true; };
  }, [signedIn, siteLabel, google?.gscSiteUrl]);

  const save = async (thenSync) => {
    if (!gsc && !ga4) {
      setError("Select a Search Console property, an Analytics property, or both.");
      return;
    }
    setBusy(thenSync ? "Syncing Search Console and Analytics…" : "Saving…");
    setError("");
    setNote("");
    const ga4Name = ga4Props.find((item) => item.propertyId === ga4)?.displayName || google?.ga4PropertyName || "";
    const saved = await selectGoogleProperties({
      gsc_site_url: gsc,
      ga4_property_id: ga4,
      ga4_property_name: ga4Name,
      cms_connection_id: cmsConnectionId || undefined,
    });
    if (!saved.ok) {
      setBusy("");
      setError(typeof saved.data?.detail === "string" ? saved.data.detail : "Could not save those properties.");
      return;
    }
    if (!thenSync) {
      setBusy("");
      setNote("Properties saved. Sync to pull keywords, traffic, and the approval queue.");
      onSaved?.(saved.data);
      return;
    }
    const sync = await syncGoogleLive(cmsConnectionId);
    setBusy("");
    if (!sync.ok) {
      setError(typeof sync.data?.detail === "string" ? sync.data.detail : "Properties saved, but the sync did not finish.");
      onSaved?.(saved.data);
      return;
    }
    const flags = sync.data?.synced || {};
    const opened = sync.data?.queue?.created;
    setNote(
      `Synced. Search Console ${flags.gsc ? "updated" : "had nothing new"}, Analytics ${flags.ga4 ? "updated" : "had nothing new"}` +
      (opened != null ? `. ${opened} item${opened === 1 ? "" : "s"} waiting for approval.` : "."),
    );
    if (sync.data?.queueError) setError(sync.data.queueError);
    onSaved?.(saved.data);
  };

  if (!signedIn) return null;

  return (
    <div className="w-panel below">
      <div className="dash-eyebrow">ONE GOOGLE SIGN-IN</div>
      <h2>Choose the property.</h2>
      <p>
        Pick the Search Console property and the Analytics property
        {siteLabel ? ` for ${siteLabel}` : " for this website"}. Saving and syncing fills keywords, the site audit, and the approval queue.
      </p>
      {google?.googleEmail ? <p className="w-muted">Signed in as {google.googleEmail}</p> : null}
      {mismatch ? <p className="w-inset">Search Console is {gsc}, while this website is {siteLabel}. Choose the matching property or the live tables stay empty.</p> : null}
      {google?.lastError ? <p className="w-footnote">Last sync: {google.lastError}</p> : null}
      <div className="form-grid">
        <label>Search Console property
          <select value={gsc} onChange={(event) => setGsc(event.target.value)}>
            <option value="">Select a property</option>
            {gscSites.map((site) => (
              <option key={site.siteUrl} value={site.siteUrl}>
                {site.siteUrl}{site.permissionLevel ? ` · ${site.permissionLevel}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label>Analytics property
          <select value={ga4} onChange={(event) => setGa4(event.target.value)}>
            <option value="">Select a GA4 property</option>
            {ga4Props.map((item) => (
              <option key={item.propertyId} value={item.propertyId}>
                {item.displayName} · {item.propertyId}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!gscSites.length && !ga4Props.length && !error ? <p className="w-footnote">Loading properties from Google…</p> : null}
      {error ? <p className="w-inset">{error}</p> : null}
      {note ? <p className="w-inset">{note}</p> : null}
      <div className="w-actions">
        <button className="w-button" type="button" disabled={Boolean(busy)} onClick={() => save(false)}>Save selection</button>
        <button className="w-button primary" type="button" disabled={Boolean(busy)} onClick={() => save(true)}>{busy || "Save and sync"}</button>
      </div>
    </div>
  );
}
