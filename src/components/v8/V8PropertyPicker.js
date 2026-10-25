"use client";

import { useEffect, useState } from "react";
import {
  activateGoogleSite,
  errorCode,
  errorText,
  listGoogleSites,
  selectGoogleProperties,
  syncGoogleLive,
} from "@/lib/v1Api";

function hostOf(url) {
  try {
    const raw = String(url || "").replace(/^sc-domain:/i, "https://");
    const href = raw.startsWith("http") ? raw : `https://${raw}`;
    return new URL(href).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Dark V8 property chooser for Plug in.
 * Matches GSC + GA4 to the workspace domain when the match is unambiguous,
 * then save + sync so keywords, audit, scan, and Today’s moves can fill.
 */
export default function V8PropertyPicker({ google, siteLabel = "", onSaved }) {
  const [gscSites, setGscSites] = useState([]);
  const [ga4Props, setGa4Props] = useState([]);
  const [gsc, setGsc] = useState(google?.gscSiteUrl || "");
  const [ga4, setGa4] = useState(google?.ga4PropertyId || "");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [match, setMatch] = useState(null);

  const signedIn = google?.account?.status === "connected" || Boolean(google?.connected);
  const reauth = google?.account?.status === "reauth_required";
  const siteHost = hostOf(siteLabel);
  const mismatch = Boolean(siteHost && hostOf(gsc) && siteHost !== hostOf(gsc));
  const needsPick = Boolean(
    signedIn && (!google?.gscSiteUrl || google?.gsc?.status !== "connected" || !google?.ga4PropertyId || google?.ga4?.status !== "connected"),
  );

  useEffect(() => {
    setGsc(google?.gscSiteUrl || "");
    setGa4(google?.ga4PropertyId || "");
  }, [google?.gscSiteUrl, google?.ga4PropertyId]);

  useEffect(() => {
    if (!signedIn) return undefined;
    let cancel = false;
    (async () => {
      if (siteLabel) {
        try {
          await activateGoogleSite(siteLabel);
        } catch {
          /* activate is best-effort before listing */
        }
      }
      const res = await listGoogleSites(siteLabel);
      if (cancel) return;
      if (!res.ok) {
        setError(
          errorCode(res) === "google_reauth_required"
            ? "Google access expired. Sign in again to choose properties."
            : errorText(res, "Could not load Google properties."),
        );
        return;
      }
      setGscSites(res.data?.gscSites || []);
      setGa4Props(res.data?.ga4Properties || []);
      setMatch(res.data?.match || null);
      setError("");
      if (!google?.gscSiteUrl && res.data?.match?.gsc?.status === "matched") {
        setGsc(res.data.match.gsc.selected);
      }
      if (!google?.ga4PropertyId && res.data?.match?.ga4?.status === "matched") {
        setGa4(res.data.match.ga4.selected);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [signedIn, siteLabel, google?.gscSiteUrl, google?.ga4PropertyId]);

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
    });
    if (!saved.ok) {
      setBusy("");
      setError(errorText(saved, "Could not save those properties."));
      return;
    }
    if (siteLabel) {
      await activateGoogleSite(siteLabel).catch(() => null);
    }
    if (!thenSync) {
      setBusy("");
      setNote("Properties saved. Sync to pull keywords, audit data, and Today’s moves.");
      onSaved?.(saved.data);
      return;
    }
    const sync = await syncGoogleLive();
    setBusy("");
    if (!sync.ok) {
      setError(errorText(sync, "Properties saved, but the sync did not finish."));
      onSaved?.(saved.data);
      return;
    }
    const flags = sync.data?.synced || {};
    const opened = sync.data?.queue?.created;
    setNote(
      `Synced. Search Console ${flags.gsc ? "updated" : "had nothing new"}, Analytics ${flags.ga4 ? "updated" : "had nothing new"}` +
        (opened != null ? `. ${opened} item${opened === 1 ? "" : "s"} in Today’s moves.` : "."),
    );
    if (sync.data?.queueError) setError(sync.data.queueError);
    onSaved?.(saved.data || sync.data);
  };

  if (reauth) {
    return (
      <section style={panelStyle}>
        <span style={eyebrowStyle}>GOOGLE SIGN-IN EXPIRED</span>
        <h2 style={titleStyle}>Sign in to Google again.</h2>
        <p style={bodyStyle}>
          Access for {google?.account?.email || google?.googleEmail || "this account"} expired. Property choices are kept; reconnect to read them again.
        </p>
      </section>
    );
  }

  if (!signedIn) return null;

  return (
    <section id="google-properties" style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "baseline" }}>
        <span style={eyebrowStyle}>GOOGLE PROPERTIES</span>
        {needsPick ? (
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#FFC53D" }}>Required for live data</span>
        ) : (
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#3DDC84" }}>Matched to this site</span>
        )}
      </div>
      <h2 style={titleStyle}>Choose the Search Console and Analytics property.</h2>
      <p style={bodyStyle}>
        Searchify matches by domain when exactly one property fits
        {siteLabel ? ` ${siteHost || siteLabel}` : " this website"}. Confirm and sync so keyword tracking, site audit, site scan, and Today’s moves can load.
      </p>
      {google?.googleEmail || google?.account?.email ? (
        <p style={{ margin: 0, fontSize: "13px", color: "#7D848E" }}>
          Signed in as <strong style={{ color: "#F2F4F5" }}>{google?.googleEmail || google?.account?.email}</strong>
          {" — this exact email must be Full on the Search Console property you pick."}
        </p>
      ) : null}
      <p style={{ margin: 0, fontSize: "13px", color: "#9AA1AB", lineHeight: 1.5 }}>
        Domain property <code style={{ color: "#D7DADE" }}>sc-domain:…</code> is not the same as{" "}
        <code style={{ color: "#D7DADE" }}>https://…</code> or <code style={{ color: "#D7DADE" }}>https://www.…</code>.
        Your client must add you on the exact property Searchify selects (often the Domain one).
      </p>
      {google?.lastError ? <p style={warnStyle}>{google.lastError}</p> : null}

      {match?.gsc?.status === "matched" && match.gsc.selected === gsc ? (
        <p style={hintStyle}>Search Console matched: {gsc}</p>
      ) : null}
      {match?.gsc?.status && match.gsc.status !== "matched" && !gsc ? <p style={warnStyle}>{match.gsc.reason}</p> : null}
      {match?.ga4?.status === "matched" && match.ga4.selected === ga4 ? (
        <p style={hintStyle}>Analytics matched: {ga4Props.find((p) => p.propertyId === ga4)?.displayName || ga4}</p>
      ) : null}
      {match?.ga4?.status && match.ga4.status !== "matched" && !ga4 ? <p style={warnStyle}>{match.ga4.reason}</p> : null}
      {mismatch ? (
        <p style={warnStyle}>
          Search Console is {gsc}, while this website is {siteLabel}. Pick the matching property or tables stay empty.
        </p>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
        <label style={labelStyle}>
          Search Console property
          <select value={gsc} onChange={(event) => setGsc(event.target.value)} style={selectStyle}>
            <option value="">Select a property</option>
            {gscSites.map((site) => (
              <option key={site.siteUrl} value={site.siteUrl}>
                {site.siteUrl}
                {site.permissionLevel ? ` · ${String(site.permissionLevel).replace(/^site/, "")}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          Analytics property
          <select value={ga4} onChange={(event) => setGa4(event.target.value)} style={selectStyle}>
            <option value="">Select a GA4 property</option>
            {ga4Props.map((item) => (
              <option key={item.propertyId} value={item.propertyId}>
                {item.displayName} · {item.propertyId}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!gscSites.length && !ga4Props.length && !error ? (
        <p style={{ margin: 0, fontSize: "13px", color: "#7D848E" }}>Loading properties from Google…</p>
      ) : null}
      {error ? <p style={warnStyle}>{error}</p> : null}
      {note ? <p style={hintStyle}>{note}</p> : null}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button type="button" disabled={Boolean(busy)} onClick={() => save(false)} style={ghostBtn}>
          Save selection
        </button>
        <button type="button" disabled={Boolean(busy)} onClick={() => save(true)} style={primaryBtn}>
          {busy || "Save and sync"}
        </button>
      </div>
    </section>
  );
}

const panelStyle = {
  maxWidth: "1180px",
  width: "100%",
  margin: "0 auto",
  background: "#121417",
  border: "1px solid #1A1D22",
  borderRadius: "16px",
  padding: "22px 24px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  color: "#F2F4F5",
};

const eyebrowStyle = {
  fontFamily: "'Geist Mono', monospace",
  fontSize: "11px",
  letterSpacing: "0.6px",
  color: "#D5F879",
  fontWeight: 600,
};

const titleStyle = { margin: 0, fontSize: "20px", fontWeight: 600, letterSpacing: "-0.3px" };
const bodyStyle = { margin: 0, fontSize: "14px", color: "#9AA1AB", lineHeight: 1.55, maxWidth: "68ch" };
const hintStyle = { margin: 0, fontSize: "13px", color: "#4DA3FF", lineHeight: 1.45 };
const warnStyle = { margin: 0, fontSize: "13px", color: "#FFC53D", lineHeight: 1.45 };
const labelStyle = { display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#9AA1AB" };
const selectStyle = {
  minHeight: "46px",
  padding: "0 12px",
  borderRadius: "12px",
  border: "1px solid #262A31",
  background: "#0A0B0D",
  color: "#F2F4F5",
  font: "inherit",
  fontSize: "14px",
};
const ghostBtn = {
  minHeight: "46px",
  padding: "0 16px",
  borderRadius: "12px",
  border: "1px solid #262A31",
  background: "transparent",
  color: "#F2F4F5",
  fontSize: "14px",
};
const primaryBtn = {
  minHeight: "46px",
  padding: "0 18px",
  borderRadius: "12px",
  border: 0,
  background: "#4DA3FF",
  color: "#0A0B0D",
  fontSize: "14px",
  fontWeight: 600,
  boxShadow: "0 0 20px rgba(77,163,255,.35)",
};
