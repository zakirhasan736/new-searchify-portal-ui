"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { activeSiteContext } from "@/lib/siteContext";
import { loadJourney } from "@/lib/journey";
import {
  getAiVisibility,
  getBusinessProfile,
  queueAiVisibilityFix,
  runAiVisibility,
} from "@/lib/v1Api";
import { SkeletonCards, SkeletonRows } from "@/components/v8/SkeletonWave";
import "@/styles/v8-screens.css";

const ALL = "All engines";

function scorePct(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function SolutionDrawer({ check, busy, onClose, onQueue }) {
  if (!check) return null;
  const solution = check.solution || {};
  const steps = Array.isArray(solution.steps) ? solution.steps : [];
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sf-vis-sol-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        display: "flex",
        justifyContent: "flex-end",
        background: "rgba(0,0,0,.55)",
      }}
    >
      <button type="button" aria-label="Close" onClick={onClose} style={{ position: "absolute", inset: 0, border: 0, background: "transparent" }} />
      <aside
        style={{
          position: "relative",
          width: "min(440px, 100%)",
          height: "100%",
          background: "#101215",
          borderLeft: "1px solid #1A1D22",
          padding: "24px 22px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          overflowY: "auto",
          color: "#F2F4F5",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#7D848E" }}>{check.engine}</span>
          <button type="button" onClick={onClose} style={{ border: 0, background: "transparent", color: "#9AA1AB", fontSize: "22px", lineHeight: 1 }}>
            ×
          </button>
        </div>
        <h2 id="sf-vis-sol-title" style={{ margin: 0, fontSize: "22px", fontWeight: 600, letterSpacing: "-0.4px" }}>
          {solution.title || check.suggestion || "Fix this gap"}
        </h2>
        {check.error ? <p style={{ margin: 0, fontSize: "14px", color: "#FF8E86", lineHeight: 1.5 }}>{check.error}</p> : null}
        {solution.why && solution.why !== check.error ? (
          <p style={{ margin: 0, fontSize: "14px", color: "#9AA1AB", lineHeight: 1.5 }}>{solution.why}</p>
        ) : null}
        <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#7D848E" }}>PROMPT</div>
        <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.45 }}>{check.prompt}</p>
        {steps.length ? (
          <ol style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "8px", color: "#D7DADE", fontSize: "14px", lineHeight: 1.5 }}>
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        ) : null}
        {solution.titleDraft ? (
          <div style={{ borderRadius: "14px", border: "1px solid #262A31", background: "#0A0B0D", padding: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#7D848E" }}>Suggested title</span>
            <strong style={{ fontSize: "15px" }}>{solution.titleDraft}</strong>
            {solution.descriptionDraft ? <p style={{ margin: 0, fontSize: "13px", color: "#9AA1AB" }}>{solution.descriptionDraft}</p> : null}
          </div>
        ) : null}
        <div style={{ marginTop: "auto", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            disabled={busy}
            onClick={() => onQueue(check)}
            style={{
              minHeight: "48px",
              padding: "0 18px",
              borderRadius: "12px",
              border: 0,
              background: "#4DA3FF",
              color: "#0A0B0D",
              fontWeight: 600,
              fontSize: "14px",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Sending…" : "Send fix to Today queue"}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ minHeight: "48px", padding: "0 16px", borderRadius: "12px", border: "1px solid #262A31", background: "transparent", color: "#D7DADE", fontSize: "14px" }}
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}

export default function VisibilityScreen() {
  const [hostname, setHostname] = useState("Your site");
  const [profile, setProfile] = useState({});
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [queueBusy, setQueueBusy] = useState(false);
  const [engine, setEngine] = useState(ALL);
  const [open, setOpen] = useState(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setHostname(activeSiteContext(loadJourney()).hostname || "Your site");
      const [bp, vis] = await Promise.all([getBusinessProfile(), getAiVisibility({ force: true })]);
      setProfile(bp.data?.profile || {});
      setReport(vis.data?.report || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const engines = report?.engines || [];
  const checks = useMemo(() => {
    const list = report?.checks || [];
    if (engine === ALL) return list;
    return list.filter((c) => c.engine === engine);
  }, [report, engine]);

  const issues = checks.filter((c) => c.status !== "ok" && c.status !== "not_checked");
  const ready = Boolean((profile.business || "").trim() && (profile.services || "").trim());
  const overall = useMemo(() => {
    const scored = engines.map((row) => scorePct(row.score)).filter((n) => n != null);
    if (!scored.length) return null;
    return Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
  }, [engines]);

  const run = async () => {
    setBusy(true);
    setNote("");
    const res = await runAiVisibility();
    setBusy(false);
    if (!res.ok) {
      setNote(res.data?.detail || "Could not run the AI visibility report.");
      return;
    }
    setReport(res.data.report);
    setNote("Visibility report ready.");
  };

  const queueFix = async (check) => {
    setQueueBusy(true);
    const res = await queueAiVisibilityFix({ checkId: check.id });
    setQueueBusy(false);
    if (!res.ok) {
      setNote(res.data?.detail || "Could not add this to the work queue.");
      return;
    }
    setNote("Fix sent to the Today queue.");
    setOpen(null);
  };

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

      <div style={{ maxWidth: "1120px", width: "100%", margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
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
            AI visibility
          </h1>
          <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", fontSize: "14px", color: "#9AA1AB" }}>
            <span>
              Domain <strong style={{ color: "#F2F4F5" }}>{hostname}</strong>
            </span>
            <span>
              Overall <strong style={{ color: "#D5F879" }}>{overall == null ? "—" : `${overall}%`}</strong>
            </span>
            <span>
              Gaps <strong style={{ color: "#F2F4F5" }}>{issues.length}</strong>
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={busy || !ready}
          style={{
            minHeight: "48px",
            padding: "0 20px",
            borderRadius: "12px",
            border: 0,
            background: ready ? "#4DA3FF" : "#262A31",
            color: ready ? "#0A0B0D" : "#7D848E",
            fontSize: "14px",
            fontWeight: 600,
            boxShadow: ready ? "0 0 20px rgba(77,163,255,.35)" : "none",
            cursor: ready ? "pointer" : "not-allowed",
          }}
        >
          {busy ? "Running…" : report ? "Re-run report" : "Run visibility report"}
        </button>
      </div>

      {note ? (
        <p role="status" style={{ maxWidth: "1120px", width: "100%", margin: "0 auto", fontSize: "14px", color: "#4DA3FF" }}>
          {note}
        </p>
      ) : null}

      {!ready ? (
        <div style={{ maxWidth: "1120px", width: "100%", margin: "0 auto", borderRadius: "22px", background: "#101215", border: "1px solid #1A1D22", padding: "28px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "20px" }}>Add a business profile first</h2>
          <p style={{ margin: 0, color: "#9AA1AB", fontSize: "14px", lineHeight: 1.5 }}>
            ChatGPT, Gemini, Claude, Perplexity and other engines are scored from your real business name, services and market.
          </p>
          <Link href="/app/setup/profile" style={{ color: "#4DA3FF", textDecoration: "none", fontWeight: 600, fontSize: "14px" }}>
            Complete business profile →
          </Link>
        </div>
      ) : null}

      {loading ? (
        <div style={{ maxWidth: "1120px", width: "100%", margin: "0 auto" }}>
          <SkeletonCards count={4} />
          <SkeletonRows count={5} />
        </div>
      ) : null}

      {!loading && ready ? (
        <div style={{ maxWidth: "1120px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
            {(engines.length ? engines : [{ name: "ChatGPT" }, { name: "Gemini" }, { name: "Claude" }, { name: "Perplexity" }]).map((row) => {
              const pct = scorePct(row.score);
              return (
                <div key={row.id || row.name} style={{ borderRadius: "18px", background: "#101215", border: "1px solid #1A1D22", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <span style={{ fontSize: "13px", color: "#9AA1AB" }}>{row.name}</span>
                  <strong style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "32px", letterSpacing: "-1px" }}>
                    {pct == null ? "—" : `${pct}%`}
                  </strong>
                  <div style={{ height: "6px", borderRadius: "999px", background: "#1A1D22", overflow: "hidden" }}>
                    <div style={{ width: `${pct == null ? 0 : Math.max(4, pct)}%`, height: "100%", background: pct == null ? "#262A31" : pct >= 70 ? "#3DDC84" : pct >= 40 ? "#FFC53D" : "#FF5A4E" }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>AI report issues</h2>
            <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#9AA1AB" }}>
              Engine
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                style={{ minHeight: "40px", padding: "0 12px", borderRadius: "10px", border: "1px solid #262A31", background: "#0A0B0D", color: "#F2F4F5", font: "inherit" }}
              >
                {[ALL, "ChatGPT", "Gemini", "Perplexity", "Claude", "Copilot", "Google AI Overviews", "Grok"].map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ borderRadius: "22px", background: "#101215", border: "1px solid #1A1D22", overflow: "hidden" }}>
            {!report ? (
              <p style={{ margin: 0, padding: "22px", fontSize: "14px", color: "#9AA1AB" }}>
                Run the report to score engines and list LLM gaps with fix suggestions.
              </p>
            ) : checks.length === 0 ? (
              <p style={{ margin: 0, padding: "22px", fontSize: "14px", color: "#9AA1AB" }}>No rows for this engine filter.</p>
            ) : (
              checks.map((item) => {
                const bad = item.status !== "ok";
                return (
                  <div key={item.id} style={{ borderBottom: "1px solid #1A1D22", padding: "16px 20px", display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "flex-start" }}>
                    <div style={{ flex: "1 1 420px", minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#7D848E" }}>{item.engine}</span>
                      <span style={{ fontSize: "15px" }}>{item.prompt}</span>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "12px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #262A31", color: "#D7DADE" }}>
                          {item.mention == null ? "Mention not estimated" : item.mention ? "Likely mentioned" : "Unlikely mentioned"}
                        </span>
                        <span style={{ fontSize: "12px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #262A31", color: "#D7DADE" }}>
                          {item.citation == null ? "Citation not estimated" : item.citation ? "Likely cited" : "Unlikely cited"}
                        </span>
                      </div>
                      {bad && item.error ? <p style={{ margin: 0, fontSize: "13px", color: "#FF8E86", lineHeight: 1.45 }}>{item.error}</p> : null}
                      {item.excerpt ? <p style={{ margin: 0, fontSize: "13px", color: "#7D848E", lineHeight: 1.45 }}>LLM text: {item.excerpt}</p> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(item)}
                      style={{
                        minHeight: "40px",
                        padding: "0 14px",
                        borderRadius: "10px",
                        border: bad ? "0" : "1px solid #262A31",
                        background: bad ? "#4DA3FF" : "transparent",
                        color: bad ? "#0A0B0D" : "#D7DADE",
                        fontSize: "13px",
                        fontWeight: bad ? 600 : 400,
                      }}
                    >
                      {bad ? "Help suggestion" : "View notes"}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <p style={{ margin: 0, fontSize: "13px", color: "#7D848E", lineHeight: 1.5, maxWidth: "72ch" }}>
            Scores use your connected domain profile and Search Console evidence (DataForSEO / operator pipeline where configured).
            This is a likelihood report across ChatGPT, Gemini, Claude, Perplexity and related engines — not a live paid crawl of each assistant.
          </p>
        </div>
      ) : null}

      <SolutionDrawer check={open} busy={queueBusy} onClose={() => setOpen(null)} onQueue={queueFix} />
    </div>
  );
}
