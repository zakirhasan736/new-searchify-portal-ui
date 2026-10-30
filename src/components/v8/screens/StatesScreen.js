"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ConnectDialog, { useConnectionStatus } from "@/components/board/ConnectDialog";
import {
  featurePayload,
  getOps,
  getSiteScan,
  listChanges,
  listCmsConnections,
  loadFeature,
  queueItems,
  runSiteScan,
} from "@/lib/v1Api";
import { activeSiteContext } from "@/lib/siteContext";
import { loadJourney } from "@/lib/journey";
import { SkeletonCards } from "@/components/v8/SkeletonWave";
import "@/styles/v8-screens.css";

const SETTINGS_KEY = "sf_v8_settings_v1";
const PLUGIN_ZIP =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_WP_PLUGIN_URL) ||
  "/app/connections";

function loadLocal() {
  try {
    return JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function saveLocal(patch) {
  const next = { ...loadLocal(), ...patch };
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

function relativeAgo(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const mins = Math.max(1, Math.round((Date.now() - t) / 60000));
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function siteKeyFor(hostname, wordpressId) {
  if (wordpressId) return `sfy-${wordpressId}`;
  const host = String(hostname || "site")
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `sfy-${host || "site"}`;
}

function isBlockedScan(scan) {
  if (!scan) return false;
  const err = String(scan.error || "").toLowerCase();
  if (/403|401|429|block|firewall|forbidden|denied|captcha/.test(err)) return true;
  const failed = scan.failedPages || scan.failed || [];
  return failed.some((f) => {
    const st = Number(f.status || f.code || 0);
    const e = String(f.error || "").toLowerCase();
    return st === 403 || st === 401 || st === 429 || /block|firewall|forbidden/.test(e);
  });
}

export default function StatesScreen() {
  const [status, refreshStatus] = useConnectionStatus();
  const [wpMeta, setWpMeta] = useState({ lastError: "", lastUsedAt: null, pages: 0 });
  const [pendingShip, setPendingShip] = useState(0);
  const [scan, setScan] = useState(null);
  const [gscReady, setGscReady] = useState(true);
  const [opsBroken, setOpsBroken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailNote, setEmailNote] = useState("");
  const [scanBusy, setScanBusy] = useState(false);
  const [scanNote, setScanNote] = useState("");
  const [wpDialog, setWpDialog] = useState(false);
  const [textReady, setTextReady] = useState(true);
  const [checkingPlugin, setCheckingPlugin] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [wpConnected, setWpConnected] = useState(false);

  const { hostname, href } = useMemo(() => activeSiteContext(loadJourney()), []);
  const siteKey = useMemo(
    () => siteKeyFor(hostname, status.wordpressId),
    [hostname, status.wordpressId],
  );

  const empty = useMemo(() => {
    const cells = [];
    for (let i = 0; i < 24; i += 1) {
      cells.push({ delay: `${((i * 7) % 12) * 0.2}s` });
    }
    return cells;
  }, []);

  const reload = useCallback(async () => {
    const journey = loadJourney();
    const ctx = activeSiteContext(journey);
    const [cms, chRes, scanRes, opsRes, organic] = await Promise.all([
      listCmsConnections({ force: true }).catch(() => ({ ok: false })),
      listChanges({ force: true }).catch(() => ({ ok: false, data: [] })),
      getSiteScan(ctx.href || "").catch(() => ({ ok: false })),
      getOps().catch(() => ({ ok: false })),
      loadFeature("organic-search").catch(() => ({ ok: false })),
    ]);

    const sites = cms.data?.connections || [];
    const wp = sites.find((item) => item.provider === "wordpress" && item.status === "connected");
    const wpAny = sites.find((item) => item.provider === "wordpress");
    const scanData = scanRes.data?.scan || null;
    setWpConnected(Boolean(wp));
    setScan(scanData);
    setWpMeta({
      lastError: wp?.lastError || wpAny?.lastError || "",
      lastUsedAt: wp?.lastUsedAt || wpAny?.lastUsedAt || null,
      pages: Number(scanData?.pagesRead || scanData?.draftable || 0),
    });

    const changes = Array.isArray(chRes.data) ? chRes.data : chRes.data?.changes || [];
    setPendingShip(queueItems(changes).length);

    const notices = opsRes.ok ? opsRes.data?.notices || [] : [];
    // Only WordPress problems break the WordPress cable. Google "sync" notices used to count here,
    // so a Search Console error made a connected WordPress site show as unplugged.
    const openBroken = notices.some((n) => {
      if (n.status && n.status !== "open") return false;
      const kind = String(n.kind || "");
      const title = String(n.title || "").toLowerCase();
      return kind === "publish" || /wordpress|unplug/.test(title);
    });
    setOpsBroken(openBroken);

    const gsc = featurePayload(organic);
    const weeks = gsc.weekly || gsc.panels?.weeklyClicks || [];
    const clicks = (weeks || []).reduce((s, w) => s + (Number(Array.isArray(w) ? w[1] : w?.clicks) || 0), 0);
    const daily = Array.isArray(gsc.daily) ? gsc.daily : [];
    // Data is flowing as soon as a sync stored days or weeks — a quiet site can have 0 clicks.
    const hasSeries = (Array.isArray(weeks) && weeks.length >= 1) || daily.length > 0 || clicks > 0;
    setGscReady(hasSeries);

    const local = loadLocal();
    setTextReady(local.textWhenReady !== false);
  }, []);

  useEffect(() => {
    reload().finally(() => setPageReady(true));
  }, [reload]);

  // Connected = a connected WordPress row exists (the active-site match can miss www / old journey hosts).
  const wpOn = Boolean(status.wordpress) || wpConnected;
  // Only a login / permission error means the cable is unplugged. Other last errors (for example
  // "Nothing was published … missing credentials" from a dry run) keep it connected with a note.
  const wpAuthError =
    !/nothing was published|dry-run/i.test(wpMeta.lastError || "") &&
    /401|403|incorrect password|invalid password|login|unauthori|forbidden|expired|revoked|invalid credential|could not be verified/i.test(wpMeta.lastError || "");
  const wpLive = wpOn && !wpAuthError;
  const wpMissing = !wpOn;
  // Cable broken when WP missing, errored, or ops says publish/sync broken.
  const fixed = wpLive && !opsBroken;
  const s1broken = !fixed;

  const ago = relativeAgo(wpMeta.lastUsedAt) || "recently";
  const s1shift = fixed ? "30px" : "-36px";
  const s1cable = fixed ? "#4DA3FF" : "#FF5A4E";
  const s1socket = fixed ? "#4DA3FF" : "#FF5A4E";
  const s1glow = fixed
    ? "drop-shadow(0 0 10px rgba(77,163,255,.75))"
    : "drop-shadow(0 0 8px rgba(255,90,78,.45))";
  const s1flow = fixed ? 0.9 : 0;
  const s1sparkOp = fixed ? 0 : 1;
  const s1led = fixed ? "none" : "sfy-breathe .9s ease-in-out infinite";
  const s1border = fixed ? "rgba(77,163,255,.45)" : "rgba(255,90,78,.55)";
  const s1shadow = fixed ? "0 0 26px rgba(77,163,255,.15)" : "0 0 26px rgba(255,90,78,.15)";
  const s1aria = fixed ? "WordPress cable connected" : "WordPress cable unplugged";
  const s1title = fixed
    ? wpMeta.lastError
      ? "WordPress is connected — last publish needs a look"
      : "WordPress is connected. Shipping is on."
    : wpMissing
      ? "WordPress is not connected yet"
      : wpMeta.lastError
        ? `WordPress came unplugged ${ago}`
        : `WordPress came unplugged ${ago}`;
  const s1body = fixed
    ? pendingShip
      ? `The ${pendingShip} change${pendingShip === 1 ? "" : "s"} that ${pendingShip === 1 ? "was" : "were"} waiting can ship now.`
      : wpMeta.lastError
        ? "The connection is live. The last publish didn't go through — the reason is below."
        : "Scanning and measuring continue. Approve a move when you are ready to ship."
    : wpMissing
      ? "Connect WordPress so approved titles and descriptions can publish. Scanning and measuring still work, and nothing was lost."
      : "Your site's login changed, so Searchify can't ship changes. Scanning and measuring continue, and nothing was lost.";

  const s2done = wpLive;
  const s2waiting = !s2done;
  const pagesMapped = wpMeta.pages || scan?.pagesRead || 0;
  const seoHint = scan?.business ? "SEO fields readable" : "pages mapped";

  const brandNew = Boolean(status.gsc) && !gscReady;
  // Google account linked but the Search Console property isn't readable / verified.
  const googleLinked = status.googleAccount === "connected";
  const gscIssue = googleLinked && !status.gsc && (status.gscStatus === "unverified" || Boolean(status.google?.lastError));
  const googleError = status.google?.problem?.message || status.google?.lastError || "";
  const scanBlocked = isBlockedScan(scan);

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(siteKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const downloadPlugin = () => {
    if (PLUGIN_ZIP.startsWith("http") || PLUGIN_ZIP.endsWith(".zip")) {
      window.open(PLUGIN_ZIP, "_blank", "noopener,noreferrer");
      return;
    }
    setWpDialog(true);
  };

  const checkInstalled = async () => {
    setCheckingPlugin(true);
    await refreshStatus();
    await reload();
    setCheckingPlugin(false);
    if (!status.wordpress) setWpDialog(true);
  };

  const emailWebPerson = () => {
    const subject = encodeURIComponent("Please allow SearchifyBot on our site");
    const body = encodeURIComponent(
      [
        `Hi — Searchify needs to read ${hostname || "our site"} for SEO recommendations.`,
        "",
        "Please allow this user-agent through the firewall / WAF:",
        "SearchifyBot/1.0 (+https://searchify.nextcreavo.com)",
        "",
        "Nothing on the site is changed by the scan. Thanks.",
      ].join("\n"),
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setEmailNote("Opened your mail app with the steps.");
  };

  const retryScan = async () => {
    setScanBusy(true);
    setScanNote("");
    try {
      const res = await runSiteScan({ force: true });
      if (!res.ok) {
        setScanNote(typeof res.data?.detail === "string" ? res.data.detail : "Scan still blocked.");
      } else {
        setScanNote("Scan finished. Open the board to review.");
      }
      await reload();
    } catch {
      setScanNote("Could not reach the scan service.");
    } finally {
      setScanBusy(false);
    }
  };

  const toggleTextReady = (on) => {
    setTextReady(on);
    const local = loadLocal();
    const notif = { ...(local.notif || {}), weekly: on, broken: true };
    saveLocal({ textWhenReady: on, notif });
  };

  if (!pageReady) {
    return (
      <div style={{ padding: "28px clamp(16px, 4vw, 56px) 56px", background: "#0A0B0D" }}>
        <SkeletonCards count={3} lines={4} />
      </div>
    );
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `@keyframes sfy-flow{to{stroke-dashoffset:-38}}@keyframes sfy-spark{0%,100%{opacity:0}30%,60%{opacity:1}}`,
        }}
      />
      <div
        style={{
          minHeight: "auto",
          background: "#0A0B0D",
          color: "#F2F4F5",
          fontFamily: "Geist, 'Helvetica Neue', sans-serif",
          boxSizing: "border-box",
          padding: "28px clamp(16px, 4vw, 56px) 56px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        <div style={{ maxWidth: "1180px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
              fontSize: "clamp(32px, 4vw, 48px)",
              letterSpacing: "-1.4px",
              fontWeight: 700,
            }}
          >
            When things go sideways
          </h1>
          <p style={{ margin: 0, fontSize: "16px", color: "#9AA1AB" }}>
            Every problem says what happened, that nothing was lost, and gives one blue button to fix it.
          </p>
        </div>

        <div
          style={{
            maxWidth: "1180px",
            width: "100%",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))",
            gap: "16px",
          }}
        >
          <section
            aria-labelledby="s1"
            style={{
              borderRadius: "24px",
              background: "#101215",
              border: `1px solid ${s1border}`,
              boxShadow: s1shadow,
              padding: "26px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              transition: "border-color .4s ease, box-shadow .4s ease",
              opacity: s1broken || fixed ? 1 : 0.85,
            }}
          >
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px", color: "#9AA1AB" }}>
              A · A CONNECTION BREAKS
            </span>
            <svg viewBox="0 0 600 100" role="img" aria-label={s1aria} style={{ width: "100%", height: "auto", overflow: "visible" }}>
              <g
                style={{
                  transform: `translateX(${s1shift})`,
                  transition: "transform .5s cubic-bezier(.3,1.4,.5,1)",
                  filter: s1glow,
                }}
              >
                <path
                  d="M-60 50 C 80 50, 140 18, 250 40 S 360 76, 422 50"
                  fill="none"
                  stroke={s1cable}
                  strokeWidth="7"
                  strokeLinecap="round"
                  style={{ transition: "stroke .4s ease" }}
                />
                <path
                  d="M-60 50 C 80 50, 140 18, 250 40 S 360 76, 422 50"
                  fill="none"
                  stroke="#CFE6FF"
                  strokeWidth="2.5"
                  strokeDasharray="3 16"
                  style={{ opacity: s1flow, animation: "sfy-flow .7s linear infinite" }}
                />
                <rect x="418" y="30" width="58" height="40" rx="9" fill={s1cable} style={{ transition: "fill .4s ease" }} />
                <rect x="476" y="38" width="24" height="6" rx="2" fill="#8A9099" />
                <rect x="476" y="56" width="24" height="6" rx="2" fill="#8A9099" />
              </g>
              <g style={{ opacity: s1sparkOp }}>
                <path
                  d="M488 22 l8 -10 M500 24 l2 -14 M510 30 l10 -8"
                  stroke="#FF5A4E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ animation: "sfy-spark 1.2s ease-in-out infinite" }}
                />
              </g>
              <rect x="506" y="18" width="80" height="64" rx="14" fill="#131519" stroke={s1socket} strokeWidth="2" />
              <rect x="506" y="37" width="16" height="8" rx="2" fill="#0A0B0D" />
              <rect x="506" y="55" width="16" height="8" rx="2" fill="#0A0B0D" />
              <circle cx="564" cy="50" r="6" fill={s1socket} style={{ animation: s1led }} />
            </svg>
            <h2 id="s1" style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
              {s1title}
            </h2>
            <p style={{ margin: 0, fontSize: "15px", color: "#9AA1AB", lineHeight: 1.5 }}>{s1body}</p>
            {wpMeta.lastError ? (
              <p style={{ margin: 0, fontSize: "13px", color: "#FFC53D", fontFamily: "'Geist Mono', monospace" }}>
                {wpMeta.lastError}
              </p>
            ) : null}
            {s1broken ? (
              <button
                type="button"
                onClick={() => setWpDialog(true)}
                style={{
                  alignSelf: "flex-start",
                  minHeight: "50px",
                  padding: "0 22px",
                  borderRadius: "13px",
                  border: 0,
                  background: "#4DA3FF",
                  color: "#0A0B0D",
                  fontSize: "15px",
                  fontWeight: 600,
                  boxShadow: "0 0 22px rgba(77,163,255,.45)",
                }}
              >
                Reconnect WordPress
              </button>
            ) : (
              <Link
                href="/app/connections"
                style={{
                  alignSelf: "flex-start",
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: "44px",
                  padding: "0 14px",
                  borderRadius: "11px",
                  border: "1px solid #262A31",
                  background: "transparent",
                  color: "#9AA1AB",
                  fontSize: "13px",
                  textDecoration: "none",
                }}
              >
                Open connections
              </Link>
            )}
          </section>

          <section
            aria-labelledby="s2"
            style={{
              borderRadius: "24px",
              background: "#101215",
              border: s2waiting ? "1px solid rgba(255,197,61,.35)" : "1px solid #1A1D22",
              padding: "26px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px", color: "#9AA1AB" }}>
              B · INSTALLING THE WORDPRESS PLUGIN
            </span>
            <h2 id="s2" style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
              Three steps, about two minutes
            </h2>
            <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
              <li style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <span
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: "#262A31",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "13px",
                  }}
                >
                  1
                </span>
                <span style={{ flex: "1 1 200px", fontSize: "15px" }}>Download the Searchify plugin</span>
                <button
                  type="button"
                  onClick={downloadPlugin}
                  style={{
                    minHeight: "38px",
                    padding: "0 12px",
                    borderRadius: "10px",
                    border: "1px solid #262A31",
                    background: "transparent",
                    color: "#D7DADE",
                    fontSize: "13px",
                  }}
                >
                  {PLUGIN_ZIP.endsWith(".zip") || PLUGIN_ZIP.startsWith("http") ? "Download .zip" : "Connect WordPress"}
                </button>
              </li>
              <li style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: "#262A31",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "13px",
                  }}
                >
                  2
                </span>
                <span style={{ fontSize: "15px" }}>In WordPress: Plugins → Add new → Upload → Activate</span>
              </li>
              <li style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <span
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: "#262A31",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "13px",
                  }}
                >
                  3
                </span>
                <span style={{ flex: "1 1 200px", fontSize: "15px" }}>Paste this site key into the plugin</span>
                <code
                  style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: "13px",
                    padding: "8px 10px",
                    borderRadius: "9px",
                    background: "#0A0B0D",
                    border: "1px solid #262A31",
                  }}
                >
                  {siteKey}
                </code>
                <button
                  type="button"
                  onClick={copyKey}
                  style={{
                    minHeight: "38px",
                    padding: "0 12px",
                    borderRadius: "10px",
                    border: "1px solid #262A31",
                    background: "transparent",
                    color: "#D7DADE",
                    fontSize: "13px",
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </li>
            </ol>
            {s2waiting ? (
              <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", paddingTop: "4px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#9AA1AB" }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#FFC53D",
                      animation: "sfy-breathe 1s ease-in-out infinite",
                    }}
                  />
                  Waiting for your site to say hello…
                </span>
                <button
                  type="button"
                  onClick={checkInstalled}
                  disabled={checkingPlugin}
                  style={{
                    minHeight: "46px",
                    padding: "0 18px",
                    borderRadius: "12px",
                    border: 0,
                    background: "#4DA3FF",
                    color: "#0A0B0D",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {checkingPlugin ? "Checking…" : "I've installed it"}
                </button>
              </div>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#4DA3FF" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4DA3FF", boxShadow: "0 0 10px #4DA3FF" }} />
                Connected · {seoHint}
                {pagesMapped ? ` · ${pagesMapped} pages mapped` : ""}
              </span>
            )}
          </section>

          <section
            aria-labelledby="s3"
            style={{
              borderRadius: "24px",
              background: "#101215",
              border: brandNew ? "1px solid rgba(77,163,255,.4)" : "1px solid #1A1D22",
              padding: "26px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px", color: "#9AA1AB" }}>
              C · BRAND-NEW SITE, NO DATA YET
            </span>
            <div aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: "10px" }}>
              {empty.map((e, i) => (
                <div key={i} style={{ aspectRatio: "1", display: "grid", placeItems: "center" }}>
                  <div
                    style={{
                      width: "50%",
                      aspectRatio: "1",
                      borderRadius: "50%",
                      background: brandNew ? "#1A1D22" : gscReady ? "#262A31" : "#1A1D22",
                      animation: brandNew || !gscReady ? "sfy-breathe 2.4s ease-in-out infinite" : "none",
                      animationDelay: e.delay,
                      opacity: gscReady && !brandNew ? 0.45 : 1,
                    }}
                  />
                </div>
              ))}
            </div>
            <h2 id="s3" style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
              {gscReady && status.gsc
                ? "Search data is flowing"
                : status.gsc
                  ? "Your board fills in over the next 3 days"
                  : gscIssue
                    ? "Google is connected — Search Console needs a re-check"
                    : googleLinked && status.gscStatus === "not_selected"
                      ? "Google is connected — pick your Search Console property"
                      : "Connect Search Console to fill the board"}
            </h2>
            <p style={{ margin: 0, fontSize: "15px", color: "#9AA1AB", lineHeight: 1.5 }}>
              {gscReady && status.gsc
                ? `${hostname || "Your site"} already has click and impression history in Searchify.`
                : gscIssue
                  ? `Signed in as ${status.google?.googleEmail || status.google?.account?.email || "your Google account"}${status.google?.gscSiteUrl ? ` · property ${status.google.gscSiteUrl}` : ""}. Open Connections, choose the property again and press Save and sync.`
                  : googleLinked && status.gscStatus === "not_selected"
                    ? "Choose which Search Console property belongs to this site so the board can fill in."
                    : "Google takes a few days to start sending data for a newly connected site. Searchify has already read your pages — the colours appear as soon as the search data arrives."}
            </p>
            {gscIssue && googleError ? (
              <p style={{ margin: 0, fontSize: "13px", color: "#FFC53D", lineHeight: 1.5 }}>{googleError}</p>
            ) : null}
            {gscReady && status.gsc ? (
              <Link
                href="/app/outcomes"
                style={{
                  alignSelf: "flex-start",
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: "46px",
                  padding: "0 18px",
                  borderRadius: "12px",
                  background: "#4DA3FF",
                  color: "#0A0B0D",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Open results
              </Link>
            ) : !status.gsc ? (
              <Link
                href={googleLinked ? "/app/connections/google" : "/app/connections"}
                style={{
                  alignSelf: "flex-start",
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: "46px",
                  padding: "0 18px",
                  borderRadius: "12px",
                  background: "#4DA3FF",
                  color: "#0A0B0D",
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {gscIssue ? "Fix Search Console" : googleLinked ? "Choose property" : "Connect Google"}
              </Link>
            ) : (
              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px" }}>
                <input
                  type="checkbox"
                  checked={textReady}
                  onChange={(e) => toggleTextReady(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "#4DA3FF" }}
                />
                Text me when it&apos;s ready
              </label>
            )}
          </section>

          <section
            aria-labelledby="s4"
            style={{
              borderRadius: "24px",
              background: "#101215",
              border: scanBlocked ? "1px solid rgba(255,90,78,.45)" : "1px solid #1A1D22",
              padding: "26px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px", color: "#9AA1AB" }}>
              D · THE SCAN CAN&apos;T GET IN
            </span>
            <h2 id="s4" style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
              {scanBlocked ? "Your site blocked our scan" : scan?.pagesRead ? "Scan can reach your pages" : "If a firewall blocks the scan"}
            </h2>
            <p style={{ margin: 0, fontSize: "15px", color: "#9AA1AB", lineHeight: 1.5 }}>
              {scanBlocked
                ? "A security setting on your site turned Searchify away. That's normal for sites with a firewall, and nothing on your site was changed."
                : "A security setting on your site can turn Searchify away. That's normal for sites with a firewall, and nothing on your site is changed by the scan."}
            </p>
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "14px",
                background: "#0A0B0D",
                border: "1px solid #262A31",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                fontSize: "14px",
              }}
            >
              <span>Ask your host or web person to allow:</span>
              <code style={{ fontFamily: "'Geist Mono', monospace", fontSize: "13px", color: "#D7DADE" }}>SearchifyBot</code>
              {scan?.error ? (
                <span style={{ fontSize: "12px", color: "#FFC53D", fontFamily: "'Geist Mono', monospace" }}>{scan.error}</span>
              ) : null}
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={retryScan}
                disabled={scanBusy}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: "48px",
                  padding: "0 20px",
                  borderRadius: "12px",
                  background: "#4DA3FF",
                  color: "#0A0B0D",
                  border: 0,
                  fontSize: "15px",
                  fontWeight: 600,
                  boxShadow: "0 0 22px rgba(77,163,255,.4)",
                }}
              >
                {scanBusy ? "Scanning…" : "Try the scan again"}
              </button>
              <button
                type="button"
                onClick={emailWebPerson}
                style={{
                  minHeight: "48px",
                  padding: "0 16px",
                  borderRadius: "12px",
                  border: "1px solid #262A31",
                  background: "transparent",
                  color: "#D7DADE",
                  fontSize: "14px",
                }}
              >
                Email these steps to my web person
              </button>
              <Link
                href="/app/results"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: "48px",
                  padding: "0 16px",
                  borderRadius: "12px",
                  border: "1px solid #262A31",
                  color: "#D7DADE",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                Open the scan board
              </Link>
            </div>
            {scanNote || emailNote ? (
              <p style={{ margin: 0, fontSize: "13px", color: "#9AA1AB" }}>{scanNote || emailNote}</p>
            ) : null}
          </section>
        </div>
      </div>

      {wpDialog ? (
        <ConnectDialog
          provider="wordpress"
          siteUrl={status.wordpressUrl || href || ""}
          onClose={() => setWpDialog(false)}
          onDone={() => {
            setWpDialog(false);
            refreshStatus();
            reload();
          }}
        />
      ) : null}
    </>
  );
}
