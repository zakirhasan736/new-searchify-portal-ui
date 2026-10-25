"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getSiteScan,
  researchAudit,
  listChanges,
  changePath,
  loadFeature,
  featurePayload,
} from "@/lib/v1Api";
import { activeSiteContext } from "@/lib/siteContext";
import { loadJourney } from "@/lib/journey";
import { SkeletonRows } from "@/components/v8/SkeletonWave";
import "@/styles/v8-screens.css";

const DEFS = [
  {
    n: 1,
    q: "POOR",
    name: "Found",
    line: "Google can reach and read the page.",
    detail: "No broken links, the page is in the sitemap and Google has indexed it.",
  },
  {
    n: 2,
    q: "FAIR",
    name: "Click-worthy",
    line: "What people see in Google makes them click.",
    detail: "The title and description match what people actually search for: city, service, urgency.",
  },
  {
    n: 3,
    q: "GOOD",
    name: "Fresh",
    line: "The content stays ahead of newer pages.",
    detail: "Searchify watches for decline and drafts the update before the drop gets expensive.",
  },
  {
    n: 4,
    q: "STRONG",
    name: "Connected",
    line: "Other pages point here.",
    detail: "Internal links send the attention your blog earns to the pages that bring in calls.",
  },
  {
    n: 5,
    q: "GREAT",
    name: "Amplified",
    line: "The page gets seen beyond Google.",
    detail: "Improvements are shared where your customers already are.",
  },
  {
    n: 6,
    q: "EXCELLENT",
    name: "Cited",
    line: "AI assistants name you in their answers.",
    detail: "ChatGPT, Perplexity and Google AI Overviews mention this page when customers ask.",
  },
];

const QCOL = ["#FF5A4E", "#FF9F43", "#FFC53D", "#3DDC84", "#2CC7C0", "#4DA3FF"];

function pathFromUrl(url) {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return url && String(url).startsWith("/") ? String(url) : "/";
  }
}

function levelFromStats({ critical, warning, notice }, siteScore, { locked = false } = {}) {
  if (locked && critical === 0) return 7;
  if (critical > 0) return 1;
  if (warning > 0) return 2;
  if (notice > 0) return 3;
  if (typeof siteScore === "number") {
    if (siteScore >= 90) return 6;
    if (siteScore >= 80) return 5;
    if (siteScore >= 70) return 4;
    if (siteScore >= 60) return 3;
  }
  return 2;
}

function bump(map, path, key) {
  if (!path) return;
  const cur = map.get(path) || { critical: 0, warning: 0, notice: 0 };
  cur[key] += 1;
  map.set(path, cur);
}

function buildPagesFromApi({ scan, audit, changes, topPages, hostname }) {
  const report = audit?.state === "ready" ? audit.report : audit?.report || null;
  const statsByPath = new Map();

  if (report?.issues) {
    for (const issue of report.issues) {
      const sev = String(issue.severity || "Notice");
      const key = sev === "Critical" ? "critical" : sev === "Warning" ? "warning" : "notice";
      for (const pg of issue.pages || []) {
        bump(statsByPath, pathFromUrl(pg.url || ""), key);
      }
    }
  }

  for (const fail of scan?.failedPages || []) {
    bump(statsByPath, pathFromUrl(fail.url || ""), "critical");
  }

  const shippedByPath = new Map();
  const lockedPaths = new Set();
  const openByPath = new Map();
  const rows = Array.isArray(changes) ? changes : [];
  for (const c of rows) {
    const path = changePath(c);
    if (!path || path === "—") continue;
    if (["applied", "monitoring", "published_unverified", "closed"].includes(c.status)) {
      shippedByPath.set(path, (shippedByPath.get(path) || 0) + 1);
    }
    if (c.status === "monitoring" || c.status === "closed") lockedPaths.add(path);
    if (["proposed", "awaiting_approval", "approved", "failed", "needs_review"].includes(c.status)) {
      openByPath.set(path, (openByPath.get(path) || 0) + 1);
      if (!statsByPath.has(path)) {
        bump(statsByPath, path, c.status === "failed" || c.status === "needs_review" ? "warning" : "notice");
      }
    }
  }

  const tp = featurePayload(topPages);
  const pageRows = tp.rows || tp.pages || tp.items || [];
  for (const row of pageRows) {
    const raw = Array.isArray(row) ? row[0] : row?.url || row?.page || row?.path;
    const path = pathFromUrl(raw || "");
    if (path && path !== "/" && !statsByPath.has(path)) {
      statsByPath.set(path, { critical: 0, warning: 0, notice: 0 });
    }
  }

  const siteScoreRaw = report?.seoScore ?? report?.score ?? scan?.seoScore;
  const siteScore =
    typeof siteScoreRaw === "number"
      ? siteScoreRaw
      : Number(String(siteScoreRaw || "").replace(/[^\d.]/g, "")) || undefined;

  const criticalTotal =
    report?.criticalCount ??
    [...statsByPath.values()].reduce((s, x) => s + x.critical, 0);
  const warningTotal =
    report?.warningCount ??
    [...statsByPath.values()].reduce((s, x) => s + x.warning, 0);
  const noticeTotal =
    report?.noticeCount ??
    [...statsByPath.values()].reduce((s, x) => s + x.notice, 0);

  const siteMoves = Math.min(
    5,
    Math.max(shippedByPath.size, scan?.covered || 0, openByPath.size ? 5 - Math.min(5, openByPath.size) : 0),
  );
  const siteLevel = levelFromStats(
    { critical: criticalTotal, warning: warningTotal, notice: noticeTotal },
    siteScore,
  );

  const host = hostname || "your site";
  const pageList = [
    {
      id: "site",
      label: `Whole site · ${host}`,
      level: siteLevel,
      moves: siteMoves,
    },
  ];

  const paths = [...statsByPath.keys()].sort((a, b) => {
    const sa = statsByPath.get(a);
    const sb = statsByPath.get(b);
    const la = lockedPaths.has(a) ? 7 : 0;
    const lb = lockedPaths.has(b) ? 7 : 0;
    if (la !== lb) return lb - la;
    return sb.critical + sb.warning * 0.5 - (sa.critical + sa.warning * 0.5);
  });

  paths.slice(0, 12).forEach((path, idx) => {
    const stats = statsByPath.get(path) || { critical: 0, warning: 0, notice: 0 };
    const shipped = shippedByPath.get(path) || 0;
    const open = openByPath.get(path) || 0;
    pageList.push({
      id: `page-${idx}`,
      label: path,
      level: levelFromStats(stats, siteScore, { locked: lockedPaths.has(path) && open === 0 }),
      moves: Math.min(5, Math.max(shipped, lockedPaths.has(path) ? 5 : 0)),
    });
  });

  if (pageList.length === 1 && (scan?.pagesRead || scan?.draftable)) {
    pageList.push({
      id: "draftable",
      label: `${scan.pagesRead || scan.draftable} pages scanned`,
      level: Math.min(6, Math.max(1, Math.round((siteScore || 55) / 15))),
      moves: Math.min(5, scan.covered || 0),
    });
  }

  const hasSignal =
    statsByPath.size > 0 ||
    shippedByPath.size > 0 ||
    scan?.pagesRead ||
    report ||
    rows.length > 0;
  return hasSignal ? pageList : [];
}

export default function PathScreen() {
  const [pageId, setPageId] = useState("site");
  const [sel, setSel] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { hostname } = activeSiteContext(loadJourney());

  useEffect(() => {
    const { href } = activeSiteContext(loadJourney());
    const site = href || "";
    let cancel = false;
    setLoading(true);

    Promise.all([
      site ? getSiteScan(site).catch(() => ({ ok: false })) : Promise.resolve({ ok: false }),
      site ? researchAudit({ site, force: false }).catch(() => ({ ok: false })) : Promise.resolve({ ok: false }),
      listChanges({ force: true }).catch(() => ({ ok: false, data: [] })),
      loadFeature("site-audit").catch(() => ({ ok: false })),
      loadFeature("top-pages").catch(() => ({ ok: false })),
    ])
      .then(([scanRes, auditRes, changeRes, featureAudit, topPages]) => {
        if (cancel) return;
        const scan = scanRes.ok ? scanRes.data?.scan || scanRes.data : null;
        const auditFromResearch = auditRes.ok ? auditRes.data : null;
        const auditFromFeature =
          featureAudit?.ok !== false && featureAudit?.state
            ? featureAudit
            : featureAudit?.data || null;
        const audit = auditFromResearch || auditFromFeature;
        const changes = Array.isArray(changeRes.data) ? changeRes.data : changeRes.data?.changes || [];
        const built = buildPagesFromApi({
          scan,
          audit,
          changes,
          topPages,
          hostname: hostname || activeSiteContext(loadJourney()).hostname,
        });
        setPages(built);
        if (built.length) {
          setPageId((prev) => (built.some((p) => p.id === prev) ? prev : built[0].id));
        }
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });

    return () => {
      cancel = true;
    };
  }, [hostname]);

  const page = pages.find((p) => p.id === pageId) || pages[0];
  const empty = !page;
  const complete = !empty && page.level > 6;
  const pageLevel = empty ? 1 : page.level;
  const pageMoves = empty ? 0 : page.moves;
  const pageLabel = !page || page.id === "site" ? "the site" : "this page";

  const levels = DEFS.map((d, idx) => {
    const state = complete ? "done" : d.n < pageLevel ? "done" : d.n === pageLevel ? "current" : "locked";
    const selected = (sel || (complete ? 6 : pageLevel)) === d.n;
    return {
      ...d,
      n: String(d.n),
      quality: d.q,
      qualityColor: QCOL[idx],
      isDone: state === "done",
      isCurrent: state === "current",
      isLocked: state === "locked",
      status: complete ? "COMPLETE" : { done: "DONE", current: "IN PROGRESS", locked: "NEXT" }[state],
      doneColor: complete ? "#4DA3FF" : "#3DDC84",
      doneGlow: complete ? "rgba(77,163,255,.6)" : "rgba(61,220,132,.35)",
      lineColor: complete ? "#4DA3FF" : state === "done" ? "#3DDC84" : "#262A31",
      hasLine: idx < DEFS.length - 1,
      selectedStr: String(selected),
      pick: () => setSel(d.n),
    };
  });

  const selN = sel || (complete ? 6 : pageLevel);
  const selectedLevel = levels[selN - 1] || levels[0];
  const moveSlots = [0, 1, 2, 3, 4].map((i) => ({ color: i < pageMoves ? "#3DDC84" : "#262A31" }));

  const pageOptions = pages.map((p) => ({
    id: p.id,
    label:
      p.label +
      " — " +
      (p.level > 6
        ? "Excellent, locked"
        : "Level " +
          p.level +
          " · " +
          DEFS[Math.min(5, Math.max(0, p.level - 1))].q.charAt(0) +
          DEFS[Math.min(5, Math.max(0, p.level - 1))].q.slice(1).toLowerCase()),
  }));

  return (
    <div
      style={{
        flex: "999 1 560px",
        minWidth: 0,
        minHeight: 1100,
        background: "#0A0B0D",
        color: "#F2F4F5",
        fontFamily: "Geist, 'Helvetica Neue', sans-serif",
        boxSizing: "border-box",
        padding: "28px clamp(16px, 4vw, 56px) 56px",
        display: "flex",
        flexDirection: "column",
        gap: "32px",
      }}
    >
      <div
        style={{
          maxWidth: "1120px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
              fontSize: "clamp(34px, 4vw, 48px)",
              lineHeight: 1,
              letterSpacing: "-1.4px",
              fontWeight: 700,
              overflowWrap: "break-word",
            }}
          >
            Page progress
          </h1>
          <p style={{ margin: 0, fontSize: "16px", color: "#9AA1AB", maxWidth: "560px", lineHeight: 1.5 }}>
            Every page climbs the same six levels, from Poor to Excellent. When a page reaches Excellent,
            its lights turn blue and Searchify locks it.
          </p>
        </div>
        {!empty && (
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "13px",
              color: "#9AA1AB",
              minWidth: "280px",
            }}
          >
            Show progress for
            <select
              value={pageId}
              onChange={(e) => {
                setPageId(e.target.value);
                setSel(null);
              }}
              style={{
                minHeight: "48px",
                padding: "0 14px",
                borderRadius: "12px",
                border: "1px solid #4DA3FF",
                background: "#131519",
                color: "#F2F4F5",
                font: "inherit",
                fontSize: "15px",
                boxShadow: "0 0 18px rgba(77,163,255,.2)",
              }}
            >
              {pageOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {loading ? <SkeletonRows count={6} /> : null}
      {!loading && empty && (
        <div
          style={{
            maxWidth: "1120px",
            width: "100%",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "12px",
            padding: "14px 16px",
            borderRadius: "14px",
            border: "1px solid #262A31",
            background: "#131519",
            fontSize: "14px",
            color: "#D7DADE",
          }}
        >
          <span style={{ flex: "1 1 240px" }}>
            {`No page progress yet. Run a site scan to see levels for ${hostname || "your site"}.`}
          </span>
          {empty && (
            <Link
              href="/app/results"
              style={{
                minHeight: "40px",
                padding: "0 16px",
                borderRadius: "999px",
                background: "#4DA3FF",
                color: "#0A0B0D",
                textDecoration: "none",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Run site scan
            </Link>
          )}
        </div>
      )}

      {complete && (
        <div
          style={{
            maxWidth: "1120px",
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 18px",
            borderRadius: "16px",
            border: "1px solid #4DA3FF",
            background: "rgba(77,163,255,.08)",
            boxShadow: "0 0 26px rgba(77,163,255,.2)",
            animation: "sfy-rise .3s ease both",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4DA3FF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="5" y="11" width="14" height="10" rx="2"></rect>
            <path d="M8 11V8a4 4 0 0 1 8 0v3"></path>
          </svg>
          <span style={{ fontSize: "15px" }}>
            All six levels done. This page is winning, so Searchify has locked it and won&apos;t change it.
          </span>
        </div>
      )}

      <div
        style={{
          maxWidth: "1120px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: "40px",
          alignItems: "flex-start",
        }}
      >
        <ol
          aria-label="Levels"
          style={{
            flex: "1 1 380px",
            minWidth: 0,
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {levels.map((l) => (
            <li key={l.n} style={{ display: "flex", gap: "20px", alignItems: "stretch" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "52px",
                  flex: "none",
                }}
              >
                {l.isDone && (
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      background: l.doneColor,
                      boxShadow: `0 0 16px ${l.doneGlow}`,
                      color: "#0A0B0D",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12l5 5L20 7"></path>
                    </svg>
                  </div>
                )}
                {l.isCurrent && (
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      border: "3px solid #3DDC84",
                      boxSizing: "border-box",
                      display: "grid",
                      placeItems: "center",
                      boxShadow: "0 0 24px rgba(61,220,132,.7)",
                      fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                      fontWeight: 800,
                      fontSize: "20px",
                      color: "#3DDC84",
                      animation: "sfy-breathe 2.4s ease-in-out infinite",
                    }}
                  >
                    {l.n}
                  </div>
                )}
                {l.isLocked && (
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      background: "#131519",
                      border: "1px solid #262A31",
                      boxSizing: "border-box",
                      display: "grid",
                      placeItems: "center",
                      color: "#7D848E",
                    }}
                  >
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="5" y="11" width="14" height="10" rx="2"></rect>
                      <path d="M8 11V8a4 4 0 0 1 8 0v3"></path>
                    </svg>
                  </div>
                )}
                {l.hasLine && (
                  <div
                    style={{
                      flex: 1,
                      width: "2px",
                      minHeight: "28px",
                      background: l.lineColor,
                    }}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={l.pick}
                aria-pressed={l.selectedStr}
                style={{
                  flex: 1,
                  textAlign: "left",
                  background: "transparent",
                  border: 0,
                  color: "#F2F4F5",
                  padding: "4px 0 26px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                  minHeight: "52px",
                  opacity: l.selectedStr === "true" ? 1 : 0.92,
                }}
              >
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px", color: l.qualityColor }}>
                  LEVEL {l.n} · {l.quality}
                </span>
                <span
                  style={{
                    fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                    fontSize: "24px",
                    fontWeight: 700,
                    letterSpacing: "-0.5px",
                  }}
                >
                  {l.name}
                </span>
                <span style={{ fontSize: "14px", color: "#9AA1AB", lineHeight: 1.45 }}>{l.line}</span>
              </button>
            </li>
          ))}
        </ol>

        <aside
          aria-live="polite"
          style={{
            flex: "1 1 360px",
            minWidth: 0,
            background: "#131519",
            border: "1px solid #262A31",
            borderRadius: "24px",
            padding: "clamp(22px, 3vw, 30px)",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <span
            style={{
              fontFamily: "'Geist Mono', monospace",
              fontSize: "12px",
              color: selectedLevel.qualityColor,
            }}
          >
            LEVEL {selectedLevel.n} · {selectedLevel.quality} · {selectedLevel.status}
          </span>
          <h2
            style={{
              margin: 0,
              fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
              fontSize: "32px",
              lineHeight: 1,
              letterSpacing: "-1px",
              fontWeight: 700,
              minWidth: 0,
              overflowWrap: "break-word",
            }}
          >
            {selectedLevel.name}
          </h2>
          <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.55, color: "#D7DADE" }}>
            {selectedLevel.detail}
          </p>
          {selectedLevel.isCurrent && !empty && (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    color: "#9AA1AB",
                  }}
                >
                  <span>
                    {pageMoves} of 5 moves done on {pageLabel}
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                    gap: "4px",
                  }}
                >
                  {moveSlots.map((s, i) => (
                    <div key={i} style={{ height: "8px", borderRadius: "4px", background: s.color }} />
                  ))}
                </div>
              </div>
              <Link
                href="/app"
                style={{
                  alignSelf: "flex-start",
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: "48px",
                  padding: "0 20px",
                  borderRadius: "13px",
                  background: "#4DA3FF",
                  color: "#0A0B0D",
                  textDecoration: "none",
                  fontSize: "15px",
                  fontWeight: 600,
                  boxShadow: "0 0 22px rgba(77,163,255,.45)",
                }}
              >
                Do the next move
              </Link>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
