"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  researchKeywords,
  trackKeyword,
  untrackKeyword,
  approveChange,
  executeChange,
  runSiteScan,
  getSiteScan,
  listChanges,
  changePath,
  historyItems,
  errorText,
} from "@/lib/v1Api";
import { activeSiteContext } from "@/lib/siteContext";
import { loadJourney } from "@/lib/journey";
import { SkeletonCards } from "@/components/v8/SkeletonWave";
import ProblemNotice from "@/components/v8/ProblemNotice";
import { problemsFrom } from "@/lib/problems";
import "@/styles/v8-screens.css";

const SPOT_TIP =
  "Your spot on Google is the average position for this search. #1 is the top result — a smaller number is better. Search Console updates it as people search.";

function formatWinDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).replace(",", "").toUpperCase();
}

function daysSince(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

function rankLabel(n) {
  if (n == null || n === "" || Number.isNaN(Number(n))) return "—";
  return `#${Math.round(Number(n))}`;
}

function pctLabel(n) {
  if (n == null || n === "" || Number.isNaN(Number(n))) return "—";
  const v = Number(n);
  const pct = v <= 1 ? v * 100 : v;
  return `${pct.toFixed(1)}%`;
}

function pathFrom(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("/")) return raw.split("?")[0] || "/";
  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`).pathname || "/";
  } catch {
    return raw.startsWith("/") ? raw : "";
  }
}

function collectScanPages(payload) {
  const root = payload?.scan || payload || {};
  const rows = [];
  const push = (path, title) => {
    const clean = pathFrom(path);
    if (!clean) return;
    rows.push({ path: clean, title: String(title || clean).trim() || clean });
  };
  (root.pages || []).forEach((page) => {
    if (typeof page === "string") push(page, page);
    else if (page && typeof page === "object") push(page.url || page.path, page.title || page.h1 || page.path);
  });
  (root.dots || []).forEach((dot) => push(dot?.path, dot?.title || dot?.path));
  (root.findings || []).forEach((item) => push(item?.path, item?.title || item?.path));
  return rows;
}

function normalizeResearchRow(row) {
  if (!row || typeof row !== "object") return null;
  const keyword = String(row.keyword || row.term || row.query || "").trim();
  if (!keyword) return null;
  return {
    keyword,
    page: row.page || (row.url ? changePath({ targetUrl: row.url }) : "/"),
    url: row.url || "",
    position: row.position ?? row.rank ?? row.pos ?? null,
    previous: row.previous ?? row.prevPosition ?? row.prev ?? null,
    volume: row.volume ?? row.searchVolume ?? null,
    clicks: row.clicks ?? null,
    impressions: row.impressions ?? null,
    ctr: row.ctr ?? row.clickThroughRate ?? null,
    measuring: Boolean(row.measuring),
    isNew: Boolean(row.isNew),
  };
}

function keywordId(term) {
  return `kw-${String(term || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}`;
}

// A tracked keyword as the backend stores it: DataForSEO numbers + the page update it started.
function normalizeTracked(row) {
  const base = normalizeResearchRow(row);
  if (!base) return null;
  return {
    ...base,
    page: pathFrom(row.page || row.url) || "/",
    change: row.change || null,
    concept: row.concept || "",
    trackedSource: row.trackedSource || "",
    measuring: base.position == null,
  };
}

const OPEN_CHANGE = new Set(["proposed", "awaiting_approval", "approved", "failed", "needs_review"]);

function fmtNum(n) {
  if (n == null || n === "" || Number.isNaN(Number(n))) return "—";
  return Math.round(Number(n)).toLocaleString("en-US");
}

function keywordStatus(row, appliedAt) {
  const pos = row.position;
  const prev = row.previous;
  const age = daysSince(appliedAt);
  if (pos != null && prev != null) {
    if (Number(pos) < Number(prev)) return "worked";
    if (Number(pos) > Number(prev)) return "dropped";
    if (age != null && age < 28) return "measuring";
    return "flat";
  }
  if (row.measuring || row.isNew || (age != null && age < 28) || (pos != null && prev == null)) {
    return "measuring";
  }
  return "flat";
}

function rankNarrative(row, status) {
  const pos = row.position;
  const prev = row.previous;
  if (status === "measuring") {
    return pos != null
      ? `You are #${Math.round(Number(pos))} on Google so far. Full results need about four weeks of data.`
      : "Rank data is still filling in from Search Console and live keyword reads.";
  }
  if (status === "worked" && pos != null && prev != null) {
    const delta = Math.round(Number(prev) - Number(pos));
    return `You used to be #${Math.round(Number(prev))} on Google. Now you are #${Math.round(Number(pos))} — up ${delta} spot${delta === 1 ? "" : "s"}.`;
  }
  if (status === "dropped" && pos != null && prev != null) {
    const delta = Math.round(Number(pos) - Number(prev));
    return `You slipped from #${Math.round(Number(prev))} to #${Math.round(Number(pos))} — down ${delta} spot${delta === 1 ? "" : "s"}. A fix may already be queued.`;
  }
  if (pos != null) return `Still #${Math.round(Number(pos))} — no clear movement yet for this keyword.`;
  return "No clear rank movement yet for this keyword.";
}

function measuringBadge(appliedAt) {
  const day = Math.min(28, Math.max(1, (daysSince(appliedAt) ?? 0) + 1));
  return `MEASURING · DAY ${day} OF 28`;
}

function mapKeywordRow(row, idx, changeByPath) {
  const term = row.keyword;
  const page = row.page || "/";
  const own = row.change;
  const change = own
    ? {
        id: own.id,
        status: own.status,
        appliedAt: own.appliedAt,
        updatedAt: own.updatedAt,
        proposed: {
          title: own.title,
          metaDescription: own.metaDescription,
          beforeTitle: own.beforeTitle,
          beforeMetaDescription: own.beforeDescription,
        },
      }
    : changeByPath.get(page);
  const p = change?.proposed || {};
  const appliedAt = change?.appliedAt || null;
  const status = keywordStatus(row, appliedAt || change?.updatedAt);
  const was = p.beforeTitle || p.liveTitle || p.beforeMetaDescription || "(Live page before changes)";
  const now = p.title || p.metaDescription || row.url || "(No page update yet)";
  const date = change ? formatWinDate(appliedAt || change.updatedAt) : "—";
  const pos = row.position;
  const prev = row.previous;
  const clicks = row.clicks != null ? Number(row.clicks) : null;
  const ctr = row.ctr;
  const rankNow = rankLabel(pos);
  const rankWas = prev != null ? rankLabel(prev) : "—";
  // Only real numbers: Search Console clicks/CTR and DataForSEO ranks. No estimates are filled in.
  const visitorsNow = clicks != null ? String(Math.round(clicks)) : "—";
  const rateNow = pctLabel(typeof ctr === "string" ? parseFloat(ctr) : ctr);

  const ST_BADGE =
    status === "measuring"
      ? measuringBadge(appliedAt || change?.updatedAt)
      : status === "worked"
        ? "IT WORKED"
        : status === "dropped"
          ? "WENT DOWN · FIX READY"
          : "NO CLEAR EFFECT YET";

  return {
    id: keywordId(term),
    term,
    page,
    date,
    status,
    badge: ST_BADGE,
    was,
    now,
    concept: row.concept || "",
    volume: row.volume,
    change: change && change.id ? { id: change.id, status: change.status } : null,
    m: {
      rank: [rankWas, rankNow, rankNarrative({ ...row, position: pos, previous: prev }, status)],
      visitors: [
        "—",
        visitorsNow,
        visitorsNow !== "—"
          ? "Clicks from this search in the last 28 days (Search Console)."
          : "Connect Search Console for real click totals on this search.",
      ],
      leads: ["—", "—", "Calls and form fills need Google Analytics conversions for this search."],
      rate: [
        "—",
        rateNow,
        rateNow !== "—"
          ? "Click-through rate from Search Console for this query."
          : "Click rate comes from Search Console once enough impressions are logged.",
      ],
    },
  };
}

function SpotTip({ tipId, open, onToggle, tipRef }) {
  return (
    <span ref={tipRef} className="v8-path-tip">
      <button
        type="button"
        className="v8-path-tip-btn"
        aria-label="What is a spot on Google?"
        aria-expanded={open}
        aria-controls={tipId}
        onClick={onToggle}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
          <path d="M12 11v7" />
          <path d="M12 6.5h.01" />
        </svg>
      </button>
      {open ? (
        <span className="v8-path-tip-pop" id={tipId} role="dialog" aria-label="What is a spot on Google?">
          <span className="v8-path-tip-card">
            <span>{SPOT_TIP}</span>
            <a href="https://searchify.io/help/keyword-tracker" target="_blank" rel="noreferrer">
              Learn more
            </a>
          </span>
        </span>
      ) : null}
    </span>
  );
}

export default function WinScreen() {
  const listTipRef = useRef(null);
  const metricTipRef = useRef(null);
  const [selId, setSelId] = useState("");
  const [metric, setMetric] = useState("rank");
  const [K, setK] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addTerm, setAddTerm] = useState("");
  const [tracking, setTracking] = useState("");
  const [current, setCurrent] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestMeta, setSuggestMeta] = useState(null);
  const [business, setBusiness] = useState(null);
  const [scConnected, setScConnected] = useState(false);
  const [trackNote, setTrackNote] = useState("");
  const [publishing, setPublishing] = useState(0);
  const [reading, setReading] = useState(false);
  const [sitePages, setSitePages] = useState([]);
  const [pageNote, setPageNote] = useState("");
  const [problems, setProblems] = useState([]);
  const [listTipOpen, setListTipOpen] = useState(false);
  const [metricTipOpen, setMetricTipOpen] = useState(false);
  const { hostname, href } = activeSiteContext(loadJourney());

  useEffect(() => {
    if (!listTipOpen && !metricTipOpen) return undefined;
    const onDoc = (event) => {
      if (listTipOpen && !listTipRef.current?.contains(event.target)) setListTipOpen(false);
      if (metricTipOpen && !metricTipRef.current?.contains(event.target)) setMetricTipOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        setListTipOpen(false);
        setMetricTipOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [listTipOpen, metricTipOpen]);

  const rebuild = useCallback(async ({ force = false } = {}) => {
    const site = href || activeSiteContext(loadJourney()).href || "";
    setLoading(true);
    try {
      const [kwRes, changeRes, scanRes] = await Promise.all([
        site ? researchKeywords({ site, force }).catch(() => ({ ok: false })) : Promise.resolve({ ok: false }),
        listChanges({ force: true }).catch(() => ({ ok: false, data: [] })),
        site ? getSiteScan(site).catch(() => ({ ok: false })) : Promise.resolve({ ok: false }),
      ]);
      setProblems(site ? problemsFrom(kwRes, "keywords") : []);
      const scan = scanRes?.ok ? scanRes.data?.scan || scanRes.data || {} : {};
      setSitePages(scanRes?.ok ? collectScanPages(scanRes.data) : []);
      setBusiness(scan.business && (scan.business.category || scan.business.business) ? { ...scan.business, error: scan.understandError || "" } : scan.understandError ? { error: scan.understandError } : null);

      let data = {};
      if (kwRes?.ok) {
        data = kwRes.data || {};
        setPageNote("");
      } else if (site) {
        // Live research failed: still show what is stored (tracked list is in the database).
        const stored = await researchKeywords({ site, storedOnly: true }).catch(() => null);
        data = stored?.ok ? stored.data || {} : {};
        setPageNote(errorText(kwRes, "Live keyword ranks could not be refreshed. Tracked keywords below use the last DataForSEO check."));
      } else {
        setPageNote("Add the website in setup so Searchify can track keywords for it.");
      }

      setCurrent(Array.isArray(data.current) ? data.current : []);
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      setSuggestMeta(data.suggestionMeta || null);
      setScConnected(Boolean(data.searchConsoleConnected));

      const changes = Array.isArray(changeRes?.data) ? changeRes.data : changeRes?.data?.changes || [];
      const changeByPath = new Map();
      historyItems(changes).forEach((c) => {
        const path = changePath(c);
        if (path && path !== "—" && !changeByPath.has(path)) changeByPath.set(path, c);
      });

      const rows = (data.trackedList || []).map(normalizeTracked).filter(Boolean);
      const mapped = rows.map((row, idx) => mapKeywordRow(row, idx, changeByPath));
      setK(mapped);
      setSelId((prev) => (mapped.some((m) => m.id === prev) ? prev : mapped[0]?.id || ""));
    } catch {
      setPageNote("Keyword tracking could not be loaded. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, [href]);

  useEffect(() => {
    rebuild();
  }, [rebuild, hostname]);

  // Track = save on the server + (apply) write a new title/description for the page, waiting for approval.
  const handleTrack = async (raw, extra = {}) => {
    const term = String(raw ?? addTerm).trim();
    if (!term || tracking) return;
    if (!href) {
      setPageNote("Add the website in setup so Searchify can track keywords for it.");
      return;
    }
    setTracking(term.toLowerCase());
    setTrackNote("");
    const res = await trackKeyword({
      site: href,
      keyword: term,
      page: extra.page || "",
      concept: extra.concept || "",
      source: extra.source || "manual",
      apply: extra.apply !== false,
    }).catch(() => ({ ok: false }));
    if (!res?.ok) {
      setProblems(problemsFrom(res, "keywords"));
      setTrackNote(errorText(res, "The keyword could not be tracked. Try again."));
      setTracking("");
      return;
    }
    if (raw == null) setAddTerm("");
    const d = res.data || {};
    const parts = [];
    if (d.change?.id) parts.push(`A new title and description for ${pathFrom(d.change.targetUrl || d.change.target_url || "") || "the page"} is waiting for your approval.`);
    if (d.note) parts.push(d.note);
    (d.warnings || []).forEach((w) => parts.push(w));
    setTrackNote(parts.join(" "));
    await rebuild();
    setSelId(keywordId(d.keyword || term));
    setTracking("");
  };

  const handleUntrack = async (term) => {
    if (!href || !term) return;
    await untrackKeyword({ site: href, keyword: term }).catch(() => null);
    setTrackNote(`Stopped tracking “${term}”.`);
    await rebuild();
  };

  // Approve the exact text shown, then publish it to the connected website (WordPress, Shopify, Webflow…).
  const handlePublish = async (change) => {
    if (!change?.id || publishing) return;
    setPublishing(change.id);
    setTrackNote("");
    if (change.status !== "approved") {
      const ok = await approveChange(change.id).catch(() => ({ ok: false }));
      if (!ok?.ok) {
        setTrackNote(errorText(ok, "This update could not be approved."));
        setPublishing(0);
        return;
      }
    }
    const done = await executeChange(change.id).catch(() => ({ ok: false }));
    setTrackNote(
      done?.ok
        ? "Published to your website. Searchify now measures this keyword's spot on Google."
        : errorText(done, "Publishing failed. Connect WordPress, Shopify, or Webflow in Connections, then try again."),
    );
    await rebuild();
    setPublishing(0);
  };

  const handleReadSite = async () => {
    if (!href || reading) return;
    setReading(true);
    const res = await runSiteScan({ site: href, force: true }).catch(() => ({ ok: false }));
    if (!res?.ok) setTrackNote(errorText(res, "The website could not be read. Try again."));
    await rebuild({ force: true });
    setReading(false);
  };

  const summary = useMemo(() => {
    let up = 0;
    let flat = 0;
    let down = 0;
    let measuring = 0;
    K.forEach((row) => {
      if (row.status === "worked") up += 1;
      else if (row.status === "dropped") down += 1;
      else if (row.status === "measuring") measuring += 1;
      else flat += 1;
    });
    return { up, flat, down, measuring };
  }, [K]);

  const ST = {
    worked: {
      dot: "#3DDC84",
      text: "#0A0B0D",
      bg: "#3DDC84",
      border: "#3DDC84",
      arrow: "#3DDC84",
      after: "#3DDC84",
    },
    measuring: {
      dot: "#4DA3FF",
      text: "#4DA3FF",
      bg: "rgba(77,163,255,.1)",
      border: "rgba(77,163,255,.5)",
      arrow: "#4DA3FF",
      after: "#F2F4F5",
    },
    flat: {
      dot: "#9AA1AB",
      text: "#D7DADE",
      bg: "#1A1D22",
      border: "#262A31",
      arrow: "#9AA1AB",
      after: "#F2F4F5",
    },
    dropped: {
      dot: "#FF5A4E",
      text: "#FF5A4E",
      bg: "rgba(255,90,78,.1)",
      border: "rgba(255,90,78,.5)",
      arrow: "#FF5A4E",
      after: "#FF5A4E",
    },
  };

  const cur = K.find((x) => x.id === selId) || K[0];
  const empty = !cur;
  const similarPages = useMemo(() => {
    const current = pathFrom(cur?.page || "");
    const seen = new Set();
    const rows = [];
    const add = (path, title) => {
      const clean = pathFrom(path);
      if (!clean || clean === current || seen.has(clean)) return;
      seen.add(clean);
      rows.push({ path: clean, title: String(title || clean).trim() || clean });
    };
    sitePages.forEach((page) => add(page.path, page.title));
    K.forEach((row) => add(row.page, row.page));
    return rows;
  }, [sitePages, K, cur]);
  const sc = empty ? ST.flat : ST[cur.status];

  const moveOf = (x) => {
    const b = parseInt(String(x.m.rank[0]).replace("#", ""), 10);
    const a = parseInt(String(x.m.rank[1]).replace("#", ""), 10);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return { t: "—", c: "#9AA1AB", bg: "#1A1D22", n: 0, w: "no change" };
    if (a < b)
      return {
        t: "▲ up " + (b - a),
        c: "#3DDC84",
        bg: "rgba(61,220,132,.12)",
        n: b - a,
        w: "up " + (b - a) + (b - a === 1 ? " spot" : " spots"),
      };
    if (a > b)
      return {
        t: "▼ down " + (a - b),
        c: "#FF5A4E",
        bg: "rgba(255,90,78,.12)",
        n: a - b,
        w: "down " + (a - b) + (a - b === 1 ? " spot" : " spots"),
      };
    return { t: "no change", c: "#9AA1AB", bg: "#1A1D22", n: 0, w: "no change" };
  };

  const list = K.map((x) => {
    const mv = moveOf(x);
    return {
      ...x,
      nowRank: x.m.rank[1],
      wasRank: x.m.rank[0],
      move: mv.t,
      moveColor: mv.c,
      moveBg: mv.bg,
      aria: x.term + ": now " + x.m.rank[1] + " on Google, was " + x.m.rank[0] + ", " + mv.w,
      on: x.id === cur?.id,
      off: x.id !== cur?.id,
      dot: ST[x.status].dot,
    };
  });

  const headline = empty
    ? "No keywords tracked yet."
    : cur.status === "worked"
      ? `"${cur.term}" is bringing in more customers.`
      : cur.status === "measuring"
        ? `Too early to call "${cur.term}".`
        : cur.status === "dropped"
          ? `"${cur.term}" slipped. A fix is ready.`
          : `"${cur.term}" hasn't moved yet.`;

  const MLAB = { rank: "Spot on Google", visitors: "Visitors", leads: "Calls & leads", rate: "Click rate" };
  const SRC = {
    rank: "From Search Console · your average spot on Google for this search (#1 is the top result)",
    visitors: "From Search Console · clicks from this search",
    leads: "From Analytics · calls and form fills from this search",
    rate: "From Search Console · clicks ÷ times shown",
  };

  const mv = empty
    ? ["—", "—", "Connect Search Console or run keyword research to start tracking."]
    : cur.m[metric];

  const metrics = ["rank", "visitors", "leads", "rate"].map((id) => ({
    id,
    label: MLAB[id],
    on: id === metric,
    off: id !== metric,
  }));

  const beforeLabel = metric === "rank" ? "WHERE YOU WERE" : "4 WEEKS BEFORE";
  const afterLabel =
    metric === "rank"
      ? cur?.status === "measuring"
        ? "WHERE YOU ARE SO FAR"
        : "WHERE YOU ARE NOW"
      : cur?.status === "measuring"
        ? "SO FAR"
        : "4 WEEKS AFTER";

  const trackedLabel = empty
    ? `No keywords tracked on ${hostname || "your site"} yet.`
    : `${K.length} keywords tracked on ${hostname} · ${summary.up} up · ${summary.flat} flat · ${summary.down} down · ${summary.measuring} measuring`;

  const curMove = empty ? null : moveOf(cur);

  return (
    <div
      style={{
        flex: "999 1 560px",
        minWidth: 0,
        minHeight: 1000,
        background: "#0A0B0D",
        color: "#F2F4F5",
        fontFamily: "Geist, 'Helvetica Neue', sans-serif",
        boxSizing: "border-box",
        padding: "28px clamp(16px, 4vw, 48px) 56px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <header
        style={{
          maxWidth: "1120px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
              fontSize: "15px",
              fontWeight: "800",
              letterSpacing: "1.6px",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3DDC84"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 17l6-6 4 4 8-8"></path>
              <path d="M15 7h6v6"></path>
            </svg>
            KEYWORD TRACKER
          </span>
          <span style={{ fontSize: "15px", color: "#9AA1AB" }}>{loading ? "" : trackedLabel}</span>
        </div>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#9AA1AB", minWidth: "300px" }}>
          Keyword
          <select
            value={selId}
            onChange={(e) => setSelId(e.target.value)}
            disabled={!list.length}
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
              opacity: list.length ? 1 : 0.55,
            }}
          >
            {!list.length ? <option value="">Add a keyword to track</option> : null}
            {list.map((o) => (
              <option key={o.id} value={o.id}>
                {o.term}
              </option>
            ))}
          </select>
        </label>
      </header>

      <ProblemNotice problems={problems} onRetry={() => rebuild()} style={{ maxWidth: "1120px", width: "100%", margin: "0 auto" }} />

      {loading ? (
        <div style={{ maxWidth: "1120px", width: "100%", margin: "0 auto" }}>
          <SkeletonCards count={2} lines={4} />
        </div>
      ) : null}
      {trackNote ? (
        <p role="status" style={{ maxWidth: "1120px", width: "100%", margin: "0 auto", fontSize: 14, lineHeight: 1.45, color: "#4DA3FF" }}>
          {trackNote}
        </p>
      ) : null}
      {!loading && pageNote ? (
        <p style={{ maxWidth: "1120px", width: "100%", margin: "0 auto", fontSize: 14, lineHeight: 1.45, color: "#D7DADE" }}>
          {pageNote}
        </p>
      ) : null}

      {!loading ? (
        <div
          style={{
            maxWidth: "1120px",
            width: "100%",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            gap: "24px",
            alignItems: "flex-start",
          }}
        >
          <section
            aria-labelledby="list-h"
            style={{
              flex: "1 1 360px",
              minWidth: "0",
              borderRadius: "22px",
              background: "#101215",
              border: "1px solid #1A1D22",
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", margin: "10px 12px 6px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 id="list-h" style={{ margin: "0", fontSize: "14px", fontWeight: "600", color: "#D7DADE" }}>
                  Tracked keywords
                </h2>
                <SpotTip
                  tipId="tip-spot"
                  open={listTipOpen}
                  onToggle={() => {
                    setListTipOpen((v) => !v);
                    setMetricTipOpen(false);
                  }}
                  tipRef={listTipRef}
                />
              </span>
              <span style={{ fontSize: "12px", color: "#7D848E", lineHeight: "1.4" }}>
                Your spot on Google. <span style={{ color: "#D7DADE" }}>#1 is the top result</span> — a smaller number is
                better.
              </span>
            </div>
            <div
              aria-hidden="true"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "0 12px 6px",
                fontFamily: "'Geist Mono', monospace",
                fontSize: "10px",
                letterSpacing: ".5px",
                color: "#7D848E",
              }}
            >
              <span style={{ flex: "1" }}>KEYWORD</span>
              <span style={{ width: "54px", textAlign: "right" }}>SPOT</span>
              <span style={{ minWidth: "58px", textAlign: "center" }}>CHANGE</span>
            </div>
            <div
              style={{
                maxHeight: "452px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                paddingRight: "2px",
                scrollbarColor: "#262A31 transparent",
                scrollbarWidth: "thin",
              }}
            >
              {list.length === 0 ? (
                <p style={{ margin: 0, padding: "14px 12px", fontSize: 14, color: "#9AA1AB", lineHeight: 1.45 }}>
                  No keywords tracked yet. Pick one from “Suggested for your business” below, or add your own.
                </p>
              ) : null}
              {list.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  aria-pressed={k.on ? "true" : "false"}
                  onClick={() => setSelId(k.id)}
                  aria-label={k.aria}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    minHeight: "58px",
                    padding: "8px 12px",
                    borderRadius: "13px",
                    border: k.on ? "1px solid #4DA3FF" : "1px solid transparent",
                    background: k.on ? "rgba(77,163,255,.08)" : "transparent",
                    boxShadow: k.on ? "0 0 18px rgba(77,163,255,.2)" : "none",
                    color: "#F2F4F5",
                    textAlign: "left",
                    flex: "none",
                  }}
                >
                  <span
                    style={{
                      width: "9px",
                      height: "9px",
                      flex: "none",
                      borderRadius: "50%",
                      background: k.dot,
                      boxShadow: k.on ? `0 0 8px ${k.dot}` : "none",
                    }}
                  />
                  <span style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "14px", fontWeight: k.on ? "600" : "400", lineHeight: "1.25" }}>{k.term}</span>
                    <span
                      style={{
                        fontFamily: "'Geist Mono', monospace",
                        fontSize: "11px",
                        color: k.on ? "#9AA1AB" : "#7D848E",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {k.page}
                    </span>
                  </span>
                  <span style={{ flex: "none", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", width: "54px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                          fontSize: "20px",
                          fontWeight: "700",
                          lineHeight: "1",
                        }}
                      >
                        {k.nowRank}
                      </span>
                      <span style={{ fontSize: "11px", color: "#7D848E" }}>was {k.wasRank}</span>
                    </span>
                    <span
                      style={{
                        minWidth: "58px",
                        textAlign: "center",
                        fontSize: "11px",
                        fontWeight: "600",
                        padding: "4px 7px",
                        borderRadius: "8px",
                        color: k.moveColor,
                        background: k.moveBg,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {k.move}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <span style={{ padding: "8px 12px 0", fontSize: "12px", color: "#7D848E" }}>
              {list.length ? `Showing all ${K.length} · scroll for more` : "Track a keyword to start measuring"}
            </span>
            <div
              style={{
                display: "flex",
                gap: "8px",
                padding: "10px 6px 6px",
                borderTop: "1px solid #1A1D22",
                marginTop: "6px",
              }}
            >
              <label style={{ flex: "1", minWidth: "0", display: "flex" }}>
                <span style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                  Add a keyword
                </span>
                <input
                  type="text"
                  value={addTerm}
                  onChange={(e) => setAddTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleTrack();
                    }
                  }}
                  placeholder="Add a keyword to track"
                  style={{
                    flex: "1",
                    minWidth: "0",
                    minHeight: "44px",
                    padding: "0 12px",
                    borderRadius: "11px",
                    border: "1px solid #262A31",
                    background: "#0A0B0D",
                    color: "#F2F4F5",
                    font: "inherit",
                    fontSize: "14px",
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => handleTrack()}
                disabled={tracking || !addTerm.trim()}
                style={{
                  flex: "none",
                  minHeight: "44px",
                  padding: "0 14px",
                  borderRadius: "11px",
                  border: "0",
                  background: "#4DA3FF",
                  color: "#0A0B0D",
                  fontSize: "14px",
                  fontWeight: "600",
                  opacity: tracking || !addTerm.trim() ? 0.6 : 1,
                }}
              >
                {tracking ? "…" : "Track"}
              </button>
            </div>
          </section>

          <main
            style={{
              flex: "999 1 460px",
              minWidth: "0",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              animation: "sfy-rise .3s ease both",
            }}
          >
            {empty ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "8px 0" }}>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                    fontSize: "clamp(30px, 3.6vw, 46px)",
                    lineHeight: 1.04,
                    letterSpacing: "-1.3px",
                    fontWeight: 700,
                  }}
                >
                  No keywords tracked yet.
                </h1>
                <p style={{ margin: 0, fontSize: 16, color: "#9AA1AB", lineHeight: 1.5 }}>
                  Add a keyword on the left, or{" "}
                  <Link href="/app/connections" style={{ color: "#4DA3FF" }}>
                    plug in Search Console
                  </Link>{" "}
                  so Searchify can fill ranks automatically.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <span
                    style={{
                      alignSelf: "flex-start",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: sc.text,
                      background: sc.bg,
                      border: `1px solid ${sc.border}`,
                      padding: "6px 12px",
                      borderRadius: "999px",
                    }}
                  >
                    {cur.badge}
                  </span>
                  <h1
                    style={{
                      margin: "0",
                      fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                      fontSize: "clamp(30px, 3.6vw, 46px)",
                      lineHeight: "1.04",
                      letterSpacing: "-1.3px",
                      fontWeight: "700",
                      minWidth: 0,
                      overflowWrap: "break-word",
                    }}
                  >
                    {headline}
                  </h1>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ fontSize: "13px", color: "#9AA1AB" }}>
                      {cur.date !== "—" ? "What we changed on" : "Page for this keyword:"}{" "}
                      <span style={{ fontFamily: "'Geist Mono', monospace", color: "#D7DADE" }}>{cur.page}</span>
                      {cur.date !== "—" ? <> · {cur.date}</> : null}
                      {cur.concept ? <> · {cur.concept}</> : null} ·{" "}
                      <button
                        type="button"
                        onClick={() => handleUntrack(cur.term)}
                        style={{ border: 0, background: "none", padding: 0, color: "#7D848E", fontSize: "13px", textDecoration: "underline" }}
                      >
                        Stop tracking
                      </button>
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                      <div
                        style={{
                          borderRadius: "16px",
                          background: "#0E1013",
                          border: "1px solid #1A1D22",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <span style={{ fontSize: "12px", color: "#7D848E", fontFamily: "'Geist Mono', monospace" }}>BEFORE</span>
                        <span style={{ fontSize: "16px", lineHeight: "1.4", color: "#9AA1AB" }}>{cur.was}</span>
                      </div>
                      <div
                        style={{
                          borderRadius: "16px",
                          background: "rgba(77,163,255,.07)",
                          border: "1.5px solid #4DA3FF",
                          boxShadow: "0 0 26px rgba(77,163,255,.3), inset 0 0 18px rgba(77,163,255,.08)",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <span style={{ fontSize: "12px", color: "#4DA3FF", fontFamily: "'Geist Mono', monospace" }}>AFTER</span>
                        <span style={{ fontSize: "16px", lineHeight: "1.4" }}>{cur.now}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {cur.change && OPEN_CHANGE.has(cur.change.status) ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                      alignItems: "center",
                      borderRadius: "16px",
                      border: "1px solid rgba(77,163,255,.5)",
                      background: "rgba(77,163,255,.07)",
                      padding: "14px 16px",
                    }}
                  >
                    <span style={{ flex: "1 1 240px", fontSize: "14px", lineHeight: 1.45, color: "#D7DADE" }}>
                      {cur.change.status === "approved"
                        ? "Approved. Publish it to update the page on your website."
                        : cur.change.status === "failed"
                          ? "The last publish failed. Try again once the website connection works."
                          : `This new title and description targets “${cur.term}”. Approve it to update the page on your website.`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePublish(cur.change)}
                      disabled={Boolean(publishing)}
                      style={{
                        minHeight: "44px",
                        padding: "0 18px",
                        borderRadius: "11px",
                        border: "0",
                        background: "#4DA3FF",
                        color: "#0A0B0D",
                        fontSize: "14px",
                        fontWeight: "600",
                        opacity: publishing ? 0.6 : 1,
                      }}
                    >
                      {publishing === cur.change.id ? "Publishing…" : cur.change.status === "approved" ? "Publish to website" : "Approve and publish"}
                    </button>
                    <Link href="/app/queue" style={{ fontSize: "14px", color: "#4DA3FF" }}>
                      Edit first
                    </Link>
                  </div>
                ) : null}

                <section
                  aria-label="Result"
                  style={{
                    background: "#131519",
                    border: "1px solid #262A31",
                    borderRadius: "24px",
                    padding: "clamp(20px, 3vw, 30px)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "22px",
                  }}
                >
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                    <div role="group" aria-label="Choose a metric" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {metrics.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          aria-pressed={m.on ? "true" : "false"}
                          onClick={() => setMetric(m.id)}
                          style={{
                            minHeight: "40px",
                            padding: "0 15px",
                            borderRadius: "999px",
                            border: m.on ? "1px solid #F2F4F5" : "1px solid #262A31",
                            background: m.on ? "#F2F4F5" : "transparent",
                            color: m.on ? "#0A0B0D" : "#D7DADE",
                            fontSize: "14px",
                            fontWeight: m.on ? "600" : "400",
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                    <SpotTip
                      tipId="tip-metric"
                      open={metricTipOpen}
                      onToggle={() => {
                        setMetricTipOpen((v) => !v);
                        setListTipOpen(false);
                      }}
                      tipRef={metricTipRef}
                    />
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
                      gap: "16px",
                      alignItems: "end",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px", color: "#7D848E" }}>{beforeLabel}</span>
                      <span
                        style={{
                          fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                          fontSize: "clamp(44px, 6vw, 76px)",
                          lineHeight: "0.9",
                          letterSpacing: "-2px",
                          fontWeight: "700",
                          color: "#9AA1AB",
                        }}
                      >
                        {mv[0]}
                      </span>
                    </div>
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={sc.arrow}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      style={{ marginBottom: "12px" }}
                    >
                      <path d="M5 12h14"></path>
                      <path d="M13 6l6 6-6 6"></path>
                    </svg>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px", color: sc.arrow }}>{afterLabel}</span>
                      <span
                        style={{
                          fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                          fontSize: "clamp(44px, 6vw, 76px)",
                          lineHeight: "0.9",
                          letterSpacing: "-2px",
                          fontWeight: "800",
                          color: sc.after,
                        }}
                      >
                        {mv[1]}
                      </span>
                    </div>
                  </div>
                  {metric === "rank" && curMove ? (
                    <span
                      style={{
                        alignSelf: "flex-start",
                        fontSize: "15px",
                        fontWeight: "600",
                        padding: "7px 14px",
                        borderRadius: "999px",
                        color: curMove.c,
                        background: curMove.bg,
                      }}
                    >
                      {(curMove.n ? (curMove.c === "#3DDC84" ? "▲ " : "▼ ") : "") +
                        curMove.w.charAt(0).toUpperCase() +
                        curMove.w.slice(1) +
                        " on Google"}
                    </span>
                  ) : null}
                  <p style={{ margin: "0", fontSize: "18px", lineHeight: "1.45" }}>{mv[2]}</p>
                  <span style={{ fontSize: "13px", color: "#7D848E" }}>{SRC[metric]}</span>
                </section>

                {cur.status === "worked" ? (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <Link
                      href="/app"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        minHeight: "52px",
                        padding: "0 24px",
                        borderRadius: "13px",
                        background: "#4DA3FF",
                        color: "#0A0B0D",
                        fontSize: "15px",
                        fontWeight: "600",
                        textDecoration: "none",
                        boxShadow: "0 0 22px rgba(77,163,255,.45)",
                      }}
                    >
                      Do the same on {similarPages.length} similar page{similarPages.length === 1 ? "" : "s"}
                    </Link>
                    <span style={{ fontSize: "13px", color: "#9AA1AB" }}>Added to your total and this month&apos;s client report.</span>
                  </div>
                ) : null}
                {cur.status === "dropped" ? (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                    <Link
                      href="/app"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        minHeight: "52px",
                        padding: "0 24px",
                        borderRadius: "13px",
                        background: "#FF5A4E",
                        color: "#0A0B0D",
                        fontSize: "15px",
                        fontWeight: "600",
                        textDecoration: "none",
                      }}
                    >
                      Open today&apos;s moves
                    </Link>
                  </div>
                ) : null}
              </>
            )}
          </main>
        </div>
      ) : null}

      {!loading ? (
        <section aria-labelledby="sugg-h" style={PANEL}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
              <h2 id="sugg-h" style={H2}>
                Suggested for your business
              </h2>
              <span style={{ fontSize: "13px", color: "#9AA1AB", lineHeight: 1.45 }}>
                {business?.category
                  ? `DataForSEO searches that match what ${business.brand || hostname || "this site"} sells — ${business.category}.`
                  : "DataForSEO searches for this website."}{" "}
                {suggestMeta?.judged === "ai"
                  ? "Checked against the AI read of every page."
                  : suggestMeta?.judged === "words"
                    ? "Matched to your offers by wording (the AI check was not available)."
                    : ""}
              </span>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button type="button" onClick={() => rebuild({ force: true })} style={GHOST}>
                Refresh from DataForSEO
              </button>
              <button type="button" onClick={handleReadSite} disabled={reading} style={GHOST}>
                {reading ? "Reading website…" : "Re-read website"}
              </button>
            </div>
          </div>
          {business?.error ? <p style={{ margin: 0, fontSize: 14, color: "#FF5A4E" }}>{business.error}</p> : null}
          {suggestMeta?.needsSiteScan ? (
            <p style={{ margin: 0, fontSize: 14, color: "#D7DADE", lineHeight: 1.45 }}>
              The website has not been read yet, so these come straight from DataForSEO without a business check. Use “Re-read
              website” to match suggestions to what the business sells.
            </p>
          ) : null}
          {suggestions.length ? (
            <div style={{ overflowX: "auto" }}>
              <table style={TABLE}>
                <thead>
                  <tr style={{ color: "#7D848E", fontFamily: "'Geist Mono', monospace", fontSize: "11px", textAlign: "left" }}>
                    <th style={TH}>KEYWORD</th>
                    <th style={TH}>PART OF THE BUSINESS · PAGE</th>
                    <th style={{ ...TH, textAlign: "right" }}>SEARCHES/MO</th>
                    <th style={{ ...TH, textAlign: "right" }}>DIFFICULTY</th>
                    <th style={TH}></th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.slice(0, 40).map((row) => {
                    const busy = tracking === String(row.keyword).toLowerCase();
                    const page = pathFrom(row.page);
                    return (
                      <tr key={row.keyword} style={{ borderTop: "1px solid #1A1D22" }}>
                        <td style={TD}>
                          <span style={{ fontWeight: 600 }}>{row.keyword}</span>
                          {row.fit === "core" ? <span style={PILL}>core</span> : null}
                        </td>
                        <td style={{ ...TD, color: "#9AA1AB" }}>
                          {row.concept || "—"}
                          <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#7D848E" }}>
                            {page || "no page covers this yet"}
                          </div>
                        </td>
                        <td style={{ ...TD, textAlign: "right" }}>{fmtNum(row.volume)}</td>
                        <td style={{ ...TD, textAlign: "right" }}>{fmtNum(row.difficulty)}</td>
                        <td style={{ ...TD, whiteSpace: "nowrap", textAlign: "right" }}>
                          <button
                            type="button"
                            disabled={Boolean(tracking)}
                            onClick={() => handleTrack(row.keyword, { page: row.page, concept: row.concept, source: "suggestion", apply: Boolean(page) })}
                            style={{ ...PRIMARY, opacity: tracking ? 0.6 : 1 }}
                          >
                            {busy ? "Working…" : page ? "Track + update page" : "Track"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: "#9AA1AB" }}>
              {suggestMeta ? "No new business searches found beyond what you already track or rank for." : "Suggestions appear after the first DataForSEO check."}
            </p>
          )}
        </section>
      ) : null}

      {!loading ? (
        <section aria-labelledby="cur-h" style={PANEL}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <h2 id="cur-h" style={H2}>
              Current keywords
            </h2>
            <span style={{ fontSize: "13px", color: "#9AA1AB", lineHeight: 1.45 }}>
              Searches {hostname || "this site"} shows up for now. DataForSEO ranks first
              {scConnected ? ", with Search Console clicks added." : ". Connect Search Console to add real clicks and impressions."}
            </span>
          </div>
          {current.length ? (
            <div style={{ overflowX: "auto" }}>
              <table style={TABLE}>
                <thead>
                  <tr style={{ color: "#7D848E", fontFamily: "'Geist Mono', monospace", fontSize: "11px", textAlign: "left" }}>
                    <th style={TH}>KEYWORD</th>
                    <th style={{ ...TH, textAlign: "right" }}>SPOT</th>
                    <th style={{ ...TH, textAlign: "right" }}>SEARCHES/MO</th>
                    <th style={{ ...TH, textAlign: "right" }}>CLICKS</th>
                    <th style={TH}>SOURCE</th>
                    <th style={TH}></th>
                  </tr>
                </thead>
                <tbody>
                  {current.slice(0, 50).map((row) => {
                    const isTracked = K.some((k) => k.term.toLowerCase() === String(row.keyword).toLowerCase());
                    return (
                      <tr key={row.keyword} style={{ borderTop: "1px solid #1A1D22" }}>
                        <td style={TD}>
                          {row.keyword}
                          <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#7D848E" }}>{pathFrom(row.url) || ""}</div>
                        </td>
                        <td style={{ ...TD, textAlign: "right" }}>{rankLabel(row.position)}</td>
                        <td style={{ ...TD, textAlign: "right" }}>{fmtNum(row.volume)}</td>
                        <td style={{ ...TD, textAlign: "right" }}>{fmtNum(row.clicks)}</td>
                        <td style={{ ...TD, color: "#9AA1AB" }}>
                          {row.source}
                          {row.source === "DataForSEO" && row.alsoInSearchConsole ? " + Search Console" : ""}
                        </td>
                        <td style={{ ...TD, textAlign: "right" }}>
                          {isTracked ? (
                            <span style={{ fontSize: "12px", color: "#3DDC84" }}>Tracked</span>
                          ) : (
                            <button
                              type="button"
                              disabled={Boolean(tracking)}
                              onClick={() => handleTrack(row.keyword, { page: row.url || "", source: "current", apply: false })}
                              style={{ ...GHOST, opacity: tracking ? 0.6 : 1 }}
                            >
                              {tracking === String(row.keyword).toLowerCase() ? "…" : "Track"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: "#9AA1AB" }}>
              DataForSEO has not seen this website rank yet.{" "}
              {scConnected ? null : (
                <Link href="/app/connections" style={{ color: "#4DA3FF" }}>
                  Connect Search Console
                </Link>
              )}
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}

const PANEL = {
  maxWidth: "1120px",
  width: "100%",
  margin: "0 auto",
  boxSizing: "border-box",
  borderRadius: "22px",
  background: "#101215",
  border: "1px solid #1A1D22",
  padding: "18px",
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};
const H2 = { margin: 0, fontSize: "16px", fontWeight: 600, color: "#F2F4F5" };
const TABLE = { width: "100%", borderCollapse: "collapse", fontSize: "14px", color: "#F2F4F5" };
const TH = { padding: "6px 8px", fontWeight: 500 };
const TD = { padding: "10px 8px", verticalAlign: "top" };
const PILL = {
  marginLeft: "8px",
  fontSize: "11px",
  padding: "2px 7px",
  borderRadius: "8px",
  color: "#3DDC84",
  background: "rgba(61,220,132,.12)",
};
const PRIMARY = {
  minHeight: "38px",
  padding: "0 14px",
  borderRadius: "10px",
  border: "0",
  background: "#4DA3FF",
  color: "#0A0B0D",
  fontSize: "13px",
  fontWeight: 600,
};
const GHOST = {
  minHeight: "38px",
  padding: "0 14px",
  borderRadius: "10px",
  border: "1px solid #262A31",
  background: "transparent",
  color: "#D7DADE",
  fontSize: "13px",
};
