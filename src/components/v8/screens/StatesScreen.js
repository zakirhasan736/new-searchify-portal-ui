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
import "@/styles/v8-states.css";

const SETTINGS_KEY = "sf_v8_settings_v1";
const PLUGIN_ZIP =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_WP_PLUGIN_URL) ||
  "";

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
  const [wpMeta, setWpMeta] = useState({ lastError: "", lastUsedAt: null, pages: 0, seo: "" });
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
    const seoHint = scanData?.business
      ? "SEO fields readable via Searchify"
      : "pages mapped";
    setWpMeta({
      lastError: wp?.lastError || wpAny?.lastError || "",
      lastUsedAt: wp?.lastUsedAt || wpAny?.lastUsedAt || null,
      pages: Number(scanData?.pagesRead || scanData?.draftable || 0),
      seo: seoHint,
    });

    const changes = Array.isArray(chRes.data) ? chRes.data : chRes.data?.changes || [];
    setPendingShip(queueItems(changes).length);

    const notices = opsRes.ok ? opsRes.data?.notices || [] : [];
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
    const hasSeries = (Array.isArray(weeks) && weeks.length >= 1) || daily.length > 0 || clicks > 0;
    setGscReady(hasSeries);

    const local = loadLocal();
    setTextReady(local.textWhenReady !== false);
  }, []);

  useEffect(() => {
    reload().finally(() => setPageReady(true));
  }, [reload]);

  const wpOn = Boolean(status.wordpress) || wpConnected;
  const wpAuthError =
    !/nothing was published|dry-run/i.test(wpMeta.lastError || "") &&
    /401|403|incorrect password|invalid password|login|unauthori|forbidden|expired|revoked|invalid credential|could not be verified/i.test(
      wpMeta.lastError || "",
    );
  const wpLive = wpOn && !wpAuthError;
  const wpMissing = !wpOn;
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
  const s1aria = fixed ? "WordPress cable connected" : "WordPress cable unplugged";
  const s1title = fixed
    ? pendingShip
      ? "WordPress is back. Shipping resumed."
      : "WordPress is connected. Shipping is on."
    : wpMissing
      ? "WordPress is not connected yet"
      : `WordPress came unplugged ${ago}`;
  const s1body = fixed
    ? pendingShip
      ? `The ${pendingShip} change${pendingShip === 1 ? "" : "s"} that ${pendingShip === 1 ? "was" : "were"} waiting ${pendingShip === 1 ? "is" : "are"} shipping now.`
      : wpMeta.lastError
        ? "The connection is live. The last publish didn't go through — the reason is below."
        : "Scanning and measuring continue. Approve a move when you are ready to ship."
    : wpMissing
      ? "Connect WordPress so approved titles and descriptions can publish. Scanning and measuring still work, and nothing was lost."
      : "Your site's login changed, so Searchify can't ship changes. Scanning and measuring continue, and nothing was lost.";

  const s2done = wpLive;
  const s2waiting = !s2done;
  const pagesMapped = wpMeta.pages || scan?.pagesRead || 0;

  const brandNew = Boolean(status.gsc) && !gscReady;
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
    if (PLUGIN_ZIP && (PLUGIN_ZIP.startsWith("http") || PLUGIN_ZIP.endsWith(".zip"))) {
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
    if (!status.wordpress && !wpConnected) setWpDialog(true);
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
      <div className="v8-states">
        <SkeletonCards count={3} lines={4} />
      </div>
    );
  }

  const cardAClass = `v8-states-card${s1broken ? " is-broken" : " is-fixed"}`;
  const cardBClass = `v8-states-card${s2waiting ? " is-waiting" : ""}`;
  const cardCClass = `v8-states-card${brandNew ? " is-empty" : ""}`;
  const cardDClass = `v8-states-card${scanBlocked ? " is-blocked" : ""}`;

  return (
    <>
      <div className="v8-states">
        <div className="v8-states-intro">
          <h1>When things go sideways</h1>
          <p>Every problem says what happened, that nothing was lost, and gives one blue button to fix it.</p>
        </div>

        <div className="v8-states-grid">
          <section aria-labelledby="s1" className={cardAClass}>
            <span className="v8-states-label">A · A CONNECTION BREAKS</span>
            <svg viewBox="0 0 600 100" role="img" aria-label={s1aria} className="v8-states-svg">
              <g className="v8-states-plug" style={{ transform: `translateX(${s1shift})`, filter: s1glow }}>
                <path
                  d="M-60 50 C 80 50, 140 18, 250 40 S 360 76, 422 50"
                  fill="none"
                  stroke={s1cable}
                  strokeWidth="7"
                  strokeLinecap="round"
                  className="v8-states-cable"
                />
                <path
                  d="M-60 50 C 80 50, 140 18, 250 40 S 360 76, 422 50"
                  fill="none"
                  stroke="#CFE6FF"
                  strokeWidth="2.5"
                  strokeDasharray="3 16"
                  className="v8-states-flow"
                  style={{ opacity: s1flow }}
                />
                <rect x="418" y="30" width="58" height="40" rx="9" fill={s1cable} className="v8-states-cable" />
                <rect x="476" y="38" width="24" height="6" rx="2" fill="#8A9099" />
                <rect x="476" y="56" width="24" height="6" rx="2" fill="#8A9099" />
              </g>
              <g style={{ opacity: s1sparkOp }}>
                <path
                  d="M488 22 l8 -10 M500 24 l2 -14 M510 30 l10 -8"
                  stroke="#FF5A4E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="v8-states-spark"
                />
              </g>
              <rect x="506" y="18" width="80" height="64" rx="14" fill="#131519" stroke={s1socket} strokeWidth="2" />
              <rect x="506" y="37" width="16" height="8" rx="2" fill="#0A0B0D" />
              <rect x="506" y="55" width="16" height="8" rx="2" fill="#0A0B0D" />
              <circle cx="564" cy="50" r="6" fill={s1socket} className={`v8-states-led${fixed ? " is-off" : ""}`} />
            </svg>
            <h2 id="s1">{s1title}</h2>
            <p>{s1body}</p>
            {wpMeta.lastError ? <p className="v8-states-warn">{wpMeta.lastError}</p> : null}
            {s1broken ? (
              <button type="button" className="v8-states-btn" onClick={() => setWpDialog(true)}>
                Reconnect WordPress
              </button>
            ) : (
              <Link href="/app/connections" className="v8-states-ghost">
                Open connections
              </Link>
            )}
          </section>

          <section aria-labelledby="s2" className={cardBClass}>
            <span className="v8-states-label">B · INSTALLING THE WORDPRESS PLUGIN</span>
            <h2 id="s2">Three steps, about two minutes</h2>
            <ol className="v8-states-steps">
              <li>
                <span className="v8-states-num">1</span>
                <span className="v8-states-step-copy">Download the Searchify plugin</span>
                <button type="button" className="v8-states-chip" onClick={downloadPlugin}>
                  Download .zip
                </button>
              </li>
              <li>
                <span className="v8-states-num">2</span>
                <span style={{ fontSize: 15 }}>In WordPress: Plugins → Add new → Upload → Activate</span>
              </li>
              <li>
                <span className="v8-states-num">3</span>
                <span className="v8-states-step-copy">Paste this site key into the plugin</span>
                <code className="v8-states-key">{siteKey}</code>
                <button type="button" className="v8-states-chip" onClick={copyKey}>
                  {copied ? "Copied" : "Copy"}
                </button>
              </li>
            </ol>
            {s2waiting ? (
              <div className="v8-states-wait">
                <span className="v8-states-wait-label">
                  <span className="v8-states-dot" />
                  Waiting for your site to say hello…
                </span>
                <button type="button" className="v8-states-btn is-sm" onClick={checkInstalled} disabled={checkingPlugin}>
                  {checkingPlugin ? "Checking…" : "I've installed it"}
                </button>
              </div>
            ) : (
              <span className="v8-states-connected">
                <span className="v8-states-connected-dot" />
                Connected · {wpMeta.seo || "pages mapped"}
                {pagesMapped ? ` · ${pagesMapped} pages mapped` : ""}
              </span>
            )}
          </section>

          <section aria-labelledby="s3" className={cardCClass}>
            <span className="v8-states-label">C · BRAND-NEW SITE, NO DATA YET</span>
            <div className="v8-states-empty-grid" aria-hidden="true">
              {empty.map((e, i) => (
                <div key={i} className="v8-states-empty-cell">
                  <div
                    className={`v8-states-empty-dot${gscReady && !brandNew ? " is-dim" : ""}`}
                    style={{ animationDelay: e.delay }}
                  />
                </div>
              ))}
            </div>
            <h2 id="s3">
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
            <p>
              {gscReady && status.gsc
                ? `${hostname || "Your site"} already has click and impression history in Searchify.`
                : gscIssue
                  ? `Signed in as ${status.google?.googleEmail || status.google?.account?.email || "your Google account"}${status.google?.gscSiteUrl ? ` · property ${status.google.gscSiteUrl}` : ""}. Open Connections, choose the property again and press Save and sync.`
                  : googleLinked && status.gscStatus === "not_selected"
                    ? "Choose which Search Console property belongs to this site so the board can fill in."
                    : "Google takes a few days to start sending data for a newly connected site. Searchify has already read your pages — the colours appear as soon as the search data arrives."}
            </p>
            {gscIssue && googleError ? <p className="v8-states-warn">{googleError}</p> : null}
            {gscReady && status.gsc ? (
              <Link href="/app/outcomes" className="v8-states-btn is-sm">
                Open results
              </Link>
            ) : !status.gsc ? (
              <Link
                href={googleLinked ? "/app/connections/google" : "/app/connections"}
                className="v8-states-btn is-sm"
              >
                {gscIssue ? "Fix Search Console" : googleLinked ? "Choose property" : "Connect Google"}
              </Link>
            ) : (
              <label className="v8-states-check">
                <input type="checkbox" checked={textReady} onChange={(e) => toggleTextReady(e.target.checked)} />
                Text me when it&apos;s ready
              </label>
            )}
          </section>

          <section aria-labelledby="s4" className={cardDClass}>
            <span className="v8-states-label">D · THE SCAN CAN&apos;T GET IN</span>
            <h2 id="s4">
              {scanBlocked
                ? "Your site blocked our scan"
                : scan?.pagesRead
                  ? "Scan can reach your pages"
                  : "Your site blocked our scan"}
            </h2>
            <p>
              {scanBlocked
                ? "A security setting on your site turned Searchify away. That's normal for sites with a firewall, and nothing on your site was changed."
                : "A security setting on your site turned Searchify away. That's normal for sites with a firewall, and nothing on your site was changed."}
            </p>
            <div className="v8-states-allow">
              <span>Ask your host or web person to allow:</span>
              <code>SearchifyBot</code>
              {scan?.error ? <span className="v8-states-warn">{scan.error}</span> : null}
            </div>
            <div className="v8-states-actions">
              <button type="button" className="v8-states-btn is-scan" onClick={retryScan} disabled={scanBusy}>
                {scanBusy ? "Scanning…" : "Try the scan again"}
              </button>
              <button type="button" className="v8-states-ghost is-action" onClick={emailWebPerson}>
                Email these steps to my web person
              </button>
            </div>
            {scanNote || emailNote ? <p className="v8-states-note">{scanNote || emailNote}</p> : null}
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
