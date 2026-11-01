"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getBillingAccount } from "@/lib/billingApi";
import { loadFeature, featurePayload, listChanges, getSiteScan } from "@/lib/v1Api";
import { activeSiteContext } from "@/lib/siteContext";
import { loadJourney } from "@/lib/journey";
import { getUser } from "@/utils/users/Helpers";
import { SkeletonCards } from "@/components/v8/SkeletonWave";
import FounderSignature from "@/components/v8/FounderSignature";
import "@/styles/v8-trial-report.css";

const COL = {
  r: ["#FF5A4E", "rgba(255,90,78,.6)"],
  y: ["#FFC53D", "rgba(255,197,61,.3)"],
  g: ["#3DDC84", "rgba(61,220,132,.2)"],
};

const TOPIC_LABEL = {
  title: "Title",
  description: "Description",
  heading: "Heading",
  css: "CSS",
  javascript: "JavaScript",
  image: "Image",
  ssr: "SSR",
  csr: "CSR",
  lcp: "LCP",
  cls: "CLS",
  inp: "INP",
  speed: "Speed",
};

/** Build a 10×N dot grid from real urgent / need-work / healthy counts (no fabricated improve). */
function dotsFromCounts(counts, maxDots = 40) {
  const red = Math.max(0, Number(counts?.red) || 0);
  const yellow = Math.max(0, Number(counts?.yellow) || 0);
  const green = Math.max(0, Number(counts?.green) || 0);
  const total = red + yellow + green;
  if (!total) return [];
  let r = red;
  let y = yellow;
  let g = green;
  if (total > maxDots) {
    const scale = maxDots / total;
    r = Math.max(red ? 1 : 0, Math.round(red * scale));
    y = Math.max(yellow ? 1 : 0, Math.round(yellow * scale));
    g = Math.max(0, maxDots - r - y);
  }
  return [
    ...Array(r).fill("r"),
    ...Array(y).fill("y"),
    ...Array(g).fill("g"),
  ].map((k) => ({ c: COL[k][0], g: COL[k][1], key: k }));
}

function healthLabel(counts) {
  const red = Math.max(0, Number(counts?.red) || 0);
  const yellow = Math.max(0, Number(counts?.yellow) || 0);
  const green = Math.max(0, Number(counts?.green) || 0);
  return `${red} urgent · ${yellow} need work · ${green} healthy`;
}

function firstName(user, business) {
  const raw = user?.data?.name || user?.result?.username || business || "";
  const bit = String(raw).trim().split(/\s+|@/)[0];
  if (!bit) return "there";
  return bit.charAt(0).toUpperCase() + bit.slice(1);
}

function fmtDay(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return String(iso).slice(0, 10);
  }
}

function statusForChange(change) {
  if (!change) return { status: "Too early to call", color: "#9AA1AB" };
  const c = String(change);
  if (/proven|goal/i.test(c)) return { status: "Proven", color: "#3DDC84" };
  if (/\+/.test(c) || /rising|early/i.test(c)) {
    return {
      status: /early sign/i.test(c) ? c : c.startsWith("+") ? `Early sign, ${c}` : "Early sign, rising",
      color: "#3DDC84",
    };
  }
  if (/waiting|connect|no pages|too early/i.test(c)) return { status: "Too early to call", color: "#9AA1AB" };
  if (/catching up|still/i.test(c)) return { status: "Still catching up", color: "#FFC53D" };
  if (/^early sign$/i.test(c)) return { status: "Early sign", color: "#FFC53D" };
  return { status: c || "Too early to call", color: "#9AA1AB" };
}

function asCount(value) {
  if (value == null || value === "" || value === "—") return 0;
  const n = Number(String(value).replace(/,/g, "").replace(/%/g, "").trim());
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

function fmtCount(n) {
  return Number(n || 0).toLocaleString("en-US");
}

const HONEST_METRICS = [
  "Healthy pages",
  "Searches you show up for",
  "Times Google showed your site",
  "Searches on page one",
  "Clicks from Google",
  "Calls and form leads",
];

function pickSinceRow(rows, label) {
  const want = String(label).toLowerCase();
  const list = Array.isArray(rows) ? rows : [];
  return (
    list.find((row) => String(row?.label || "").trim().toLowerCase() === want) ||
    list.find((row) => String(row?.label || "").toLowerCase().includes(want.split(" ")[0])) ||
    null
  );
}

function classifyTopic(text) {
  const t = String(text || "").toLowerCase();
  if (/\btitle\b|document.title|meta title/.test(t)) return "title";
  if (/description|meta description|snippet/.test(t)) return "description";
  if (/\bh1\b|heading|headline/.test(t)) return "heading";
  if (/\bssr\b|server.?side|ttfb|time to first byte|server response/.test(t)) return "ssr";
  if (/\bcsr\b|client.?side|hydrat/.test(t)) return "csr";
  if (/\bimage\b|\bimg\b|webp|avif|srcset|offscreen/.test(t)) return "image";
  if (/\bcss\b|stylesheet|render-blocking/.test(t)) return "css";
  if (/javascript|\bjs\b|boot.?up|main.?thread/.test(t)) return "javascript";
  if (/\blcp\b|largest contentful/.test(t)) return "lcp";
  if (/\bcls\b|layout shift/.test(t)) return "cls";
  return "";
}

function extractAuditTopics(audit, onPage) {
  const topics = [];
  const push = (topic, label, detail, severity = "yellow") => {
    if (!topic || topics.some((t) => t.topic === topic && t.label === label)) return;
    topics.push({ topic, label, detail, severity });
  };

  const panels = [...(audit?.tablePanels || []), ...(onPage?.tablePanels || [])];
  panels.forEach((panel) => {
    (panel.rows || []).forEach((row) => {
      if (!Array.isArray(row) || !row.length) return;
      const title = String(row[0] || "");
      const status = String(row[1] || "");
      if (!/fail|average|issue|poor|needs/i.test(status) && !/fail|average/i.test(String(row[2] || ""))) return;
      const topic = classifyTopic(`${title} ${panel.title || ""}`);
      if (!topic) return;
      push(
        topic,
        title,
        String(row[4] || row[3] || row[2] || status).slice(0, 180),
        /fail|poor/i.test(status) ? "red" : "yellow",
      );
    });
  });

  (audit?.rows || []).forEach((row) => {
    if (!Array.isArray(row) || !row.length) return;
    const name = String(row[0] || "");
    const topic = classifyTopic(name);
    if (!topic) return;
    const mobile = row[1];
    const note = row[3] || row[2] || "";
    if (mobile == null || mobile === "—" || mobile === "") return;
    push(topic, name, String(note || mobile), /poor/i.test(String(note)) ? "red" : "yellow");
  });

  return topics.slice(0, 10);
}

/**
 * TrialReport.dc.html — Day-30 before-and-after for free-month accounts.
 * Live: billing trial clock + changes + site audit / PageSpeed topic reports.
 */
export default function TrialReportScreen() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [changes, setChanges] = useState([]);
  const [auditCounts, setAuditCounts] = useState({ red: 0, yellow: 0, green: 0 });
  const [auditPayload, setAuditPayload] = useState(null);
  const [onPagePayload, setOnPagePayload] = useState(null);
  const [scanSnapshot, setScanSnapshot] = useState(null);
  const [organic, setOrganic] = useState(null);
  const [ga4, setGa4] = useState(null);
  const { hostname } = activeSiteContext(loadJourney());
  const user = typeof window !== "undefined" ? getUser() : null;

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    Promise.all([
      getBillingAccount().catch(() => ({ ok: false })),
      listChanges().catch(() => ({ ok: false })),
      loadFeature("site-audit").catch(() => ({ ok: false })),
      loadFeature("on-page-seo").catch(() => ({ ok: false })),
      loadFeature("organic-search").catch(() => ({ ok: false })),
      loadFeature("ga4-overview").catch(() => ({ ok: false })),
      getSiteScan().catch(() => ({ ok: false })),
    ])
      .then(([bill, ch, auditFeat, onPageFeat, organicFeat, ga4Feat, scanRes]) => {
        if (cancel) return;
        if (bill?.ok) setAccount(bill.data || bill);
        const rows = Array.isArray(ch?.data) ? ch.data : ch?.data?.changes || ch?.data?.rows || [];
        setChanges(Array.isArray(rows) ? rows.slice(0, 12) : []);

        const audit = featurePayload(auditFeat);
        const onPage = featurePayload(onPageFeat);
        setAuditPayload(audit);
        setOnPagePayload(onPage);
        setOrganic(featurePayload(organicFeat));
        setGa4(featurePayload(ga4Feat));

        const scan = scanRes?.ok ? scanRes.data?.scan || scanRes.data || null : null;
        setScanSnapshot(scan);

        const issues = audit.issues || audit.rows || scan?.findings || [];
        if (Array.isArray(issues) && issues.length) {
          let red = 0;
          let yellow = 0;
          let green = 0;
          issues.forEach((row) => {
            if (Array.isArray(row)) {
              const sev = String(row[1] || row[3] || "").toLowerCase();
              if (/fail|poor|critical|error|red|urgent/.test(sev)) red += 1;
              else if (/warn|average|medium|yellow|needs/.test(sev)) yellow += 1;
              else green += 1;
              return;
            }
            const sev = String(row.severity || row.color || row.tone || "").toLowerCase();
            if (/critical|error|red|urgent|poor/.test(sev)) red += 1;
            else if (/warn|medium|yellow|average/.test(sev)) yellow += 1;
            else green += 1;
          });
          if (scan?.counts) {
            red = Math.max(red, Number(scan.counts.red) || 0);
            yellow = Math.max(yellow, Number(scan.counts.yellow) || 0);
            green = Math.max(green, Number(scan.counts.green) || 0);
          }
          setAuditCounts({ red, yellow, green });
        } else if (scan?.counts) {
          setAuditCounts({
            red: Number(scan.counts.red) || 0,
            yellow: Number(scan.counts.yellow) || 0,
            green: Number(scan.counts.green) || 0,
          });
        }
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  const trialDays = Number(account?.trialDays || 30);
  const joined = account?.joinedAt || account?.createdAt || account?.trialStartedAt;
  const ends = account?.trialEndsAt || account?.paidThrough || account?.renewsAt;
  const dayNum = useMemo(() => {
    if (!joined) return Math.min(28, trialDays - 2);
    const start = new Date(joined).getTime();
    if (!Number.isFinite(start)) return Math.min(28, trialDays - 2);
    const days = Math.max(1, Math.floor((Date.now() - start) / 86400000) + 1);
    return Math.min(days, trialDays);
  }, [joined, trialDays]);

  const daysLeft = useMemo(() => {
    if (ends) {
      const end = new Date(ends).getTime();
      if (Number.isFinite(end)) return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
    }
    return Math.max(0, trialDays - dayNum);
  }, [ends, trialDays, dayNum]);

  const name = firstName(user, account?.business);
  const moves = Number(account?.movesShipped || account?.measuredMoves || 0);

  const healthPack = useMemo(() => {
    const api = account?.trialHealth || {};
    const afterLive = {
      red: Number(api?.after?.red ?? auditCounts.red) || 0,
      yellow: Number(api?.after?.yellow ?? auditCounts.yellow) || 0,
      green: Number(api?.after?.green ?? auditCounts.green) || 0,
    };
    const beforeApi = api?.before || {};
    const hasBefore =
      Number(beforeApi.red) > 0 || Number(beforeApi.yellow) > 0 || Number(beforeApi.green) > 0;
    const before = hasBefore
      ? {
          red: Number(beforeApi.red) || 0,
          yellow: Number(beforeApi.yellow) || 0,
          green: Number(beforeApi.green) || 0,
        }
      : { ...afterLive };
    return { before, after: afterLive };
  }, [account?.trialHealth, auditCounts]);

  const beforeDots = useMemo(() => dotsFromCounts(healthPack.before), [healthPack.before]);
  const afterDots = useMemo(() => dotsFromCounts(healthPack.after), [healthPack.after]);
  const beforeLabel = healthLabel(healthPack.before);
  const afterLabel = healthLabel(healthPack.after);

  const topicReports = useMemo(() => {
    const fromAudit = extractAuditTopics(auditPayload || {}, onPagePayload || {});
    const fromScan = (scanSnapshot?.findings || [])
      .filter((f) => f.topic)
      .map((f) => ({
        topic: f.topic,
        label: f.label,
        detail: f.detail,
        severity: f.color === "red" ? "red" : "yellow",
      }));
    const fromRender = (scanSnapshot?.rendering?.issues || []).map((f) => ({
      topic: f.topic,
      label: f.label,
      detail: f.detail,
      severity: f.color === "red" ? "red" : "yellow",
    }));
    const merged = [...fromAudit];
    [...fromScan, ...fromRender].forEach((row) => {
      if (!merged.some((m) => m.topic === row.topic && m.label === row.label)) merged.push(row);
    });
    return merged.slice(0, 10);
  }, [auditPayload, onPagePayload, scanSnapshot]);

  const ssrSolutions = scanSnapshot?.rendering?.solutions || [];
  const renderMode = scanSnapshot?.rendering?.modeLabel || "";

  const liveFallback = useMemo(() => {
    const kpis = [...(organic?.kpis || []), ...((organic?.panels?.kpis) || [])];
    const pick = (...parts) => {
      const hit = kpis.find(
        (row) => Array.isArray(row) && parts.some((p) => String(row[0] || "").toLowerCase().includes(p)),
      );
      return asCount(hit?.[1]);
    };
    const queryRows = Array.isArray(organic?.rows)
      ? organic.rows
      : Array.isArray(organic?.panels?.queries)
        ? organic.panels.queries
        : [];
    let pageOne = pick("page one", "page 1", "top 10");
    if (!pageOne && queryRows.length) {
      pageOne = queryRows.reduce((n, row) => {
        let pos = 0;
        try {
          if (Array.isArray(row) && row.length >= 5) pos = Number(String(row[4]).replace(/,/g, ""));
          else if (row && typeof row === "object") pos = Number(row.position || row.rank || 0);
        } catch {
          pos = 0;
        }
        return pos > 0 && pos <= 10 ? n + 1 : n;
      }, 0);
    }
    const searches =
      pick("quer", "search", "keyword") ||
      (Array.isArray(queryRows) ? queryRows.length : 0) ||
      asCount(scanSnapshot?.visibility?.searches);
    const gaKpis = [...(ga4?.kpis || []), ...((ga4?.panels?.kpis) || [])];
    const leadHit = gaKpis.find(
      (row) =>
        Array.isArray(row) &&
        /conversion|key event|lead|call|form|contact/i.test(String(row[0] || "")),
    );
    return {
      healthyNow: asCount(healthPack.after.green) || asCount(scanSnapshot?.counts?.green) || asCount(auditCounts.green),
      healthyFrom: asCount(healthPack.before.green),
      searches,
      impressions: pick("impression", "show"),
      pageOne,
      clicks: pick("click"),
      leads: asCount(leadHit?.[1] || ga4?.conversions || ga4?.keyEvents || ga4?.leads),
    };
  }, [organic, ga4, scanSnapshot, healthPack, auditCounts.green]);

  const metrics = useMemo(() => {
    const apiRows = Array.isArray(account?.trialMetrics) ? account.trialMetrics : [];
    return HONEST_METRICS.map((label) => {
      const row = pickSinceRow(apiRows, label);
      let from = asCount(row?.from);
      let to = asCount(row?.to);
      let change = row?.change || "";

      if (label === "Healthy pages") {
        // Always prefer live heatmap for Now; Day 1 from stored baseline when present.
        to = liveFallback.healthyNow || to;
        if (liveFallback.healthyFrom > 0) from = liveFallback.healthyFrom;
        else if (!apiRows.length) from = to;
      } else if (!apiRows.length || (from === 0 && to === 0)) {
        if (label === "Searches you show up for") {
          to = liveFallback.searches;
          from = apiRows.length ? from : to;
        } else if (label === "Times Google showed your site") {
          to = liveFallback.impressions;
          from = apiRows.length ? from : to;
        } else if (label === "Searches on page one") {
          to = liveFallback.pageOne;
          from = apiRows.length ? from : to;
        } else if (label === "Clicks from Google") {
          to = liveFallback.clicks;
          from = apiRows.length ? from : to;
        } else if (label === "Calls and form leads") {
          to = liveFallback.leads;
          from = apiRows.length ? from : to;
        }
      } else {
        if (label === "Searches you show up for" && liveFallback.searches > to) to = liveFallback.searches;
        if (label === "Times Google showed your site" && liveFallback.impressions > to) to = liveFallback.impressions;
        if (label === "Searches on page one" && liveFallback.pageOne > to) to = liveFallback.pageOne;
        if (label === "Clicks from Google" && liveFallback.clicks > to) to = liveFallback.clicks;
        if (label === "Calls and form leads" && liveFallback.leads > to) to = liveFallback.leads;
      }

      if (!change) {
        if (from === 0 && to === 0) change = "Too early to call";
        else if (label === "Healthy pages" && to > from && to - from >= 3) change = "Proven";
        else if (to > from && from > 0) {
          const pct = Math.round(((to - from) / from) * 100);
          change = pct >= 10 ? `Early sign, +${pct}%` : "Early sign, rising";
        } else if (to > from) change = "Early sign";
        else if (to < from) change = "Still catching up";
        else change = "Too early to call";
      }

      const st = statusForChange(change);
      return {
        what: label,
        a: fmtCount(from),
        b: fmtCount(to),
        status: st.status,
        color: st.color,
      };
    });
  }, [account?.trialMetrics, liveFallback]);

  const metricsNote =
    account?.trialMetricsNote ||
    'From your Google Search Console and Analytics when connected. "Too early" means a fix went live recently or we do not have history yet.';

  const fixed = changes
    .filter((c) => /shipped|live|applied|published|approved/i.test(String(c.status || c.state || c.action || "live")))
    .slice(0, 5)
    .map((c) => {
      const text = c.summary || c.title || c.label || c.path || "Fix shipped to your site";
      const topic = classifyTopic(text);
      return topic ? `${TOPIC_LABEL[topic]} · ${text}` : text;
    });

  const coming = changes
    .filter((c) => /pending|queued|draft|waiting/i.test(String(c.status || c.state || "")))
    .slice(0, 3)
    .map((c) => ({
      what: c.summary || c.title || c.label || "Recent fix",
      when: c.eta || "Google still catching up",
    }));

  const endLabel = ends ? fmtDay(ends) : `day ${trialDays}`;
  const rangeLabel = joined
    ? `${hostname || "your site"} · ${fmtDay(joined)} to ${fmtDay(ends || new Date())}`
    : `${hostname || "your site"} · first ${dayNum} days`;

  if (loading) {
    return (
      <div className="v8-tr">
        <div className="v8-tr-inner">
          <SkeletonCards count={3} lines={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="v8-tr">
      <div className="v8-tr-inner">
        <span className="v8-tr-pills">
          <span className="v8-tr-pill">
            {account?.needsPaidPlan || account?.trialEnded
              ? "Free month ended"
              : `Day ${dayNum} of your free month`}
          </span>
          <span className="v8-tr-badge">
            {account?.needsPaidPlan || account?.trialEnded
              ? "Start a plan to unlock Searchify"
              : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left · ${trialDays}-day trial`}
          </span>
          {account?.sinceLive || auditPayload?.source === "google_pagespeed" ? (
            <span className="v8-tr-badge">LIVE DATA</span>
          ) : (
            <span className="v8-tr-badge">WORKSPACE</span>
          )}
        </span>
        <span className="v8-tr-script">Your first month, {name}.</span>
        <h1>Here&apos;s where you started, what we fixed, and what&apos;s moved so far.</h1>
        <span className="v8-tr-lede">
          {rangeLabel}. You&apos;re on day {dayNum} of {trialDays}
          {ends ? ` · free month ends ${endLabel}` : ""}. Some of this is early: Google is still catching up on your most
          recent fixes, so we&apos;ve marked what&apos;s proven and what&apos;s still coming.
          {account?.sinceNote ? ` ${account.sinceNote}` : ""}
        </span>
      </div>

      <section className="v8-tr-ba" aria-label="Before and after">
        <div className="v8-tr-card">
          <span className="v8-tr-card-label">DAY 1 · BEFORE</span>
          {beforeDots.length ? (
            <div className="v8-tr-dots" aria-hidden="true">
              {beforeDots.map((d, i) => (
                <span key={`b-${i}`} style={{ background: d.c, boxShadow: `0 0 6px ${d.g}` }} />
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: "#9AA1AB" }}>Run a site scan to capture your day-1 health.</p>
          )}
          <span style={{ fontSize: 14, color: "#D7DADE" }}>{beforeLabel}</span>
        </div>
        <div className="v8-tr-arrow" aria-hidden="true">
          →
        </div>
        <div className="v8-tr-card is-now">
          <span className="v8-tr-card-label">DAY {dayNum} · NOW</span>
          {afterDots.length ? (
            <div className="v8-tr-dots" aria-hidden="true">
              {afterDots.map((d, i) => (
                <span key={`a-${i}`} style={{ background: d.c, boxShadow: `0 0 6px ${d.g}` }} />
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: "#9AA1AB" }}>No live health counts yet — refresh the audit or site scan.</p>
          )}
          <span style={{ fontSize: 14, color: "#D7DADE" }}>{afterLabel}</span>
        </div>
      </section>

      <section className="v8-tr-section" aria-labelledby="pr-h">
        <h2 id="pr-h">The numbers, honestly</h2>
        <div className="v8-tr-table">
          <div style={{ minWidth: 620 }}>
            <div className="v8-tr-table-head" aria-hidden="true">
              <span>MEASURE</span>
              <span style={{ textAlign: "right" }}>DAY 1</span>
              <span style={{ textAlign: "right" }}>DAY {dayNum}</span>
              <span>STATUS</span>
            </div>
            {metrics.map((m) => (
              <div key={m.what} className="v8-tr-table-row">
                <span>{m.what}</span>
                <span style={{ textAlign: "right", fontFamily: "var(--mono)", color: "#9AA1AB" }}>{m.a}</span>
                <span style={{ textAlign: "right", fontFamily: "var(--mono)", fontWeight: 600 }}>{m.b}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: m.color }}>{m.status}</span>
              </div>
            ))}
          </div>
        </div>
        <span style={{ fontSize: 13, color: "#9AA1AB" }}>{metricsNote}</span>
      </section>

      {topicReports.length || ssrSolutions.length ? (
        <section className="v8-tr-section" aria-labelledby="topics-h">
          <h2 id="topics-h">Report by topic</h2>
          <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>
            Same areas as your free analysis — titles, descriptions, headings, CSS, JavaScript, images, SSR/CSR, LCP and
            CLS — from live PageSpeed and site crawl data
            {renderMode ? ` · ${renderMode}` : ""}.
          </span>
          {topicReports.length ? (
            <div className="v8-tr-table">
              <div style={{ minWidth: 620 }}>
                {topicReports.map((row) => (
                  <div
                    key={`${row.topic}-${row.label}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "100px minmax(0, 1fr) 90px",
                      gap: 12,
                      alignItems: "start",
                      padding: "13px 20px",
                      borderBottom: "1px solid #16181C",
                      fontSize: 15,
                    }}
                  >
                    <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#9AA1AB", paddingTop: 2 }}>
                      {TOPIC_LABEL[row.topic] || row.topic}
                    </span>
                    <span>
                      <strong style={{ fontWeight: 600 }}>{row.label}</strong>
                      {row.detail ? (
                        <span style={{ display: "block", fontSize: 13, color: "#9AA1AB", marginTop: 2 }}>{row.detail}</span>
                      ) : null}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: row.severity === "red" ? "#FF5A4E" : "#FFC53D",
                        textAlign: "right",
                      }}
                    >
                      {row.severity === "red" ? "Error" : "Warning"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {ssrSolutions.length ? (
            <div className="v8-tr-panel" style={{ maxWidth: "100%" }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>SSR fixes for images &amp; loading speed</h2>
              <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>
                Server-side rendering and image delivery — so LCP/TTFB improve before client JavaScript runs.
              </span>
              {ssrSolutions.map((row) => (
                <div key={row.label} className="v8-tr-fix-row">
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none", marginTop: 3 }}>
                    <path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      fill="none"
                      stroke="#3DDC84"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>
                    <strong style={{ fontWeight: 600 }}>
                      {TOPIC_LABEL[row.topic] ? `${TOPIC_LABEL[row.topic]} · ` : ""}
                      {row.label}
                    </strong>
                    {row.detail ? (
                      <span style={{ display: "block", fontSize: 13, color: "#9AA1AB", marginTop: 2 }}>{row.detail}</span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="v8-tr-split">
        <div className="v8-tr-panel">
          <h2>What we fixed together</h2>
          <span style={{ fontSize: 14, color: "#9AA1AB" }}>
            {moves ? `${moves} fixes approved and live. All undoable.` : "Fixes you approve will show up here."}
          </span>
          {(fixed.length ? fixed : ["Connect Google and approve your first move to start this list."]).map((f) => (
            <div key={f} className="v8-tr-fix-row">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none", marginTop: 3 }}>
                <path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  fill="none"
                  stroke="#3DDC84"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{f}</span>
            </div>
          ))}
        </div>
        <div className="v8-tr-panel is-warn">
          <h2>Still coming</h2>
          <span style={{ fontSize: 14, color: "#D7DADE", lineHeight: 1.5 }}>
            Recent fixes can take another 3 to 6 weeks for Google to fully reflect. We keep watching and mark what&apos;s
            proven here.
          </span>
          {(coming.length
            ? coming
            : [
                { what: "Newest title and description changes", when: "results in 3–6 weeks" },
                { what: "Internal link updates", when: "results in 3–6 weeks" },
              ]
          ).map((c) => (
            <div key={c.what} className="v8-tr-coming-row">
              <span>{c.what}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#FFC53D" }}>{c.when}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="v8-tr-decide" aria-labelledby="dec-h">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h2 id="dec-h">
            {account?.needsPaidPlan || account?.trialEnded
              ? "Your free month ended. Start a plan to unlock the rest of Searchify."
              : `Your free month ends on ${endLabel}.`}
          </h2>
          <span style={{ fontSize: 15, color: "#D7DADE" }}>
            {account?.needsPaidPlan || account?.trialEnded
              ? "Today’s moves stays on this report until you start Solo or Pro. Other tabs stay locked."
              : "Nothing to do if you’d like to keep going. Or choose what’s next:"}
          </span>
        </div>
        <div className="v8-tr-choices">
          <div className="v8-tr-choice is-primary">
            <span style={{ fontSize: 17, fontWeight: 600 }}>
              {account?.needsPaidPlan || account?.trialEnded ? "Start Solo" : "Keep going on Solo"}
            </span>
            <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5, flex: 1 }}>
              {account?.needsPaidPlan || account?.trialEnded
                ? "Unlock Today’s moves, scans, keywords, and the rest of your workspace."
                : `Continue after ${endLabel}. Results from your newest fixes land over the next two months.`}
            </span>
            <Link href="/app/billing">{account?.needsPaidPlan || account?.trialEnded ? "Start paid plan" : "Keep Solo"}</Link>
          </div>
          <div className="v8-tr-choice">
            <span style={{ fontSize: 17, fontWeight: 600 }}>Upgrade to Pro</span>
            <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5, flex: 1 }}>
              Unlimited fixes, calls and leads from Analytics, and tracking of whether AI answers mention you.
            </span>
            <Link href="/app/billing">See Pro</Link>
          </div>
          {account?.needsPaidPlan || account?.trialEnded ? null : (
            <div className="v8-tr-choice is-muted">
              <span style={{ fontSize: 17, fontWeight: 600 }}>Not right now</span>
              <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5, flex: 1 }}>
                Cancel before {endLabel} and you pay nothing. Every fix we made stays on your site.
              </span>
              <Link href="/app/cancel">Cancel my free month</Link>
            </div>
          )}
        </div>
      </section>

      <section className="v8-tr-note" aria-label="A note from the founder">
        <span style={{ fontSize: 16, lineHeight: 1.7 }}>
          {name}, thank you for being one of our early users. Every scan and fix runs on real search data and AI that we
          pay for, and we were glad to cover your first month, because we&apos;d rather earn your business than ask for
          it. If anything in this report doesn&apos;t make sense, or you&apos;d like a hand with what&apos;s next, just
          reply. A real person reads every message, usually me.
        </span>
        <FounderSignature />
      </section>
    </div>
  );
}
