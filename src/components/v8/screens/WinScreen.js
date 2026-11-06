"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  researchKeywords,
  getAiVisibility,
  trackKeyword,
  untrackKeyword,
  approveChange,
  executeChange,
  checkKeywordRanks,
  getSiteScan,
  listChanges,
  changePath,
  historyItems,
  errorText,
} from "@/lib/v1Api";
import { activeSiteContext } from "@/lib/siteContext";
import { loadJourney } from "@/lib/journey";
import CheckPopup from "@/components/v8/CheckPopup";
import { SkeletonCards } from "@/components/v8/SkeletonWave";
import ProblemNotice from "@/components/v8/ProblemNotice";
import KeywordGuide from "@/components/v8/screens/keywords/KeywordGuide";
import { problemsFrom } from "@/lib/problems";
import "@/styles/v8-screens.css";
import DataHealthNotice from "@/components/v8/DataHealthNotice";

const SPOT_TIP = "Where your page shows up in Google for this search, on average. #1 is the top.";
const CLICK_TIP =
  "The share of people who clicked after your page appeared in Google. Every appearance counts as an impression, whether or not anyone clicked, so 100 appearances and 5 clicks is 5%.";

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
    page: pathFrom(row.page || row.url) || row.page || "/",
    trackedAt: row.trackedAt || null,
    change: row.change || null,
    concept: row.concept || "",
    trackedSource: row.trackedSource || "",
    measuring: Boolean(row.measuring),
    live: row.live || {},
    rankSource: row.rankSource || "none",
    difficulty: row.difficulty ?? null,
    localVolume: row.localVolume ?? null,
    trend: row.trend || [],
  };
}

const OPEN_CHANGE = new Set(["proposed", "awaiting_approval", "approved", "failed", "needs_review"]);

function fmtNum(n) {
  if (n == null || n === "" || Number.isNaN(Number(n))) return "—";
  return Math.round(Number(n)).toLocaleString("en-US");
}

function trackedDay(iso) {
  if (!iso) return "TODAY";
  const raw = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(String(iso)) ? iso : `${iso}Z`);
  if (Number.isNaN(raw.getTime())) return "TODAY";
  const now = new Date();
  if (raw.toDateString() === now.toDateString()) return "TODAY";
  return raw.toLocaleString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

function readingStamp(iso) {
  const raw = iso ? new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(String(iso)) ? iso : `${iso}Z`) : new Date();
  const start = Number.isNaN(raw.getTime()) ? new Date() : raw;
  const d = new Date(start);
  d.setDate(d.getDate() + 7);
  const land = d.toLocaleString("en-US", { month: "short", day: "numeric" });
  return { by: `BY ${land.toUpperCase()}`, land };
}

function keywordStatus(row, appliedAt) {
  const pos = row.position;
  const prev = row.previous;
  const hasPos = pos != null && pos !== "" && Number(pos) > 0;
  const hasPrev = prev != null && prev !== "" && Number(prev) > 0;
  const published = Boolean(appliedAt);
  // "First reading by …" is only for a fix we just published. Existing ranks stay visible.
  if (!hasPos && !hasPrev) return published ? "fresh" : "ranked";
  const age = published ? daysSince(appliedAt) : null;
  if (hasPos && hasPrev) {
    if (Number(pos) < Number(prev)) return "worked";
    if (Number(pos) > Number(prev)) return "dropped";
    if (published && age != null && age < 28) return "measuring";
    return "flat";
  }
  if (published && (row.measuring || row.isNew || (age != null && age < 28))) return "measuring";
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

function mapKeywordRow(source, idx, changeByPath, device = "desktop") {
  // Live Google check for the chosen device; DataForSEO's estimate only until the first check.
  const slot = source.live?.[device];
  const live = Boolean(slot?.latest);
  const row = live
    ? { ...source, position: slot.latest.position, previous: slot.previous, measuring: false }
    : source;
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
  const publishedAt = change?.appliedAt || null;
  const status = keywordStatus(row, publishedAt);
  const stamp = readingStamp(publishedAt || source.trackedAt);
  const freshNote = "Visitor numbers start once Google shows you for this search.";
  const was = status === "fresh"
    ? "Not tracked before today"
    : status === "ranked"
      ? "Already ranking. No Searchify change yet."
      : p.beforeTitle || p.liveTitle || p.beforeMetaDescription || "(Live page before changes)";
  const now = status === "fresh"
    ? `Tracking. First reading by ${stamp.land}.`
    : status === "ranked"
      ? (row.url || row.page || "Current Google position for this page.")
      : p.title || p.metaDescription || row.url || "(No page update yet)";
  const date = status === "fresh" ? trackedDay(publishedAt) : change && publishedAt ? formatWinDate(publishedAt) : "—";
  const pos = row.position;
  const prev = row.previous;
  const clicks = row.clicks != null ? Number(row.clicks) : null;
  const ctr = row.ctr;
  const rankNow = status === "fresh" ? "—" : live && pos == null ? "100+" : rankLabel(pos);
  const rankWas = status === "fresh" || status === "ranked" ? "—" : prev != null ? rankLabel(prev) : "—";
  // Only real numbers: Search Console clicks/CTR and DataForSEO ranks. No estimates are filled in.
  const visitorsNow = status === "fresh" ? "—" : clicks != null ? String(Math.round(clicks)) : "—";
  const rateNow = status === "fresh" ? "—" : pctLabel(typeof ctr === "string" ? parseFloat(ctr) : ctr);

  const ST_BADGE =
    status === "fresh"
      ? `JUST ADDED · FIRST READING ${stamp.by}`
      : status === "ranked"
        ? (pos != null ? `ALREADY #${Math.round(Number(pos))}` : "ALREADY RANKING")
      : status === "measuring"
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
    trackedAt: source.trackedAt || null,
    reading: stamp,
    volume: row.volume,
    localVolume: row.localVolume,
    difficulty: row.difficulty,
    trend: row.trend,
    live: source.live || {},
    slot: slot || null,
    rankSource: live ? "live" : source.rankSource,
    change: change && change.id ? { id: change.id, status: change.status } : null,
    m: {
      rank: [
        rankWas,
        rankNow,
        status === "fresh"
          ? `First reading by ${stamp.land}. Then we’ll suggest the move that gets you higher.`
          : rankNarrative({ ...row, position: pos, previous: prev }, status),
      ],
      visitors: [
        "—",
        visitorsNow,
        status === "fresh"
          ? freshNote
          : visitorsNow !== "—"
            ? "Clicks from this search in Search Console."
            : "Connect Search Console for real click totals on this search.",
      ],
      leads: ["—", "—", status === "fresh" ? freshNote : "Calls and form fills need Google Analytics conversions for this search."],
      rate: [
        "—",
        rateNow,
        status === "fresh"
          ? freshNote
          : rateNow !== "—"
            ? "Click-through rate from Search Console for this query."
            : "Click rate comes from Search Console once enough impressions are logged.",
      ],
    },
  };
}

function InfoTip({ tipId, label, text, href, align = "left", open, onEnter, onLeave, onToggle, onKey, tipRef }) {
  return (
    <span
      ref={tipRef}
      className="v8-path-tip"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        onLeave();
      }}
    >
      <button
        type="button"
        className="v8-path-tip-btn"
        aria-label={label}
        aria-expanded={open}
        aria-controls={tipId}
        onClick={onToggle}
        onKeyDown={onKey}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
          <path d="M12 11v7" />
          <path d="M12 6.5h.01" />
        </svg>
      </button>
      {open ? (
        <span className={`v8-path-tip-pop${align === "right" ? " v8-path-tip-pop-r" : ""}`} id={tipId} role="dialog" aria-label={label}>
          <span className="v8-path-tip-card">
            <span>{text}</span>
            <a href={href} target="_blank" rel="noreferrer">
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
  const [raw, setRaw] = useState({ rows: [], changeByPath: new Map() });
  const [device, setDevice] = useState("desktop");
  const [checking, setChecking] = useState(false);
  const [research, setResearch] = useState({});
  const K = useMemo(() => raw.rows.map((row, idx) => mapKeywordRow(row, idx, raw.changeByPath, device)), [raw, device]);
  const [loading, setLoading] = useState(true);
  const [addTerm, setAddTerm] = useState("");
  const [tracking, setTracking] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [trackNote, setTrackNote] = useState("");
  const [publishing, setPublishing] = useState(0);
  const [publishWin, setPublishWin] = useState(null);
  const [sitePages, setSitePages] = useState([]);
  const [pageNote, setPageNote] = useState("");
  const [problems, setProblems] = useState([]);
  const [tip, setTip] = useState(null);
  const [tipPin, setTipPin] = useState(false);
  const [view, setView] = useState("guide");
  const { hostname, href } = activeSiteContext(loadJourney());

  useEffect(() => {
    if (!tip) return undefined;
    const onDoc = (event) => {
      const node = tip === "spot" ? listTipRef.current : metricTipRef.current;
      if (node && !node.contains(event.target)) {
        setTip(null);
        setTipPin(false);
      }
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        setTip(null);
        setTipPin(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [tip]);

  const rebuild = useCallback(async ({ force = false, quiet = false } = {}) => {
    const site = href || activeSiteContext(loadJourney()).href || "";
    if (!quiet) setLoading(true);
    try {
      const [kwRes, changeRes, scanRes, visRes] = await Promise.all([
        site ? researchKeywords({ site, force }).catch(() => ({ ok: false })) : Promise.resolve({ ok: false }),
        listChanges({ force: true }).catch(() => ({ ok: false, data: [] })),
        site ? getSiteScan(site).catch(() => ({ ok: false })) : Promise.resolve({ ok: false }),
        getAiVisibility().catch(() => ({ ok: false })),
      ]);
      setProblems(site ? problemsFrom(kwRes, "keywords") : []);
      setSitePages(scanRes?.ok ? collectScanPages(scanRes.data) : []);

      let data = {};
      if (kwRes?.ok) {
        data = kwRes.data || {};
        const version = Number(data.qualityVersion || 0);
        if (!force && version < 9) {
          const fresh = await researchKeywords({ site, force: true }).catch(() => null);
          if (fresh?.ok) data = fresh.data || data;
        }
        setPageNote(data.cached ? "Showing the last saved keyword set. Refresh live suggestions to pull DataForSEO, Search Console, and Analytics again." : "");
      } else if (site) {
        // Live research failed: still show what is stored (tracked list is in the database).
        const stored = await researchKeywords({ site, storedOnly: true }).catch(() => null);
        data = stored?.ok ? stored.data || {} : {};
        setPageNote(errorText(kwRes, "Live keyword ranks could not be refreshed. Tracked keywords below use the last DataForSEO check."));
      } else {
        setPageNote("Add the website in setup so Searchify can track keywords for it.");
      }

      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      setResearch({
        organicSummary: data.organicSummary || null,
        cannibalization: data.cannibalization || [],
        competitors: data.competitors || [],
        localVolume: data.localVolume || null,
        aiChecks: (visRes?.ok ? visRes.data?.report?.checks : []) || [],
      });

      const changes = Array.isArray(changeRes?.data) ? changeRes.data : changeRes?.data?.changes || [];
      const changeByPath = new Map();
      historyItems(changes).forEach((c) => {
        const path = changePath(c);
        if (path && path !== "—" && !changeByPath.has(path)) changeByPath.set(path, c);
      });

      const tracked = (data.trackedList || []).map(normalizeTracked).filter(Boolean);
      const seen = new Set(tracked.map((row) => String(row.keyword || "").toLowerCase()));
      const existing = (data.current || [])
        .map(normalizeTracked)
        .filter((row) => row && !seen.has(String(row.keyword || "").toLowerCase()));
      const rows = [...tracked, ...existing];
      setRaw({ rows, changeByPath });
      setSelId((prev) => (rows.some((r) => keywordId(r.keyword) === prev) ? prev : rows[0] ? keywordId(rows[0].keyword) : ""));
    } catch {
      setPageNote("Keyword tracking could not be loaded. Try again in a moment.");
    } finally {
      if (!quiet) setLoading(false);
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
      apply: extra.apply === true,
    }).catch(() => ({ ok: false }));
    if (!res?.ok) {
      setProblems(problemsFrom(res, "keywords"));
      setTrackNote(errorText(res, "The keyword could not be tracked. Try again."));
      setTracking("");
      return false;
    }
    if (raw == null) setAddTerm("");
    const d = res.data || {};
    const parts = [];
    if (d.change?.id) parts.push(`A new title and description for ${pathFrom(d.change.targetUrl || d.change.target_url || "") || "the page"} is waiting for your approval.`);
    if (d.note) parts.push(d.note);
    (d.warnings || []).forEach((w) => parts.push(w));
    setTrackNote(parts.join(" "));
    if (!extra.skipRefresh) await rebuild({ quiet: true });
    setSelId(keywordId(d.keyword || term));
    setTracking("");
    return true;
  };

  const handleUntrack = async (term) => {
    if (!href || !term) return;
    await untrackKeyword({ site: href, keyword: term }).catch(() => null);
    setTrackNote(`Stopped tracking “${term}”.`);
    await rebuild({ quiet: true });
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
    if (done?.ok) {
      const next = K.find((row) => row.change && OPEN_CHANGE.has(row.change.status) && row.change.id !== change.id);
      setPublishWin({
        query: change.query || change.keyword || K.find((row) => row.change?.id === change.id)?.term || "this search",
        page: pathFrom(change.targetUrl || change.target_url || "") || hostname || "your page",
        nextTerm: next?.term || "",
        nextId: next?.id || "",
      });
    }
    setTrackNote(
      done?.ok
        ? "Published to your website. Searchify now measures this keyword's spot on Google."
        : errorText(done, "Publishing failed. Connect WordPress, Shopify, or Webflow in Connections, then try again."),
    );
    await rebuild();
    setPublishing(0);
  };

  // Live Google check now (desktop + mobile) for every tracked keyword. Daily checks also run on their own.
  const handleCheckRanks = async () => {
    if (!href || checking) return;
    setChecking(true);
    setTrackNote("");
    const res = await checkKeywordRanks({ site: href }).catch(() => ({ ok: false }));
    if (res?.ok) {
      const d = res.data || {};
      setTrackNote(
        `Checked ${d.checked || 0} rank${d.checked === 1 ? "" : "s"} live on Google${d.location ? ` in ${d.location.replace(/,/g, ", ")}` : ""}.` +
          (d.failed ? ` ${d.failed} check${d.failed === 1 ? "" : "s"} failed and will retry with the daily check.` : ""),
      );
      await rebuild();
    } else {
      setTrackNote(errorText(res, "The live rank check did not run. Try again in a moment."));
    }
    setChecking(false);
  };

  const summary = useMemo(() => {
    let up = 0;
    let flat = 0;
    let down = 0;
    let measuring = 0;
    let fresh = 0;
    K.forEach((row) => {
      if (row.status === "worked") up += 1;
      else if (row.status === "dropped") down += 1;
      else if (row.status === "measuring") measuring += 1;
      else if (row.status === "fresh") fresh += 1;
      else flat += 1;
    });
    return { up, flat, down, measuring, fresh };
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
      dot: "#FFC53D",
      text: "#FFC53D",
      bg: "rgba(255,197,61,.1)",
      border: "rgba(255,197,61,.5)",
      arrow: "#FFC53D",
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
    fresh: {
      dot: "#D7DADE",
      text: "#D7DADE",
      bg: "#1A1D22",
      border: "#3A404A",
      arrow: "#9AA1AB",
      after: "#F2F4F5",
    },
    ranked: {
      dot: "#4DA3FF",
      text: "#D7DADE",
      bg: "#1A1D22",
      border: "#262A31",
      arrow: "#4DA3FF",
      after: "#F2F4F5",
    },
  };

  const cur = K.find((x) => x.id === selId) || K[0];
  const lastCheck = useMemo(() => {
    let best = null;
    K.forEach((k) => {
      Object.values(k.live || {}).forEach((s) => {
        const at = s?.latest?.checkedAt;
        if (at && (!best || at > best.at)) best = { at, location: s.latest.location };
      });
    });
    if (!best) return null;
    const d = new Date(best.at.endsWith("Z") ? best.at : `${best.at}Z`);
    return { ...best, when: Number.isNaN(d.getTime()) ? "" : d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) };
  }, [K]);
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
    if (!Number.isFinite(a) && !Number.isFinite(b)) return { t: "new", c: "#D7DADE", bg: "#1A1D22", n: 0, w: "just added" };
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
    : cur.status === "fresh"
      ? `Now tracking “${cur.term}”.`
      : cur.status === "ranked"
        ? `"${cur.term}" is already on Google${cur.m.rank[1] && cur.m.rank[1] !== "—" ? ` at ${cur.m.rank[1]}` : ""}.`
      : cur.status === "worked"
      ? `"${cur.term}" is bringing in more customers.`
      : cur.status === "measuring"
        ? `Too early to call "${cur.term}".`
        : cur.status === "dropped"
          ? `"${cur.term}" slipped. A fix is ready.`
          : `"${cur.term}" hasn't moved yet.`;

  const MLAB = { rank: "Spot on Google", visitors: "Visitors", leads: "Calls & leads", rate: "Click rate" };
  const SRC = cur?.status === "fresh"
    ? {
        rank: "From Search Console · your average spot on Google for this search (#1 is the top result)",
        visitors: "From Search Console · clicks from this search",
        leads: "From Analytics · calls and form fills from this search",
        rate: "From Search Console · clicks ÷ times shown",
      }
    : {
        rank: "Live Google check · DataForSEO · your spot in the results for this search (#1 is the top result)",
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

  const areaName = research.localVolume?.location ? String(research.localVolume.location).split(",")[0] : "";
  const trackedBits = [
    summary.up ? `${summary.up} up` : "",
    summary.flat ? `${summary.flat} flat` : "",
    summary.down ? `${summary.down} down` : "",
    summary.measuring ? `${summary.measuring} measuring` : "",
    summary.fresh ? `${summary.fresh} just added` : "",
  ].filter(Boolean);
  const reading = readingStamp(K.find((row) => row.status === "fresh")?.trackedAt);
  const trackedLabel =
    view === "guide"
      ? `Searches around ${areaName || "your area"} that fit what you do`
      : K.length
        ? `${K.length} keywords tracked on ${hostname || "your site"}${trackedBits.length ? ` · ${trackedBits.join(" · ")}` : ""}`
        : "Nothing tracked yet";

  const curMove = empty ? null : moveOf(cur);

  return (
    <div
      className="win-page"
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
      <style>{`
        .win-page [style*="Geist Mono"]{font-family:'Open Sans',sans-serif !important;font-weight:700 !important}
        .v8-page .win-page a{color:#4DA3FF}
        .v8-page .win-page a:hover{color:#8CC4FF}
        .win-page button{font-family:inherit;cursor:pointer}
        .win-page select:focus-visible,.win-page button:focus-visible,.win-page input:focus-visible{outline:2px solid #4DA3FF;outline-offset:2px}
        @keyframes sfy-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes sfy-breathe{0%,100%{opacity:1}50%{opacity:.5}}
        @media (prefers-reduced-motion: reduce){.win-page *{animation:none !important;transition:none !important}}
      `}</style>
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
        {view === "tracked" && K.length ? (
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#9AA1AB", minWidth: "300px" }}>
            Keyword
            <select
              value={selId}
              onChange={(e) => setSelId(e.target.value)}
              style={{
                minHeight: "48px",
                padding: "0 14px",
                borderRadius: "12px",
                border: "1px solid #4DA3FF",
                background: "#131519",
                color: "#F2F4F5",
                fontFamily: "inherit",
                fontSize: "15px",
                boxShadow: "0 0 18px rgba(77,163,255,.2)",
              }}
            >
              {list.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.term}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </header>

      {!loading ? (
        <nav aria-label="Keyword views" style={{ maxWidth: 1120, width: "100%", margin: "0 auto", display: "flex", gap: 8, flexWrap: "wrap", paddingBottom: 14, borderBottom: "1px solid #1A1D22" }}>
          {[
            { id: "guide", label: "Suggestions", count: suggestions.length },
            { id: "tracked", label: "Tracked", count: K.length },
          ].map((tab) => {
            const on = view === tab.id;
            return (
              <button key={tab.id} type="button" aria-pressed={on} onClick={() => setView(tab.id)} style={{ display: "inline-flex", alignItems: "center", gap: 10, minHeight: 46, padding: "0 18px", borderRadius: 999, border: `1px solid ${on ? "#F2F4F5" : "#262A31"}`, background: on ? "#F2F4F5" : "transparent", color: on ? "#0A0B0D" : "#D7DADE", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                {tab.label}
                <span style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 12, padding: "2px 9px", borderRadius: 999, background: on ? "#0A0B0D" : "#1A1D22", color: on ? "#F2F4F5" : "#9AA1AB" }}>{tab.count}</span>
              </button>
            );
          })}
        </nav>
      ) : null}

      {loading ? (
        <div style={{ maxWidth: "1120px", width: "100%", margin: "0 auto" }}>
          <SkeletonCards count={2} lines={4} />
        </div>
      ) : null}
      {!loading ? (
        <div style={{ display: view === "guide" ? "contents" : "none" }}>
          <KeywordGuide
            suggestions={suggestions}
            competitors={research.competitors}
            localVolume={research.localVolume}
            trackedTerms={new Set(K.map((row) => row.term.toLowerCase()))}
            tracking={tracking}
            readingLand={reading.land}
            onTrack={handleTrack}
            onUntrack={handleUntrack}
            onRefresh={() => rebuild({ quiet: true })}
            onSeeTracked={() => setView("tracked")}
            aiChecks={(research.aiChecks || []).filter((row) => row?.prompt).slice(0, 6)}
          />
        </div>
      ) : null}

      {!loading && view === "tracked" && summary.fresh > 0 ? (
        <section aria-labelledby="cg-h" style={{ maxWidth: 1120, width: "100%", margin: "0 auto", boxSizing: "border-box", borderRadius: 22, background: "#101215", border: "1px solid rgba(61,220,132,.45)", boxShadow: "0 0 30px rgba(61,220,132,.08)", padding: "clamp(20px, 3vw, 30px)", display: "flex", flexDirection: "column", gap: 18, animation: "sfy-rise .3s ease both" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <span style={{ width: 44, height: 44, flex: "none", borderRadius: "50%", background: "rgba(61,220,132,.14)", display: "grid", placeItems: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
              <h2 id="cg-h" style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(24px, 2.6vw, 30px)", lineHeight: 1.1, letterSpacing: "-0.6px", fontWeight: 700 }}>Congratulations, you&apos;re now tracking {summary.fresh} keywords.</h2>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#D7DADE", maxWidth: 760 }}>Results will begin to populate over the next 30 to 60 days, at minimum. Please give SEO time. It&apos;s a slow process, but a very rewarding one for your website and your business.</p>
            </div>
          </div>
          <ol aria-label="What happens next" style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            <li style={{ borderRadius: 14, background: "rgba(61,220,132,.07)", border: "1px solid rgba(61,220,132,.4)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 11, color: "#3DDC84" }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3DDC84", boxShadow: "0 0 8px #3DDC84" }} />TODAY</span>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Tracking starts</span>
              <span style={{ fontSize: 13, color: "#9AA1AB" }}>We start watching these searches on Google.</span>
            </li>
            <li style={{ borderRadius: 14, background: "#0A0B0D", border: "1px solid #262A31", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 11, color: "#9AA1AB" }}><span style={{ width: 8, height: 8, boxSizing: "border-box", borderRadius: "50%", border: "2px solid #9AA1AB" }} />{reading.by}</span>
              <span style={{ fontSize: 15, fontWeight: 600 }}>First reading</span>
              <span style={{ fontSize: 13, color: "#9AA1AB" }}>Where you stand on Google today, if you show up at all.</span>
            </li>
            <li style={{ borderRadius: 14, background: "#0A0B0D", border: "1px solid #262A31", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 11, color: "#9AA1AB" }}><span style={{ width: 8, height: 8, boxSizing: "border-box", borderRadius: "50%", border: "2px solid #9AA1AB" }} />30 TO 60 DAYS</span>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Results start to show</span>
              <span style={{ fontSize: 13, color: "#9AA1AB" }}>Movement on Google, visitors and calls.</span>
            </li>
          </ol>
          <span style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, lineHeight: 1.5, color: "#D7DADE" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9AA1AB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: 1 }}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
            We&apos;ll keep a watchful eye on these keywords. Nothing has been changed on your website yet, and we&apos;ll ask you before anything is.
          </span>
        </section>
      ) : null}

      {!loading && view === "tracked" && !K.length ? (
        <div style={{ maxWidth: 1120, width: "100%", margin: "0 auto", boxSizing: "border-box", borderRadius: 22, background: "#101215", border: "1px solid #1A1D22", padding: "40px 28px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 14 }}>
          <h2 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 30, letterSpacing: "-0.6px", fontWeight: 700 }}>Nothing tracked yet.</h2>
          <p style={{ margin: 0, fontSize: 16, color: "#D7DADE", lineHeight: 1.55, maxWidth: 560 }}>Pick a few searches from Suggestions. We&apos;ll take a first reading of where you stand within 7 days, then show you the moves that get you higher.</p>
          <button type="button" onClick={() => setView("guide")} style={{ minHeight: 52, padding: "0 22px", borderRadius: 13, border: 0, background: "#4DA3FF", color: "#0A0B0D", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>See suggestions</button>
        </div>
      ) : null}

      {!loading && view === "tracked" && K.length ? (
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
                <InfoTip
                  tipId="tip-spot"
                  label="What is a spot on Google?"
                  text={SPOT_TIP}
                  href="https://searchify.io/help/position"
                  open={tip === "spot"}
                  tipRef={listTipRef}
                  onEnter={() => {
                    if (!tipPin) setTip("spot");
                  }}
                  onLeave={() => {
                    if (!tipPin && tip === "spot") setTip(null);
                  }}
                  onToggle={() => {
                    if (tip === "spot" && tipPin) {
                      setTip(null);
                      setTipPin(false);
                    } else {
                      setTip("spot");
                      setTipPin(true);
                    }
                  }}
                  onKey={(event) => {
                    if (event.key === "Escape") {
                      event.stopPropagation();
                      setTip(null);
                      setTipPin(false);
                    }
                  }}
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
                    fontFamily: "inherit",
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
            ) : null}
            <DataHealthNotice need={["site", "scan", "business", "firewall", "research", "market", "quota", "gsc", "gsc_data"]} onFixed={() => rebuild({ force: true })} />
            {empty ? null : (
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
                      What we changed on <span style={{ fontFamily: "'Geist Mono', monospace", color: "#D7DADE" }}>{cur.page}</span> · {cur.date}
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
                          onClick={() => {
                            setMetric(m.id);
                            if (tip === "metric") {
                              setTip(null);
                              setTipPin(false);
                            }
                          }}
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
                    {metric === "rank" || metric === "rate" ? (
                      <InfoTip
                        tipId="tip-metric"
                        label={metric === "rank" ? "What is a spot on Google?" : "What is click rate?"}
                        text={metric === "rank" ? SPOT_TIP : CLICK_TIP}
                        href={metric === "rank" ? "https://searchify.io/help/position" : "https://searchify.io/help/click-rate"}
                        align="right"
                        open={tip === "metric"}
                        tipRef={metricTipRef}
                        onEnter={() => {
                          if (!tipPin) setTip("metric");
                        }}
                        onLeave={() => {
                          if (!tipPin && tip === "metric") setTip(null);
                        }}
                        onToggle={() => {
                          if (tip === "metric" && tipPin) {
                            setTip(null);
                            setTipPin(false);
                          } else {
                            setTip("metric");
                            setTipPin(true);
                          }
                        }}
                        onKey={(event) => {
                          if (event.key === "Escape") {
                            event.stopPropagation();
                            setTip(null);
                            setTipPin(false);
                          }
                        }}
                      />
                    ) : null}
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
                  {metric === "rank" && curMove && cur.status !== "fresh" ? (
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
                      href="/app/queue"
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
                      Do the same on {similarPages.length ? `${similarPages.length} similar page${similarPages.length === 1 ? "" : "s"}` : "similar pages"}
                    </Link>
                    <span style={{ fontSize: "13px", color: "#9AA1AB" }}>Added to your total and this month&apos;s client report.</span>
                  </div>
                ) : null}
              </>
            )}
          </main>
        </div>
      ) : null}

      {problems.length ? (
        <ProblemNotice problems={problems} onRetry={() => rebuild({ force: true })} style={{ maxWidth: "1120px", width: "100%", margin: "0 auto" }} />
      ) : null}
      {trackNote ? (
        <p role="status" style={{ maxWidth: "1120px", width: "100%", margin: "0 auto", fontSize: 14, lineHeight: 1.45, color: "#4DA3FF" }}>
          {trackNote}
        </p>
      ) : null}
      {!loading && pageNote ? (
        <p style={{ maxWidth: "1120px", width: "100%", margin: "0 auto", fontSize: 14, lineHeight: 1.45, color: "#9AA1AB" }}>
          {pageNote}{" "}
          <button type="button" onClick={() => rebuild({ force: true })} disabled={loading} style={{ border: 0, background: "transparent", color: "#4DA3FF", fontSize: 14, fontWeight: 600, textDecoration: "underline", padding: 0 }}>
            Refresh live suggestions
          </button>
        </p>
      ) : null}

      <CheckPopup
        open={Boolean(publishWin)}
        titleId="win-h"
        title="Congratulations, your publish was made live successfully."
        tone="green"
        lead={publishWin ? `Your new Google title and description are now on ${publishWin.page}.` : ""}
        checks={publishWin ? [
          "Saved to your website",
          "Checked your live page: the new title is showing",
          `Tracking “${publishWin.query}” from today. First result in about 4 weeks.`,
        ] : []}
        note={<><strong style={{ color: "#F2F4F5" }}>It&apos;s live on your website right now, and that&apos;s what matters.</strong> Google takes a little time to notice changes, usually a few days to a few weeks before your listing updates in search results. You don&apos;t need to do anything. We&apos;ll keep checking.</>}
        primary={publishWin?.nextTerm ? {
          label: `Next fix: “${publishWin.nextTerm}” →`,
          onClick: () => {
            if (publishWin.nextId) setSelId(publishWin.nextId);
            setPublishWin(null);
          },
        } : {
          label: "All fixes done · back to Home",
          onClick: () => {
            setPublishWin(null);
            window.location.assign("/app");
          },
        }}
        secondary={{ label: "Back to this page", onClick: () => setPublishWin(null) }}
        onClose={() => setPublishWin(null)}
      />
    </div>
  );
}

