"use client";

import { useEffect, useRef, useState } from "react";
import {
  activateGoogleSite,
  errorCode,
  errorText,
  listGoogleSites,
  selectGoogleProperties,
  syncGoogleLive,
} from "@/lib/v1Api";
import ProblemNotice from "@/components/v8/ProblemNotice";
import { problemsFrom } from "@/lib/problems";
import { syncJourneyNow } from "@/lib/journey";

const UNUSABLE = new Set(["siteUnverifiedUser"]);

function hostOf(url) {
  try {
    const raw = String(url || "").replace(/^sc-domain:/i, "https://");
    const href = raw.startsWith("http") ? raw : `https://${raw}`;
    return new URL(href).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

/** Pick the single best GSC property for a host (mirrors backend google_match). */
function pickGscForHost(siteHost, sites) {
  if (!siteHost) return "";
  const scored = [];
  for (const prop of sites || []) {
    const siteUrl = prop?.siteUrl || "";
    if (!siteUrl || UNUSABLE.has(prop?.permissionLevel)) continue;
    if (/^sc-domain:/i.test(siteUrl)) {
      const domain = siteUrl.split(":")[1]?.trim().replace(/^www\./, "").toLowerCase() || "";
      if (siteHost === domain || siteHost.endsWith(`.${domain}`)) scored.push([0, siteUrl]);
      continue;
    }
    const host = hostOf(siteUrl);
    if (host !== siteHost) continue;
    try {
      const href = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
      const path = new URL(href).pathname || "/";
      if (path !== "/" && path !== "") {
        scored.push([4, siteUrl]);
        continue;
      }
      scored.push([href.startsWith("https:") ? 2 : 3, siteUrl]);
    } catch {
      scored.push([3, siteUrl]);
    }
  }
  if (!scored.length) return "";
  scored.sort((a, b) => a[0] - b[0]);
  const bestTier = scored[0][0];
  const best = scored.filter((row) => row[0] === bestTier).map((row) => row[1]);
  return best.length === 1 ? best[0] : "";
}

function pickGa4ForHost(siteHost, props) {
  if (!siteHost) return "";
  const hits = (props || []).filter((item) =>
    (item.streams || []).some((uri) => hostOf(uri) === siteHost),
  );
  if (hits.length === 1) return hits[0].propertyId || "";
  if (hits.length > 1) return "";
  // Fallback: unique display name / id that clearly contains the host
  const named = (props || []).filter((item) => {
    const label = `${item.displayName || ""} ${item.propertyId || ""}`.toLowerCase();
    return label.includes(siteHost);
  });
  return named.length === 1 ? named[0].propertyId || "" : "";
}

/**
 * Dark V8 property chooser for Plug in.
 * Matches GSC + GA4 to the workspace domain, auto-selects when unambiguous,
 * then Save and sync so keywords, audit, scan, and Today’s moves can fill.
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
  const [problems, setProblems] = useState([]);
  const autoSyncRef = useRef(false);

  const signedIn = google?.account?.status === "connected" || Boolean(google?.connected);
  const reauth = google?.account?.status === "reauth_required";
  const siteHost = hostOf(siteLabel);
  const mismatch = Boolean(siteHost && hostOf(gsc) && siteHost !== hostOf(gsc));
  const needsPick = Boolean(
    signedIn &&
      (!google?.gscSiteUrl ||
        google?.gsc?.status !== "connected" ||
        !google?.ga4PropertyId ||
        google?.ga4?.status !== "connected"),
  );

  useEffect(() => {
    setGsc(google?.gscSiteUrl || "");
    setGa4(google?.ga4PropertyId || "");
  }, [google?.gscSiteUrl, google?.ga4PropertyId]);

  const save = async (thenSync, overrides = null) => {
    const nextGsc = overrides?.gsc ?? gsc;
    const nextGa4 = overrides?.ga4 ?? ga4;
    const propList = overrides?.ga4Props || ga4Props;
    if (!nextGsc && !nextGa4) {
      setError("Select a Search Console property, an Analytics property, or both.");
      return false;
    }
    setBusy(thenSync ? "Syncing Search Console and Analytics…" : "Saving…");
    setError("");
    setNote("");
    setProblems([]);
    const ga4Name =
      propList.find((item) => item.propertyId === nextGa4)?.displayName || google?.ga4PropertyName || "";
    const saved = await selectGoogleProperties({
      gsc_site_url: nextGsc,
      ga4_property_id: nextGa4,
      ga4_property_name: ga4Name,
    });
    if (!saved.ok) {
      setBusy("");
      setProblems(problemsFrom(saved, "search_console"));
      return false;
    }
    if (siteLabel) {
      await activateGoogleSite(siteLabel).catch(() => null);
    }
    if (!thenSync) {
      setBusy("");
      setNote("Properties saved. Sync to pull keywords, audit data, and Today’s moves.");
      onSaved?.(saved.data);
      return true;
    }
    const sync = await syncGoogleLive();
    setBusy("");
    if (!sync.ok) {
      setNote("Properties saved, but the sync did not finish.");
      setProblems(problemsFrom(sync, "search_console"));
      onSaved?.(saved.data);
      return false;
    }
    setProblems(problemsFrom(sync, "search_console"));
    const flags = sync.data?.synced || {};
    const opened = sync.data?.queue?.created;
    setNote(
      `Synced. Search Console ${flags.gsc ? "updated" : "had nothing new"}, Analytics ${
        flags.ga4 ? "updated" : "had nothing new"
      }` + (opened != null ? `. ${opened} item${opened === 1 ? "" : "s"} in Today’s moves.` : "."),
    );
    if (sync.data?.queueError) setError(sync.data.queueError);
    onSaved?.(saved.data || sync.data);
    return true;
  };

  useEffect(() => {
    if (!signedIn) return undefined;
    let cancel = false;
    (async () => {
      // Keep the server journey in sync so domain match can use the site the user added.
      await syncJourneyNow().catch(() => null);
      let activated = null;
      if (siteLabel) {
        try {
          activated = await activateGoogleSite(siteLabel);
        } catch {
          /* activate is best-effort before listing */
        }
      }
      if (cancel) return;

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

      const sites = res.data?.gscSites || [];
      const props = res.data?.ga4Properties || [];
      const matchInfo = res.data?.match || null;
      setGscSites(sites);
      setGa4Props(props);
      setMatch(matchInfo);
      setError("");

      const suggested =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("gsc") : "";

      let nextGsc = google?.gscSiteUrl || activated?.data?.connection?.gscSiteUrl || "";
      let nextGa4 = google?.ga4PropertyId || activated?.data?.connection?.ga4PropertyId || "";

      if (suggested && sites.some((site) => site.siteUrl === suggested)) {
        nextGsc = suggested;
        setNote(`Selected ${suggested}. Syncing…`);
      } else if (!nextGsc && matchInfo?.gsc?.status === "matched") {
        nextGsc = matchInfo.gsc.selected;
      } else if (!nextGsc) {
        nextGsc = pickGscForHost(siteHost, sites);
      }

      if (!nextGa4 && matchInfo?.ga4?.status === "matched") {
        nextGa4 = matchInfo.ga4.selected;
      } else if (!nextGa4) {
        nextGa4 = pickGa4ForHost(siteHost, props);
      }

      if (cancel) return;
      setGsc(nextGsc);
      setGa4(nextGa4);

      const gscNeeds =
        Boolean(nextGsc) &&
        (nextGsc !== google?.gscSiteUrl || google?.gsc?.status !== "connected");
      const ga4Needs =
        Boolean(nextGa4) &&
        (nextGa4 !== google?.ga4PropertyId || google?.ga4?.status !== "connected");
      const needsSyncFlag = Boolean(activated?.data?.needsSync);
      const shouldAuto = Boolean(nextGsc || nextGa4) && (gscNeeds || ga4Needs || needsSyncFlag);

      if (!autoSyncRef.current && shouldAuto) {
        autoSyncRef.current = true;
        if (matchInfo?.gsc?.status === "matched" || matchInfo?.ga4?.status === "matched" || nextGsc || nextGa4) {
          setNote("Matched to this site. Saving and syncing…");
        }
        await save(true, { gsc: nextGsc, ga4: nextGa4, ga4Props: props });
      } else if (nextGsc || nextGa4) {
        if (matchInfo?.gsc?.status === "matched" || matchInfo?.ga4?.status === "matched") {
          setNote("Properties matched to this site. Change them below if needed, then Save and sync.");
        }
      }
    })();
    return () => {
      cancel = true;
    };
    // Intentionally omit `save` — auto-run once per signed-in/site session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, siteLabel, siteHost, google?.gscSiteUrl, google?.ga4PropertyId]);

  if (reauth) {
    return (
      <section style={panelStyle}>
        <span style={eyebrowStyle}>GOOGLE SIGN-IN EXPIRED</span>
        <h2 style={titleStyle}>Sign in to Google again.</h2>
        <p style={bodyStyle}>
          Access for {google?.account?.email || google?.googleEmail || "this account"} expired. Property
          choices are kept; reconnect to read them again.
        </p>
      </section>
    );
  }

  if (!signedIn) return null;

  return (
    <section id="google-properties" style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "baseline" }}>
        <span style={eyebrowStyle}>GOOGLE PROPERTIES</span>
        {needsPick && !(gsc || ga4) ? (
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#FFC53D" }}>Required for live data</span>
        ) : (
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#3DDC84" }}>Matched to this site</span>
        )}
      </div>
      <h2 style={titleStyle}>Choose the Search Console and Analytics property.</h2>
      <p style={bodyStyle}>
        Searchify matches by domain when exactly one property fits
        {siteLabel ? ` ${siteHost || siteLabel}` : " this website"}. Confirm and sync so keyword tracking,
        site audit, site scan, and Today’s moves can load.
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
      {google?.lastError && !problems.length && !google?.problem ? (
        <p style={warnStyle}>Last sync failed: {google.lastError}</p>
      ) : null}

      {match?.gsc?.status === "matched" && match.gsc.selected === gsc ? (
        <p style={hintStyle}>Search Console matched: {gsc}</p>
      ) : null}
      {match?.gsc?.status && match.gsc.status !== "matched" && !gsc ? (
        <p style={warnStyle}>{match.gsc.reason}</p>
      ) : null}
      {match?.ga4?.status === "matched" && match.ga4.selected === ga4 ? (
        <p style={hintStyle}>
          Analytics matched: {ga4Props.find((p) => p.propertyId === ga4)?.displayName || ga4}
        </p>
      ) : null}
      {match?.ga4?.status && match.ga4.status !== "matched" && !ga4 ? (
        <p style={warnStyle}>{match.ga4.reason}</p>
      ) : null}
      {mismatch ? (
        <p style={warnStyle}>
          Search Console is {gsc}, while this website is {siteLabel}. Pick the matching property or tables stay
          empty.
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
      <ProblemNotice
        problems={problems.length ? problems : google?.problem ? [google.problem] : []}
        onRetry={() => save(true)}
      />

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
