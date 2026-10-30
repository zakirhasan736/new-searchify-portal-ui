"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { activeSiteContext } from "@/lib/siteContext";
import { loadJourney } from "@/lib/journey";
import { buildAuditFindings, resolveSeoScore } from "@/lib/auditFindings";
import {
  featureKpi,
  featurePayload,
  getSiteScan,
  inspectGoogleIndex,
  listChanges,
  loadFeature,
  researchAudit,
  runSiteScan,
} from "@/lib/v1Api";
import { SkeletonRows } from "@/components/v8/SkeletonWave";
import ProblemNotice from "@/components/v8/ProblemNotice";
import { problemsFrom } from "@/lib/problems";
import "@/styles/v8-screens.css";

const TOPICS = [
  { id: "status", label: "404 · 5xx errors", area: ["Status codes"], keys: ["status_", "scan_broken_", "gsc_search_console_page_not_found", "gsc_search_console_server"] },
  { id: "gsc", label: "Search Console", area: ["Search Console"], sources: ["gsc"] },
  { id: "indexing", label: "Indexing", area: ["Index", "Indexing", "Crawl"] },
  { id: "redirects", label: "Redirects", area: ["Redirects"] },
  { id: "links", label: "Broken links", area: ["Links"] },
  { id: "canonicals", label: "Canonicals", area: ["Canonical"] },
  { id: "robots", label: "Robots.txt & sitemap", area: ["Robots", "Sitemap"] },
  { id: "schema", label: "Schema", area: ["Schema"] },
  { id: "headings", label: "Headings H1–H6", area: ["Headings"], keys: ["heading_order", "no_h1_tag"] },
  { id: "spelling", label: "Typos", area: ["Spelling"] },
  { id: "titles", label: "Titles", area: ["Title"], keys: ["no_title", "title_too_long", "title_too_short", "duplicate_title", "irrelevant_title", "duplicate_title_tag"] },
  { id: "descriptions", label: "Descriptions", area: ["Description"], keys: ["no_description", "description_too_long", "description_too_short", "duplicate_description", "irrelevant_description"] },
  { id: "content", label: "Low content", area: ["Content", "Paragraphs"], keys: ["low_content_rate", "paragraph_content", "duplicate_content", "lorem_ipsum", "low_readability_rate"] },
  { id: "images", label: "Images", area: ["Images", "Image"] },
  { id: "faq", label: "FAQ · reviews · prices", area: ["FAQ"], keys: ["schema_faq", "schema_review", "schema_price", "faq_without_schema", "accordion_without_faq"] },
  { id: "assets", label: "CSS · scripts · speed", area: ["Assets", "Performance", "Speed", "Render"] },
  { id: "social", label: "Social & video", area: ["Social", "Video"] },
];

const SEVERITIES = [
  { id: "all", label: "All" },
  { id: "Critical", label: "Errors" },
  { id: "Warning", label: "Warnings" },
  { id: "Notice", label: "Notices" },
];

function findingKey(finding) {
  return String(finding.id || "").replace(/^(crawl|scan|site|gsc)-/, "");
}

function matchTopic(finding, topic) {
  const key = findingKey(finding);
  if (topic.keys && topic.keys.some((prefix) => key.startsWith(prefix))) return true;
  if (topic.sources && topic.sources.includes(finding.sourceKey)) return true;
  const area = String(finding.area || "").toLowerCase();
  return topic.area.some((token) => area === String(token).toLowerCase() || area.includes(String(token).toLowerCase()));
}

function richResultsTestUrl(page) {
  return `https://search.google.com/test/rich-results?url=${encodeURIComponent(page)}`;
}

function developerBrief(item) {
  const lines = [`${item.name} (${item.severity})`, "", item.fix || "", ""];
  (item.steps || []).forEach((step, index) => lines.push(`${index + 1}. ${step}`));
  lines.push("", "Pages:");
  (item.pageRows || []).slice(0, 40).forEach((page) => lines.push(`- ${page.url || "(site-wide)"}${page.status ? ` [HTTP ${page.status}]` : ""}${page.detail ? ` — ${page.detail}` : ""}`));
  if (item.helpUrl) lines.push("", `Guide: ${item.helpUrl}`);
  lines.push(`Source: ${item.sourceLabel || "Searchify audit"}`);
  return lines.join("\n");
}

function severityTone(severity) {
  const s = String(severity || "").toLowerCase();
  if (s.includes("critical") || s.includes("error") || s.includes("dire")) return { dot: "#FF5A4E", label: "ERROR" };
  if (s.includes("warn")) return { dot: "#FFC53D", label: "WARNING" };
  return { dot: "#4DA3FF", label: "NOTICE" };
}

function kpiPick(payload, labels) {
  for (const label of labels) {
    const value = featureKpi(payload, label);
    if (value != null && value !== "—") return value;
  }
  return "—";
}

export default function SiteAuditReportScreen() {
  const [hostname, setHostname] = useState("Your site");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [topic, setTopic] = useState("all");
  const [open, setOpen] = useState(null);
  const [findings, setFindings] = useState([]);
  const [speed, setSpeed] = useState({});
  const [gsc, setGsc] = useState({});
  const [seoScore, setSeoScore] = useState(null);
  const [seoSource, setSeoSource] = useState("");
  const [problems, setProblems] = useState([]);
  const [auditProblems, setAuditProblems] = useState([]);
  const [severity, setSeverity] = useState("all");
  const [report, setReport] = useState({});
  const [crawlState, setCrawlState] = useState(null);
  const [inspection, setInspection] = useState(null);
  const [inspectBusy, setInspectBusy] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [copied, setCopied] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setHostname(activeSiteContext(loadJourney()).hostname || "Your site");
      const site = activeSiteContext(loadJourney()).href || "";
      const [audit, organic, pages, landings, places, changes, scan, crawlRes, inspect] = await Promise.all([
        loadFeature("site-audit").catch(() => ({ ok: false })),
        loadFeature("organic-search").catch(() => ({ ok: false })),
        loadFeature("top-pages").catch(() => ({ ok: false })),
        loadFeature("ga4-landing-pages").catch(() => ({ ok: false })),
        loadFeature("places").catch(() => ({ ok: false })),
        listChanges({ force: false }).catch(() => ({ ok: false, data: [] })),
        getSiteScan(site).catch(() => ({ ok: false })),
        // The Searchify SEO crawl report (status codes, redirects, canonicals, titles, typos …).
        // This page used to read the site scan here, which has no crawl report, so those
        // findings never showed up.
        site ? researchAudit({ site, force: false }).catch(() => ({ ok: false })) : Promise.resolve({ ok: false }),
        loadFeature("gsc-index-inspection", { force: true }).catch(() => ({ ok: false })),
      ]);
      setProblems([...problemsFrom(scan, "site_scan"), ...(site ? problemsFrom(crawlRes, "site_audit") : [])]);
      const crawl = crawlRes?.ok ? crawlRes.data : null;
      setCrawlState(crawl ? { state: crawl.state, crawled: crawl.crawled, queued: crawl.queued, fetchedAt: crawl.fetchedAt, maxPages: crawl.maxPages } : null);
      const inspectPayload = featurePayload(inspect);
      setInspection(inspectPayload?.inspected ? inspectPayload : null);
      const auditPayload = featurePayload(audit);
      const built = buildAuditFindings({
        audit,
        pages,
        queries: organic,
        landings,
        places,
        changes: Array.isArray(changes.data) ? changes.data : changes.data?.changes || [],
        crawl,
        scanIssues: scan?.ok ? scan.data?.scan?.auditIssues || [] : [],
        gscIssues: inspectPayload?.issues || [],
      });
      const list = Array.isArray(built?.findings) ? built.findings : Array.isArray(built) ? built : [];
      setFindings(list);
      setReport(built?.report || {});
      setSpeed(auditPayload);
      setGsc(featurePayload(organic));
      const scored = resolveSeoScore(auditPayload, crawl?.report || null);
      setSeoScore(scored.seoScore);
      setSeoSource(scored.seoSource);
      setOpen((prev) => (list.some((item) => item.id === prev) ? prev : list[0]?.id || null));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const refreshAudit = async () => {
    setBusy(true);
    try {
      // The crawl needs the site address; without it the API answered "Add the website
      // address in setup first" and the refresh silently did nothing.
      const site = activeSiteContext(loadJourney()).href || "";
      const res = await researchAudit({ site, force: true }).catch(() => ({ ok: false }));
      setAuditProblems(problemsFrom(res, "site_audit"));
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const checkIndexing = async () => {
    setInspectBusy(true);
    try {
      const res = await inspectGoogleIndex({ limit: 20 }).catch(() => ({ ok: false }));
      setAuditProblems(problemsFrom(res, "search_console"));
      if (res.ok) setTopic("gsc");
      await reload();
    } finally {
      setInspectBusy(false);
    }
  };

  const rescanSite = async () => {
    setScanBusy(true);
    try {
      const res = await runSiteScan({ force: true }).catch(() => ({ ok: false }));
      setAuditProblems(problemsFrom(res, "site_scan"));
      await reload();
    } finally {
      setScanBusy(false);
    }
  };

  const copyBrief = async (item) => {
    try {
      await navigator.clipboard.writeText(developerBrief(item));
      setCopied(item.id);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      setCopied("");
    }
  };

  const bySeverity = useMemo(
    () => (severity === "all" ? findings : findings.filter((finding) => (finding.severity || "Notice") === severity)),
    [findings, severity],
  );

  const rows = useMemo(() => {
    if (topic === "all") return bySeverity;
    const meta = TOPICS.find((item) => item.id === topic);
    if (!meta) return bySeverity;
    return bySeverity.filter((finding) => matchTopic(finding, meta));
  }, [bySeverity, topic]);

  const topicCounts = useMemo(() => {
    const counts = { all: bySeverity.length };
    TOPICS.forEach((item) => {
      counts[item.id] = bySeverity.filter((finding) => matchTopic(finding, item)).length;
    });
    return counts;
  }, [bySeverity]);

  const severityCounts = useMemo(() => {
    const counts = { all: findings.length, Critical: 0, Warning: 0, Notice: 0 };
    findings.forEach((finding) => {
      const key = finding.severity || "Notice";
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [findings]);

  const selected = rows.find((item) => item.id === open) || rows[0] || null;

  const speedCards = [
    ["LCP", kpiPick(speed, ["lcp", "largest contentful paint"])],
    ["CLS", kpiPick(speed, ["cls", "cumulative layout shift"])],
    ["INP", kpiPick(speed, ["inp", "interaction to next paint", "fid"])],
    ["SEO", seoScore || kpiPick(speed, ["seo"])],
    ["Performance", kpiPick(speed, ["performance", "perf"])],
    ["Errors", String(findings.filter((f) => /critical|error/i.test(f.severity || "")).length)],
  ];

  const counts = report?.statusCounts || {};
  const statusCards = Object.keys(counts).length
    ? [
        ["2xx", counts["2xx"] || 0, "#3DDC84", "Pages that load"],
        ["3xx", counts["3xx"] || 0, "#4DA3FF", "Redirects"],
        ["404", (counts["404"] || 0) + (counts["410"] || 0), "#FF9F43", "Not found / gone"],
        ["4xx", counts["4xx"] || 0, "#FF9F43", "Blocked, 401, 403 …"],
        ["5xx", (counts["5xx"] || 0) + (counts["500"] || 0) + (counts["502"] || 0) + (counts["503"] || 0), "#FF5A4E", "500, 502, 503 …"],
      ]
    : [];

  const gscCards = [
    ["Clicks", featureKpi(gsc, "click")],
    ["Impressions", featureKpi(gsc, "impr")],
    ["CTR", featureKpi(gsc, "ctr")],
    ["Avg position", featureKpi(gsc, "pos")],
  ];

  return (
    <div
      style={{
        flex: "999 1 560px",
        minWidth: 0,
        minHeight: 1240,
        background: "#0A0B0D",
        color: "#F2F4F5",
        fontFamily: "Geist, 'Helvetica Neue', sans-serif",
        boxSizing: "border-box",
        padding: "22px clamp(16px, 4vw, 56px) 56px",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <Link
          href="/app"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "40px",
            padding: "0 14px",
            borderRadius: "999px",
            border: "1px solid #262A31",
            color: "#F2F4F5",
            textDecoration: "none",
            fontSize: "13px",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Home
        </Link>
        <Link
          href="/app/workspace"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            minHeight: "40px",
            padding: "0 12px",
            borderRadius: "10px",
            color: "#F2F4F5",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "15px",
          }}
        >
          {hostname}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA1AB" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M7 10l5 5 5-5" />
          </svg>
        </Link>
      </header>

      <ProblemNotice
        problems={[...auditProblems, ...problems]}
        onRetry={() => refreshAudit()}
        style={{ maxWidth: "1180px", width: "100%", margin: "0 auto" }}
      />

      <div style={{ maxWidth: "1180px", width: "100%", margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
              fontSize: "clamp(36px, 4.6vw, 58px)",
              lineHeight: 1,
              letterSpacing: "-1.6px",
              fontWeight: 700,
            }}
          >
            Site audit report
          </h1>
          <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", fontSize: "14px", color: "#9AA1AB" }}>
            <span>
              <strong style={{ color: "#F2F4F5" }}>{findings.length}</strong> findings
            </span>
            <span>
              SEO score <strong style={{ color: "#D5F879" }}>{seoScore || "—"}</strong>
            </span>
            <span>{seoSource || "PageSpeed + Search Console + crawl"}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Link
            href="/app/results"
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: "44px",
              padding: "0 16px",
              borderRadius: "12px",
              border: "1px solid #262A31",
              color: "#F2F4F5",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            Open site scan
          </Link>
          <button type="button" onClick={rescanSite} disabled={scanBusy} style={secondaryBtn}>
            {scanBusy ? "Scanning pages…" : "Rescan pages"}
          </button>
          <button type="button" onClick={checkIndexing} disabled={inspectBusy} style={secondaryBtn}>
            {inspectBusy ? "Asking Google…" : "Check indexing in Search Console"}
          </button>
          <button
            type="button"
            onClick={refreshAudit}
            disabled={busy}
            style={{
              minHeight: "44px",
              padding: "0 18px",
              borderRadius: "12px",
              border: 0,
              background: "#4DA3FF",
              color: "#0A0B0D",
              fontSize: "14px",
              fontWeight: 600,
              boxShadow: "0 0 20px rgba(77,163,255,.4)",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Refreshing…" : "Refresh audit"}
          </button>
        </div>
      </div>

      {crawlState?.state === "crawling" ? (
        <p role="status" style={{ maxWidth: "1180px", width: "100%", margin: "0 auto", fontSize: "14px", color: "#4DA3FF" }}>
          Site crawl in progress: {crawlState.crawled || 0} pages read{crawlState.queued ? `, ${crawlState.queued} queued` : ""}. Findings below are from the last finished crawl and the page scan; check back in a few minutes.
        </p>
      ) : null}

      {statusCards.length ? (
        <div aria-label="HTTP status codes" style={{ maxWidth: "1180px", width: "100%", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px" }}>
          {statusCards.map(([label, value, color, hint]) => (
            <button
              key={label}
              type="button"
              onClick={() => setTopic(label === "2xx" || label === "3xx" ? (label === "3xx" ? "redirects" : "all") : "status")}
              title={hint}
              style={{ textAlign: "left", borderRadius: "16px", background: "#101215", border: "1px solid #1A1D22", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "4px", color: "#F2F4F5", cursor: "pointer" }}
            >
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#7D848E" }}>HTTP {label}</span>
              <strong style={{ fontSize: "20px", color }}>{value}</strong>
              <span style={{ fontSize: "11px", color: "#7D848E" }}>{hint}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div style={{ maxWidth: "1180px", width: "100%", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px" }}>
        {speedCards.map(([label, value]) => (
          <div key={label} style={{ borderRadius: "16px", background: "#101215", border: "1px solid #1A1D22", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#7D848E" }}>{label}</span>
            <strong style={{ fontSize: "20px" }}>{value}</strong>
          </div>
        ))}
      </div>

      <div role="group" aria-label="Severity" style={{ maxWidth: "1180px", width: "100%", margin: "0 auto", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#7D848E", width: "56px" }}>SHOW</span>
        {SEVERITIES.map((item) => {
          const active = severity === item.id;
          const dot = item.id === "Critical" ? "#FF5A4E" : item.id === "Warning" ? "#FFC53D" : item.id === "Notice" ? "#4DA3FF" : "#9AA1AB";
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => setSeverity(item.id)}
              style={{ ...chipBtn, border: active ? `1px solid ${dot}` : "1px solid #262A31", background: active ? "rgba(255,255,255,.04)" : "transparent", fontWeight: active ? 600 : 400 }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot }} />
              {item.label} <span style={{ fontFamily: "'Geist Mono', monospace", color: "#9AA1AB" }}>{severityCounts[item.id] || 0}</span>
            </button>
          );
        })}
      </div>

      <div style={{ maxWidth: "1180px", width: "100%", margin: "0 auto", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#7D848E", width: "56px" }}>TOPIC</span>
        <button
          type="button"
          aria-pressed={topic === "all"}
          onClick={() => setTopic("all")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            minHeight: "38px",
            padding: "0 13px",
            borderRadius: "999px",
            border: topic === "all" ? "1px solid #4DA3FF" : "1px solid #262A31",
            background: topic === "all" ? "rgba(77,163,255,.12)" : "transparent",
            color: "#F2F4F5",
            fontSize: "13px",
            fontWeight: topic === "all" ? 600 : 400,
          }}
        >
          All <span style={{ fontFamily: "'Geist Mono', monospace", color: "#9AA1AB" }}>{topicCounts.all}</span>
        </button>
        {TOPICS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={topic === item.id}
            onClick={() => setTopic(item.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              minHeight: "38px",
              padding: "0 13px",
              borderRadius: "999px",
              border: topic === item.id ? "1px solid #4DA3FF" : "1px solid #262A31",
              background: topic === item.id ? "rgba(77,163,255,.12)" : "transparent",
              color: "#D7DADE",
              fontSize: "13px",
              fontWeight: topic === item.id ? 600 : 400,
            }}
          >
            {item.label} <span style={{ fontFamily: "'Geist Mono', monospace", color: "#9AA1AB" }}>{topicCounts[item.id] || 0}</span>
          </button>
        ))}
      </div>

      <div
        className="sf-audit-split"
        style={{
          maxWidth: "1180px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: "18px",
          alignItems: "flex-start",
        }}
      >
        <section
          aria-label="Audit findings"
          style={{
            flex: "999 1 560px",
            minWidth: 0,
            borderRadius: "22px",
            background: "#101215",
            border: "1px solid #1A1D22",
            overflow: "hidden",
          }}
        >
          {loading ? <div style={{ padding: "18px" }}><SkeletonRows count={8} /></div> : null}
          {!loading && rows.length === 0 ? (
            <p style={{ margin: 0, padding: "22px", fontSize: "14px", color: "#9AA1AB" }}>
              No findings in this topic yet. Connect Search Console and refresh the audit.
            </p>
          ) : null}
          {!loading
            ? rows.map((item) => {
                const tone = severityTone(item.severity);
                const isOpen = selected?.id === item.id;
                return (
                  <div key={item.id} style={{ borderBottom: "1px solid #1A1D22" }}>
                    <button
                      type="button"
                      onClick={() => setOpen(item.id)}
                      aria-expanded={isOpen}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        background: isOpen ? "rgba(77,163,255,.06)" : "transparent",
                        border: 0,
                        color: "#F2F4F5",
                        padding: "16px 22px",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: tone.dot, flex: "none" }} />
                      <span
                        style={{
                          fontFamily: "'Geist Mono', monospace",
                          fontSize: "11px",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid #262A31",
                          color: "#D7DADE",
                          width: "92px",
                          textAlign: "center",
                          boxSizing: "border-box",
                        }}
                      >
                        {tone.label}
                      </span>
                      <span style={{ flex: "1 1 240px", minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "15px" }}>{item.name}</span>
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px", color: "#9AA1AB" }}>
                          {item.area || "Audit"} · {item.count || 1} page{(item.count || 1) === 1 ? "" : "s"}
                        </span>
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9AA1AB" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s ease" }}>
                        <path d="M7 10l5 5 5-5" />
                      </svg>
                    </button>
                    {isOpen ? (
                      <div style={{ padding: "0 22px 20px 48px", display: "flex", flexDirection: "column", gap: "12px", animation: "sfy-rise .2s ease both" }}>
                        <p style={{ margin: 0, fontSize: "14px", color: "#9AA1AB", lineHeight: 1.55 }}>{item.evidence || item.detail}</p>
                        {item.sourceLabel ? (
                          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#7D848E" }}>SOURCE · {item.sourceLabel}</span>
                        ) : null}

                        {Array.isArray(item.pageRows) && item.pageRows.length ? (
                          <div style={{ borderRadius: "12px", border: "1px solid #1A1D22", overflow: "hidden" }}>
                            <div style={{ padding: "8px 12px", background: "#0A0B0D", fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#7D848E" }}>
                              {item.pageRows.some((p) => p.url) ? `AFFECTED PAGES · ${item.count || item.pageRows.length}` : "DETAILS"}
                            </div>
                            {item.pageRows.slice(0, 25).map((page, index) => (
                              <div key={`${page.url}-${index}`} style={{ padding: "10px 12px", borderTop: "1px solid #1A1D22", display: "flex", flexDirection: "column", gap: "4px" }}>
                                {page.url ? (
                                  <span style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                                    {page.status ? (
                                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", padding: "2px 6px", borderRadius: "6px", background: page.status >= 500 ? "rgba(255,90,78,.15)" : page.status >= 400 ? "rgba(255,159,67,.15)" : "rgba(77,163,255,.12)", color: page.status >= 400 ? "#FF8A80" : "#9CC8FF" }}>
                                        {page.status}
                                      </span>
                                    ) : null}
                                    <a href={page.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px", color: "#D7DADE", overflowWrap: "anywhere" }}>
                                      {page.url}
                                    </a>
                                  </span>
                                ) : null}
                                {page.detail ? <span style={{ fontSize: "13px", color: "#B6BCC5", lineHeight: 1.5 }}>{page.detail}</span> : null}
                              </div>
                            ))}
                            {item.pageRows.length > 25 || (item.count || 0) > item.pageRows.length ? (
                              <div style={{ padding: "8px 12px", borderTop: "1px solid #1A1D22", fontSize: "12px", color: "#7D848E" }}>
                                Showing {Math.min(25, item.pageRows.length)} of {Math.max(item.count || 0, item.pageRows.length)}. Copy the fix for the full list.
                              </div>
                            ) : null}
                          </div>
                        ) : null}

                        {item.fix ? (
                          <div style={{ borderRadius: "12px", background: "#0A0B0D", border: "1px solid #1A1D22", padding: "12px 14px" }}>
                            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#4DA3FF" }}>HOW TO FIX</span>
                            <p style={{ margin: "6px 0 0", fontSize: "14px", lineHeight: 1.5 }}>{item.fix}</p>
                            {Array.isArray(item.steps) && item.steps.length ? (
                              <ol style={{ margin: "10px 0 0", padding: 0, listStyle: "none", color: "#D7DADE", fontSize: "13px", lineHeight: 1.5, display: "flex", flexDirection: "column", gap: "6px" }}>
                                {item.steps.map((step, index) => (
                                  <li key={index} style={{ display: "flex", gap: "8px" }}>
                                    <span style={{ flex: "none", width: "18px", fontFamily: "'Geist Mono', monospace", color: "#4DA3FF" }}>{index + 1}.</span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ol>
                            ) : null}
                          </div>
                        ) : null}

                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {item.changeId ? (
                            <Link href={`/app/queue/${item.changeId}`} style={primaryLink}>
                              Review in queue
                            </Link>
                          ) : null}
                          {item.helpUrl ? (
                            <a href={item.helpUrl} target="_blank" rel="noopener noreferrer" style={ghostLink}>
                              Google guide ↗
                            </a>
                          ) : null}
                          {/^Schema$/i.test(item.area || "") && item.pageRows?.find((p) => p.url) ? (
                            <a href={richResultsTestUrl(item.pageRows.find((p) => p.url).url)} target="_blank" rel="noopener noreferrer" style={ghostLink}>
                              Test in Rich Results Test ↗
                            </a>
                          ) : null}
                          {item.sourceKey === "gsc" ? (
                            <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" style={ghostLink}>
                              Open Search Console ↗
                            </a>
                          ) : null}
                          <button type="button" onClick={() => copyBrief(item)} style={ghostLink}>
                            {copied === item.id ? "Copied" : "Copy fix for developer"}
                          </button>
                          <a
                            href={`mailto:support@searchify.io?subject=${encodeURIComponent(`Audit help: ${item.name}`)}&body=${encodeURIComponent(developerBrief(item))}`}
                            style={ghostLink}
                          >
                            Ask support
                          </a>
                          <button
                            type="button"
                            onClick={item.sourceKey === "gsc" ? checkIndexing : item.sourceKey === "scan" || item.sourceKey === "site" ? rescanSite : refreshAudit}
                            style={ghostLink}
                          >
                            Re-check
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            : null}
        </section>

        <aside
          aria-label="Report summary"
          style={{
            flex: "1 1 320px",
            minWidth: "280px",
            position: "sticky",
            top: "18px",
            alignSelf: "flex-start",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ borderRadius: "24px", background: "#101215", border: "1px solid #1A1D22", padding: "22px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "16px", fontWeight: 600 }}>Search Console</span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#9AA1AB" }}>LIVE</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {gscCards.map(([label, value]) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#7D848E" }}>{label}</span>
                  <span style={{ fontSize: "18px" }}>{value}</span>
                </div>
              ))}
            </div>
            {inspection ? (
              <button type="button" onClick={() => setTopic("gsc")} style={{ ...ghostLink, justifyContent: "space-between", width: "100%" }}>
                <span>Indexed by Google</span>
                <strong>
                  {inspection.indexed} / {inspection.inspected}
                </strong>
              </button>
            ) : null}
            <p style={{ margin: 0, fontSize: "13px", color: "#9AA1AB", lineHeight: 1.45 }}>
              {inspection
                ? `URL Inspection checked ${inspection.inspected} important pages on ${String(inspection.checkedAt || "").slice(0, 10)}. Coverage, canonical and schema errors from Google are in the Search Console topic.`
                : "Click “Check indexing in Search Console” to ask Google which important pages are indexed, and why others aren't."}
            </p>
          </div>

          <div style={{ borderRadius: "24px", background: "#101215", border: "1px solid #1A1D22", padding: "22px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <span style={{ fontSize: "16px", fontWeight: 600 }}>Selected finding</span>
            {selected ? (
              <>
                <strong style={{ fontSize: "18px", letterSpacing: "-0.3px" }}>{selected.name}</strong>
                <span style={{ fontSize: "13px", color: "#9AA1AB" }}>{selected.detail || selected.area}</span>
                {(selected.pages || []).slice(0, 4).map((page) => (
                  <span key={page} style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px", color: "#7D848E", overflowWrap: "anywhere" }}>
                    {page}
                  </span>
                ))}
              </>
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: "#9AA1AB" }}>Pick a finding on the left.</p>
            )}
          </div>

          <div style={{ borderRadius: "24px", background: "#101215", border: "1px solid #1A1D22", padding: "22px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "16px", fontWeight: 600 }}>Also covered</span>
            {[
              "404, 410, 403, 500, 502, 503 status codes with linking pages",
              "Search Console coverage, canonical and rich-result errors",
              "Redirect chains, loops, http → https, www",
              "Broken links, missing images / CSS / scripts",
              "Canonicals and noindex / robots.txt blocks",
              "robots.txt rules and XML sitemap URLs",
              "Schema: FAQ, accordion, product price (low / high), reviews, breadcrumbs, business, article, video, image",
              "Heading order H1–H6 by section, duplicate H1",
              "Typos in titles, headings and text",
              "Title and description length, missing, duplicate",
              "Low content and paragraphs",
              "Images: alt, size, file names",
            ].map((label) => (
              <span key={label} style={{ fontSize: "13px", color: "#9AA1AB", padding: "8px 0", borderTop: "1px solid #1A1D22" }}>
                {label}
              </span>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

const secondaryBtn = {
  minHeight: "44px",
  padding: "0 16px",
  borderRadius: "12px",
  border: "1px solid #262A31",
  background: "transparent",
  color: "#F2F4F5",
  fontSize: "14px",
  cursor: "pointer",
};

const chipBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  minHeight: "36px",
  padding: "0 12px",
  borderRadius: "999px",
  background: "transparent",
  color: "#D7DADE",
  fontSize: "13px",
  cursor: "pointer",
};

const primaryLink = {
  minHeight: "40px",
  padding: "0 14px",
  borderRadius: "10px",
  background: "#4DA3FF",
  color: "#0A0B0D",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  fontSize: "13px",
  fontWeight: 600,
};

const ghostLink = {
  minHeight: "40px",
  padding: "0 14px",
  borderRadius: "10px",
  border: "1px solid #262A31",
  background: "transparent",
  color: "#D7DADE",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "13px",
  cursor: "pointer",
};
