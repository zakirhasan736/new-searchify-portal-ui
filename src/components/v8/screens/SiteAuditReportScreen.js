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
  listChanges,
  loadFeature,
  researchAudit,
} from "@/lib/v1Api";
import { SkeletonRows } from "@/components/v8/SkeletonWave";
import "@/styles/v8-screens.css";

const TOPICS = [
  { id: "indexing", label: "Page indexing", area: ["Index", "Indexing", "Crawl"] },
  { id: "canonicals", label: "Canonicals", area: ["Canonical", "Meta"] },
  { id: "sitemap", label: "Sitemap & robots", area: ["Sitemap", "Robots"] },
  { id: "speed", label: "Speed · LCP · CLS", area: ["Speed", "Performance", "Page"] },
  { id: "assets", label: "CSS · scripts · weight", area: ["Assets", "Performance"] },
  { id: "titles", label: "Titles", area: ["Meta", "Title"] },
  { id: "descriptions", label: "Descriptions", area: ["Meta", "Description"] },
  { id: "content", label: "Content length", area: ["Content", "Page"] },
  { id: "images", label: "Images", area: ["Images", "Image"] },
  { id: "videos", label: "Videos", area: ["Video", "Videos"] },
  { id: "faq", label: "FAQ & reviews", area: ["FAQ", "Reviews", "Schema"] },
  { id: "llm", label: "LLM / AI crawl gaps", area: ["AI", "LLM", "Schema"] },
];

function matchTopic(finding, topic) {
  const blob = `${finding.area || ""} ${finding.name || ""} ${finding.fix || ""}`.toLowerCase();
  return topic.area.some((token) => blob.includes(String(token).toLowerCase()));
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

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setHostname(activeSiteContext(loadJourney()).hostname || "Your site");
      const [audit, organic, pages, landings, places, changes, crawl] = await Promise.all([
        loadFeature("site-audit").catch(() => ({ ok: false })),
        loadFeature("organic-search").catch(() => ({ ok: false })),
        loadFeature("top-pages").catch(() => ({ ok: false })),
        loadFeature("ga4-landing-pages").catch(() => ({ ok: false })),
        loadFeature("places").catch(() => ({ ok: false })),
        listChanges({ force: false }).catch(() => ({ ok: false, data: [] })),
        getSiteScan().catch(() => ({ ok: false })),
      ]);
      const auditPayload = featurePayload(audit);
      const built = buildAuditFindings({
        audit,
        pages,
        queries: organic,
        landings,
        places,
        changes: Array.isArray(changes.data) ? changes.data : changes.data?.changes || [],
        crawl: crawl?.ok ? crawl.data : null,
      });
      const list = Array.isArray(built?.findings) ? built.findings : Array.isArray(built) ? built : [];
      setFindings(list);
      setSpeed(auditPayload);
      setGsc(featurePayload(organic));
      const scored = resolveSeoScore(auditPayload, crawl?.data?.report || null);
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
      await researchAudit({ force: true }).catch(() => null);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const rows = useMemo(() => {
    if (topic === "all") return findings;
    const meta = TOPICS.find((item) => item.id === topic);
    if (!meta) return findings;
    return findings.filter((finding) => matchTopic(finding, meta));
  }, [findings, topic]);

  const topicCounts = useMemo(() => {
    const counts = { all: findings.length };
    TOPICS.forEach((item) => {
      counts[item.id] = findings.filter((finding) => matchTopic(finding, item)).length;
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

      <div style={{ maxWidth: "1180px", width: "100%", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px" }}>
        {speedCards.map(([label, value]) => (
          <div key={label} style={{ borderRadius: "16px", background: "#101215", border: "1px solid #1A1D22", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#7D848E" }}>{label}</span>
            <strong style={{ fontSize: "20px" }}>{value}</strong>
          </div>
        ))}
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
                        {item.fix ? (
                          <div style={{ borderRadius: "12px", background: "#0A0B0D", border: "1px solid #1A1D22", padding: "12px 14px" }}>
                            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#4DA3FF" }}>AI HELPED SOLUTION</span>
                            <p style={{ margin: "6px 0 0", fontSize: "14px", lineHeight: 1.5 }}>{item.fix}</p>
                          </div>
                        ) : null}
                        {Array.isArray(item.steps) && item.steps.length ? (
                          <ol style={{ margin: 0, paddingLeft: "18px", color: "#D7DADE", fontSize: "13px", lineHeight: 1.5, display: "flex", flexDirection: "column", gap: "6px" }}>
                            {item.steps.map((step, index) => (
                              <li key={index}>{step}</li>
                            ))}
                          </ol>
                        ) : null}
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {item.changeId ? (
                            <Link href={`/app/queue/${item.changeId}`} style={{ minHeight: "40px", padding: "0 14px", borderRadius: "10px", background: "#4DA3FF", color: "#0A0B0D", textDecoration: "none", display: "inline-flex", alignItems: "center", fontSize: "13px", fontWeight: 600 }}>
                              Review in queue
                            </Link>
                          ) : (
                            <Link href="/app/queue" style={{ minHeight: "40px", padding: "0 14px", borderRadius: "10px", border: "1px solid #262A31", color: "#D7DADE", textDecoration: "none", display: "inline-flex", alignItems: "center", fontSize: "13px" }}>
                              Open Today queue
                            </Link>
                          )}
                          <Link href="/app/results" style={{ minHeight: "40px", padding: "0 14px", borderRadius: "10px", border: "1px solid #262A31", color: "#D7DADE", textDecoration: "none", display: "inline-flex", alignItems: "center", fontSize: "13px" }}>
                            Site scan board
                          </Link>
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
            <p style={{ margin: 0, fontSize: "13px", color: "#9AA1AB", lineHeight: 1.45 }}>
              Indexing, queries and page evidence feed title, description, FAQ, video and image findings on the left.
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
            {["Page indexing errors", "Canonicals", "Sitemap / robots", "LCP · CLS · scripts · CSS", "Titles & descriptions", "Content length", "Images & videos", "FAQ / reviews", "LLM crawl gaps"].map((label) => (
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
