"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { actionHref, problemReport, supportMailto } from "@/lib/problems";
import { FixPlayer } from "@/components/v8/FixGuide";

/**
 * One consistent error / warning / info notice for every report area
 * (Keywords, Backlinks, AI visibility, Site audit, Site scan, Search Console, Analytics).
 *
 * Each problem shows a title and a one-line message. "How to fix" opens the steps, the
 * main action (re-try, choose property, reconnect Google, open Search Console …), a help
 * link, and the technical details with a Copy button for support.
 */

const TONES = {
  error: { color: "#FF5A4E", bg: "rgba(255,90,78,0.08)", border: "rgba(255,90,78,0.35)", label: "Error" },
  warning: { color: "#FFC53D", bg: "rgba(255,197,61,0.07)", border: "rgba(255,197,61,0.32)", label: "Warning" },
  info: { color: "#4DA3FF", bg: "rgba(77,163,255,0.07)", border: "rgba(77,163,255,0.30)", label: "Note" },
};

const ORDER = { error: 0, warning: 1, info: 2 };

export default function ProblemNotice({ problems, onRetry, style }) {
  const list = (Array.isArray(problems) ? problems : problems ? [problems] : []).filter(Boolean);
  if (!list.length) return null;
  const sorted = [...list].sort((a, b) => (ORDER[a.severity] ?? 3) - (ORDER[b.severity] ?? 3));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", ...style }}>
      {sorted.map((problem, index) => (
        <ProblemCard key={`${problem.code || "p"}-${index}`} problem={problem} onRetry={onRetry} />
      ))}
    </div>
  );
}

function ProblemCard({ problem, onRetry }) {
  // Help stays folded until the user clicks "How to fix".
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const tone = TONES[problem.severity] || TONES.error;
  const steps = Array.isArray(problem.steps) ? problem.steps : [];
  const action = problem.action || null;
  const href = actionHref(action);
  const canRetry = action?.do === "retry" && typeof onRetry === "function";
  const showAction = Boolean(action && (href || canRetry));
  const hasHelp = steps.length > 0 || problem.technical || problem.helpUrl || showAction;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(problemReport(problem));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      role={problem.severity === "error" ? "alert" : "status"}
      style={{
        border: `1px solid ${tone.border}`,
        background: tone.bg,
        borderRadius: "14px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <span
          aria-hidden="true"
          style={{
            flex: "0 0 auto",
            marginTop: "3px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: tone.color,
            color: "#0B0D10",
            fontSize: "12px",
            fontWeight: 700,
            display: "grid",
            placeItems: "center",
          }}
        >
          {problem.severity === "info" ? "i" : "!"}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", color: tone.color, fontFamily: "'Geist Mono', monospace" }}>
            {tone.label}
            {problem.area ? ` · ${areaName(problem.area)}` : ""}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "15px", fontWeight: 600, color: "#F2F4F5", lineHeight: 1.35 }}>{problem.title}</p>
          {problem.message && problem.message !== problem.title ? (
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#B6BCC5", lineHeight: 1.5 }}>{problem.message}</p>
          ) : null}
        </div>
        {hasHelp ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            style={{
              flex: "0 0 auto",
              minHeight: "34px",
              padding: "0 12px",
              borderRadius: "10px",
              border: `1px solid ${tone.border}`,
              background: "transparent",
              color: "#F2F4F5",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {open ? "Hide help" : "How to fix"}
          </button>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
      {open && hasHelp ? (
        <motion.div
          key="help"
          initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          style={{ overflow: "hidden" }}
        >
        <div style={{ paddingLeft: "28px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {steps.length ? (
            <ol style={{ margin: 0, padding: 0, listStyle: "none", color: "#D7DADE", fontSize: "14px", lineHeight: 1.55, display: "flex", flexDirection: "column", gap: "4px" }}>
              {steps.map((step, i) => (
                <li key={i} style={{ display: "flex", gap: "8px" }}>
                  <span style={{ flex: "none", width: "18px", fontFamily: "'Geist Mono', monospace", color: tone.color }}>{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : null}
          {steps.length ? (
            <div>
              <button type="button" onClick={() => setShow((v) => !v)} aria-expanded={show} style={{ ...linkBtn, background: "transparent", cursor: "pointer" }}>
                {show ? "Hide walkthrough" : "▶ Show me how (animated)"}
              </button>
            </div>
          ) : null}
          {show && steps.length ? <FixPlayer steps={steps} accent={tone.color} /> : null}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
            {showAction ? (
              canRetry ? (
                <button type="button" onClick={() => onRetry(problem)} style={primaryBtn(tone)}>
                  {action.label || "Try again"}
                </button>
              ) : (
                <a
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  style={primaryBtn(tone)}
                >
                  {action.label || "Fix it"}
                </a>
              )
            ) : null}
            {problem.helpUrl && problem.helpUrl !== href ? (
              <a href={problem.helpUrl} target="_blank" rel="noopener noreferrer" style={linkBtn}>
                Google help article ↗
              </a>
            ) : null}
            <a href={supportMailto(problem)} style={linkBtn}>
              Email support
            </a>
          </div>

          {Array.isArray(problem.alternatives) && problem.alternatives.length > 1 ? (
            <p style={{ margin: 0, fontSize: "13px", color: "#9AA1AB" }}>
              Other properties you can read for this site: {problem.alternatives.slice(1).map((a) => a.siteUrl).join(", ")}
            </p>
          ) : null}

          {problem.technical || problem.code ? (
            <details style={{ fontSize: "12px", color: "#7D848E" }}>
              <summary style={{ cursor: "pointer" }}>Technical details</summary>
              <pre style={{ margin: "6px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "'Geist Mono', monospace", color: "#9AA1AB" }}>
                {`code: ${problem.code || "—"}${problem.technical ? `\n${problem.technical}` : ""}`}
              </pre>
              <button type="button" onClick={copy} style={{ ...linkBtn, marginTop: "6px", background: "transparent", cursor: "pointer" }}>
                {copied ? "Copied" : "Copy details for support"}
              </button>
            </details>
          ) : null}
        </div>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </section>
  );
}

function areaName(area) {
  return (
    {
      keywords: "Keywords",
      backlinks: "Backlinks",
      ai_visibility: "AI visibility",
      site_audit: "Site audit",
      site_scan: "Site scan",
      search_console: "Search Console",
      analytics: "Analytics",
      google: "Google",
    }[area] || area
  );
}

function primaryBtn(tone) {
  return {
    display: "inline-flex",
    alignItems: "center",
    minHeight: "38px",
    padding: "0 14px",
    borderRadius: "10px",
    border: 0,
    background: tone.color,
    color: "#0B0D10",
    fontSize: "14px",
    fontWeight: 600,
    textDecoration: "none",
    cursor: "pointer",
  };
}

const linkBtn = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "34px",
  padding: "0 10px",
  borderRadius: "10px",
  border: "1px solid #2A2E35",
  color: "#D7DADE",
  fontSize: "13px",
  textDecoration: "none",
};
