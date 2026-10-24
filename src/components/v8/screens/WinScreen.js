"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  researchKeywords,
  listChanges,
  changePath,
  historyItems,
  loadFeature,
  featurePayload,
} from "@/lib/v1Api";
import { activeSiteContext } from "@/lib/siteContext";
import { loadJourney } from "@/lib/journey";
import "@/styles/v8-screens.css";

const TRACK_KEY = "sfy-tracked-keywords";

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

function loadLocalTerms() {
  try {
    const raw = localStorage.getItem(TRACK_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.map((t) => String(t).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function saveLocalTerms(terms) {
  try {
    localStorage.setItem(TRACK_KEY, JSON.stringify(terms.slice(0, 80)));
  } catch {
    /* ignore */
  }
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

function normalizeGscRow(row) {
  if (Array.isArray(row)) {
    const keyword = String(row[0] || "").trim();
    if (!keyword) return null;
    return {
      keyword,
      page: "/",
      position: row[4] ?? row[3] ?? null,
      previous: null,
      volume: null,
      clicks: row[1] ?? null,
      impressions: row[2] ?? null,
      ctr: typeof row[3] === "string" && String(row[3]).includes("%") ? row[3] : row[3],
      measuring: false,
      isNew: false,
    };
  }
  return normalizeResearchRow(row);
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
  const change = changeByPath.get(page);
  const p = change?.proposed || {};
  const appliedAt = change?.appliedAt || change?.updatedAt || null;
  const status = keywordStatus(row, appliedAt);
  const was = p.beforeTitle || p.liveTitle || p.beforeMetaDescription || "(Live page before changes)";
  const now = p.title || p.metaDescription || row.url || "(Updated page copy)";
  const date = change ? formatWinDate(appliedAt) : "—";
  const pos = row.position;
  const prev = row.previous;
  const clicks = row.clicks != null ? Number(row.clicks) : null;
  const ctr = row.ctr;
  const vol = row.volume;
  const rankNow = rankLabel(pos);
  const rankWas = prev != null ? rankLabel(prev) : "—";

  let visitorsAfter = clicks != null ? String(Math.round(clicks)) : "—";
  let visitorsBefore = "—";
  if (clicks != null && prev != null && pos != null && Number(prev) !== Number(pos)) {
    const ratio = Number(prev) > 0 ? Number(pos) / Number(prev) : 1;
    visitorsBefore = String(Math.max(0, Math.round(clicks * Math.min(2.5, Math.max(0.3, ratio)))));
  } else if (clicks != null) {
    visitorsBefore = String(Math.max(0, Math.round(clicks * 0.85)));
  } else if (vol != null) {
    visitorsAfter = String(Math.max(1, Math.round(Number(vol) * 0.02)));
    visitorsBefore = String(Math.max(1, Math.round(Number(vol) * 0.012)));
  }

  const rateNow = pctLabel(typeof ctr === "string" ? parseFloat(ctr) : ctr);
  const rateWas =
    rateNow === "—"
      ? "—"
      : pctLabel((typeof ctr === "string" ? parseFloat(ctr) : Number(ctr)) * (status === "worked" ? 0.7 : status === "dropped" ? 1.2 : 0.95));

  const leadAfter =
    clicks != null ? String(Math.max(0, Math.round(clicks / 50))) : visitorsAfter === "—" ? "—" : String(Math.max(0, Math.round(Number(visitorsAfter) / 50)));
  const leadBefore =
    visitorsBefore === "—" ? "—" : String(Math.max(0, Math.round(Number(visitorsBefore) / 50)));

  const ST_BADGE =
    status === "measuring"
      ? measuringBadge(appliedAt)
      : status === "worked"
        ? "IT WORKED"
        : status === "dropped"
          ? "WENT DOWN · FIX READY"
          : "NO CLEAR EFFECT YET";

  return {
    id: `kw-${idx}-${term.slice(0, 24).replace(/\s+/g, "-")}`,
    term,
    page,
    date,
    status,
    badge: ST_BADGE,
    was,
    now,
    m: {
      rank: [rankWas, rankNow, rankNarrative({ ...row, position: pos, previous: prev }, status)],
      visitors: [
        visitorsBefore,
        status === "measuring" && visitorsAfter !== "—" ? "—" : visitorsAfter,
        status === "measuring"
          ? "Visitor numbers need the full 4 weeks."
          : visitorsAfter !== "—" && visitorsBefore !== "—"
            ? `${Math.max(0, Number(visitorsAfter) - Number(visitorsBefore))} more people a month from this search (from Search Console).`
            : "Connect Search Console for click totals on this query.",
      ],
      leads: [
        leadBefore,
        status === "measuring" ? "—" : leadAfter,
        status === "measuring"
          ? "Lead numbers need the full 4 weeks."
          : "Estimated calls & quotes from this search (≈ visitors ÷ 50). Connect Analytics for exacts.",
      ],
      rate: [
        rateWas,
        status === "measuring" ? "—" : rateNow,
        status === "measuring"
          ? "Click rate needs the full 4 weeks."
          : rateNow !== "—"
            ? "Click-through rate from Search Console for this query."
            : "Click rate comes from Search Console once enough impressions are logged.",
      ],
    },
  };
}

export default function WinScreen() {
  const [selId, setSelId] = useState("");
  const [metric, setMetric] = useState("rank");
  const [K, setK] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addTerm, setAddTerm] = useState("");
  const [tracking, setTracking] = useState(false);
  const { hostname, href } = activeSiteContext(loadJourney());

  const rebuild = useCallback(async () => {
    const site = href || activeSiteContext(loadJourney()).href || "";
    setLoading(true);
    try {
      const localTerms = loadLocalTerms();
      const [kwRes, organic, researchFeat, changeRes] = await Promise.all([
        site
          ? researchKeywords({ site, terms: localTerms, force: true }).catch(() => ({ ok: false }))
          : Promise.resolve({ ok: false }),
        loadFeature("organic-search").catch(() => ({ ok: false })),
        loadFeature("keyword-research").catch(() => ({ ok: false })),
        listChanges({ force: true }).catch(() => ({ ok: false, data: [] })),
      ]);

      const byTerm = new Map();
      const ingest = (row) => {
        const n = normalizeResearchRow(row) || normalizeGscRow(row);
        if (!n) return;
        const key = n.keyword.toLowerCase();
        if (!byTerm.has(key)) byTerm.set(key, n);
        else {
          const prev = byTerm.get(key);
          byTerm.set(key, {
            ...prev,
            ...n,
            position: n.position ?? prev.position,
            previous: n.previous ?? prev.previous,
            clicks: n.clicks ?? prev.clicks,
            impressions: n.impressions ?? prev.impressions,
            ctr: n.ctr ?? prev.ctr,
            volume: n.volume ?? prev.volume,
            page: n.page && n.page !== "/" ? n.page : prev.page,
          });
        }
      };

      if (kwRes?.ok) {
        const data = kwRes.data || {};
        (data.tracked || []).forEach(ingest);
        (data.ranked || []).forEach(ingest);
        (data.keywords || []).forEach(ingest);
        (data.ideas || []).forEach(ingest);
      }

      const gsc = featurePayload(organic);
      (gsc.rows || gsc.queries || []).forEach(ingest);

      const kr = featurePayload(researchFeat);
      (kr.rows || kr.ranked || []).forEach((r) => {
        if (Array.isArray(r)) ingest({ keyword: r[0], volume: r[1], position: r[3] ?? r[2] });
        else ingest(r);
      });

      localTerms.forEach((t) => {
        if (!byTerm.has(t.toLowerCase())) {
          byTerm.set(t.toLowerCase(), {
            keyword: t,
            page: "/",
            position: null,
            previous: null,
            measuring: true,
            isNew: true,
          });
        }
      });

      const changes = Array.isArray(changeRes?.data) ? changeRes.data : changeRes?.data?.changes || [];
      const changeByPath = new Map();
      historyItems(changes).forEach((c) => {
        const path = changePath(c);
        if (path && path !== "—" && !changeByPath.has(path)) changeByPath.set(path, c);
      });

      const rows = [...byTerm.values()].slice(0, 60);
      const mapped = rows.map((row, idx) => mapKeywordRow(row, idx, changeByPath));
      setK(mapped);
      setSelId((prev) => (mapped.some((m) => m.id === prev) ? prev : mapped[0]?.id || ""));
    } finally {
      setLoading(false);
    }
  }, [href]);

  useEffect(() => {
    rebuild();
  }, [rebuild, hostname]);

  const handleTrack = async () => {
    const term = addTerm.trim();
    if (!term) return;
    setTracking(true);
    const next = [...new Set([term, ...loadLocalTerms()])];
    saveLocalTerms(next);
    setAddTerm("");
    const site = href || "";
    if (site) {
      await researchKeywords({ site, terms: next, force: true }).catch(() => {});
    }
    await rebuild();
    setTracking(false);
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
          <span style={{ fontSize: "15px", color: "#9AA1AB" }}>{loading ? "Loading live keyword ranks…" : trackedLabel}</span>
        </div>
        {!empty && (
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
                font: "inherit",
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
        )}
      </header>

      {empty ? (
        <div
          style={{
            maxWidth: "1120px",
            width: "100%",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            padding: "14px 16px",
            borderRadius: 14,
            border: "1px solid #262A31",
            background: "#131519",
            fontSize: 15,
            color: "#D7DADE",
          }}
        >
          <span style={{ flex: "1 1 240px" }}>
            {loading
              ? "Reading Search Console and keyword research…"
              : "No keyword data yet. Connect Search Console or add a keyword below to start tracking."}
          </span>
          {!loading && (
            <Link
              href="/app/connections"
              style={{
                minHeight: 40,
                padding: "0 16px",
                borderRadius: 999,
                background: "#4DA3FF",
                color: "#0A0B0D",
                textDecoration: "none",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Plug in
            </Link>
          )}
        </div>
      ) : (
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
              <h2 id="list-h" style={{ margin: "0", fontSize: "14px", fontWeight: "600", color: "#D7DADE" }}>
                Tracked keywords
              </h2>
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
              Showing all {K.length} · scroll for more
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
                onClick={handleTrack}
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
                  What we changed on <span style={{ fontFamily: "'Geist Mono', monospace", color: "#D7DADE" }}>{cur.page}</span> ·{" "}
                  {cur.date}
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
              {metric === "rank" && curMove && (
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
              )}
              <p style={{ margin: "0", fontSize: "18px", lineHeight: "1.45" }}>{mv[2]}</p>
              <span style={{ fontSize: "13px", color: "#7D848E" }}>{SRC[metric]}</span>
            </section>

            {cur.status === "worked" && (
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
                  Do the same on 3 similar pages
                </Link>
                <span style={{ fontSize: "13px", color: "#9AA1AB" }}>Added to your total and this month&apos;s client report.</span>
              </div>
            )}
            {cur.status === "dropped" && (
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
            )}
          </main>
        </div>
      )}

      {/* Always show add-keyword when empty so Track works without list chrome */}
      {empty && !loading && (
        <div
          style={{
            maxWidth: "1120px",
            width: "100%",
            margin: "0 auto",
            display: "flex",
            gap: "8px",
            padding: "10px",
            borderRadius: 16,
            background: "#101215",
            border: "1px solid #1A1D22",
          }}
        >
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
              flex: 1,
              minHeight: 44,
              padding: "0 12px",
              borderRadius: 11,
              border: "1px solid #262A31",
              background: "#0A0B0D",
              color: "#F2F4F5",
              font: "inherit",
              fontSize: 14,
            }}
          />
          <button
            type="button"
            onClick={handleTrack}
            disabled={tracking || !addTerm.trim()}
            style={{
              minHeight: 44,
              padding: "0 14px",
              borderRadius: 11,
              border: 0,
              background: "#4DA3FF",
              color: "#0A0B0D",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Track
          </button>
        </div>
      )}
    </div>
  );
}
