"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HowToFix } from "@/components/v8/FixGuide";

/**
 * "Why AI engines see you this way" for the AI visibility page.
 *
 * readiness = { reasons[], crawlers[], llmsTxt{}, checkedAt, host, scanAt, inspectedAt }
 * Each reason: { key, name, severity, group, engines[], fix, steps[], helpUrl, count, pages[], technical }
 */

const MONO = "'Geist Mono', monospace";

export const GROUPS = [
  { id: "all", label: "All reasons" },
  { id: "llm", label: "AI model errors" },
  { id: "crawler", label: "AI crawlers · robots.txt" },
  { id: "indexing", label: "Indexing" },
  { id: "content", label: "Content & entity" },
  { id: "setup", label: "Setup" },
];

const TONE = {
  Critical: { color: "#FF5A4E", bg: "rgba(255,90,78,.10)", label: "ERROR" },
  Warning: { color: "#FFC53D", bg: "rgba(255,197,61,.10)", label: "WARNING" },
  Notice: { color: "#4DA3FF", bg: "rgba(77,163,255,.10)", label: "NOTICE" },
};

const ROLE = { search: "Answers & citations", user: "Opens pages on request", training: "Model training" };

export function reasonsForEngine(reasons, engine) {
  if (!engine || engine === "All engines") return reasons;
  const name = engine.toLowerCase();
  return reasons.filter((r) => !(r.engines || []).length || (r.engines || []).some((e) => e.toLowerCase().includes(name) || name.includes(e.toLowerCase())));
}

export default function AiReasons({ readiness, engine, busy, onRecheck, onRun }) {
  const reduce = useReducedMotion();
  const [group, setGroup] = useState("all");
  const [open, setOpen] = useState(null);
  const all = useMemo(() => reasonsForEngine(readiness?.reasons || [], engine), [readiness, engine]);
  const counts = useMemo(() => {
    const c = { all: all.length };
    all.forEach((r) => {
      c[r.group] = (c[r.group] || 0) + 1;
    });
    return c;
  }, [all]);
  const list = group === "all" ? all : all.filter((r) => r.group === group);
  const crawlers = readiness?.crawlers || [];
  const errors = all.filter((r) => r.severity === "Critical").length;
  const warnings = all.filter((r) => r.severity === "Warning").length;

  return (
    <section aria-labelledby="sf-ai-why" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <h2 id="sf-ai-why" style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>
            Why AI engines see you this way
          </h2>
          <span style={{ fontSize: "13px", color: "#9AA1AB" }}>
            {all.length ? (
              <>
                <strong style={{ color: errors ? "#FF8A80" : "#F2F4F5" }}>{errors} error{errors === 1 ? "" : "s"}</strong> ·{" "}
                <strong style={{ color: warnings ? "#FFD27A" : "#F2F4F5" }}>{warnings} warning{warnings === 1 ? "" : "s"}</strong> · AI model, robots.txt, AI crawlers, llms.txt, indexing and entity signals
              </>
            ) : (
              "No blocking reasons found. AI crawlers can read the site and the model report ran."
            )}
            {readiness?.checkedAt ? ` · checked ${String(readiness.checkedAt).slice(0, 16).replace("T", " ")}` : ""}
          </span>
        </div>
        <motion.button type="button" whileTap={reduce ? undefined : { scale: 0.97 }} onClick={onRecheck} disabled={busy} style={ghostBtn}>
          {busy ? "Checking…" : "Re-check crawlers & indexing"}
        </motion.button>
      </div>

      {crawlers.length ? <CrawlerGrid crawlers={crawlers} engine={engine} llms={readiness?.llmsTxt} /> : null}

      <div role="tablist" aria-label="Reason type" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {GROUPS.filter((g) => g.id === "all" || counts[g.id]).map((g) => {
          const on = group === g.id;
          return (
            <button key={g.id} type="button" role="tab" aria-selected={on} onClick={() => setGroup(g.id)} style={{ ...chip, position: "relative", color: on ? "#0A0B0D" : "#D7DADE", border: on ? "1px solid transparent" : chip.border }}>
              {on ? <motion.span layoutId="ai-group-pill" transition={{ type: "spring", stiffness: 420, damping: 34 }} style={{ position: "absolute", inset: 0, borderRadius: "999px", background: "#4DA3FF" }} /> : null}
              <span style={{ position: "relative" }}>
                {g.label} <span style={{ fontFamily: MONO, fontSize: "11px", opacity: 0.75 }}>{counts[g.id] || 0}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ borderRadius: "22px", background: "#101215", border: "1px solid #1A1D22", overflow: "hidden" }}>
        {!list.length ? (
          <p style={{ margin: 0, padding: "22px", fontSize: "14px", color: "#9AA1AB" }}>Nothing in this group{engine && engine !== "All engines" ? ` for ${engine}` : ""}.</p>
        ) : null}
        <AnimatePresence initial={false}>
          {list.map((r, i) => {
            const tone = TONE[r.severity] || TONE.Notice;
            const isOpen = open === r.key;
            const rows = (r.pages || []).filter((p) => p.url || p.detail);
            return (
              <motion.div
                key={r.key}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: reduce ? 0 : Math.min(i, 8) * 0.04 }}
                style={{ borderBottom: "1px solid #1A1D22" }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : r.key)}
                  aria-expanded={isOpen}
                  style={{ width: "100%", textAlign: "left", background: isOpen ? "rgba(77,163,255,.05)" : "transparent", border: 0, color: "#F2F4F5", padding: "16px 20px", display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap", cursor: "pointer" }}
                >
                  <span style={{ fontFamily: MONO, fontSize: "11px", padding: "4px 8px", borderRadius: "6px", background: tone.bg, color: tone.color, width: "84px", textAlign: "center", boxSizing: "border-box" }}>{tone.label}</span>
                  <span style={{ flex: "1 1 260px", minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontSize: "15px", lineHeight: 1.35 }}>{r.name}</span>
                    <span style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {(r.engines || []).slice(0, 6).map((e) => (
                        <span key={e} style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "999px", border: "1px solid #262A31", color: "#B6BCC5" }}>
                          {e}
                        </span>
                      ))}
                    </span>
                  </span>
                  <motion.svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9AA1AB" strokeWidth="2" strokeLinecap="round" aria-hidden="true" animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <path d="M7 10l5 5 5-5" />
                  </motion.svg>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ padding: "0 20px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        {rows.length ? (
                          <div style={{ borderRadius: "12px", border: "1px solid #1A1D22", overflow: "hidden" }}>
                            <div style={{ padding: "8px 12px", background: "#0A0B0D", fontFamily: MONO, fontSize: "11px", color: "#7D848E" }}>WHAT WE FOUND</div>
                            {rows.slice(0, 15).map((p, idx) => (
                              <div key={`${p.url}-${idx}`} style={{ padding: "10px 12px", borderTop: "1px solid #1A1D22", display: "flex", flexDirection: "column", gap: "3px" }}>
                                {p.title || p.url ? (
                                  <span style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", fontFamily: MONO, fontSize: "12px", color: "#D7DADE" }}>
                                    {p.status ? <span style={{ padding: "1px 6px", borderRadius: "6px", background: "rgba(255,90,78,.15)", color: "#FF8A80" }}>{p.status}</span> : null}
                                    {p.title ? <strong style={{ fontWeight: 600 }}>{p.title}</strong> : null}
                                    {p.url && p.url !== "/" ? <span style={{ color: "#9AA1AB", overflowWrap: "anywhere" }}>{p.url}</span> : null}
                                  </span>
                                ) : null}
                                {p.detail ? <span style={{ fontSize: "13px", color: "#B6BCC5", lineHeight: 1.5 }}>{p.detail}</span> : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <HowToFix fix={r.fix} steps={r.steps} title={r.key}>
                          {r.helpUrl ? (
                            <a href={r.helpUrl} target="_blank" rel="noopener noreferrer" style={ghostBtn}>
                              Official guide ↗
                            </a>
                          ) : null}
                          {r.group === "llm" || r.key === "ai_no_report" ? (
                            <button type="button" onClick={onRun} style={ghostBtn}>
                              Run report again
                            </button>
                          ) : (
                            <button type="button" onClick={onRecheck} style={ghostBtn}>
                              Re-check
                            </button>
                          )}
                          <a href={`mailto:support@searchify.io?subject=${encodeURIComponent(`AI visibility help: ${r.name}`)}&body=${encodeURIComponent(brief(r))}`} style={ghostBtn}>
                            Ask support
                          </a>
                        </HowToFix>
                        {r.technical ? (
                          <details style={{ fontSize: "12px", color: "#7D848E" }}>
                            <summary style={{ cursor: "pointer" }}>Technical details</summary>
                            <pre style={{ margin: "6px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: MONO, color: "#9AA1AB" }}>{`code: ${r.key}\n${r.technical}`}</pre>
                          </details>
                        ) : null}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}

function CrawlerGrid({ crawlers, engine, llms }) {
  const reduce = useReducedMotion();
  const name = String(engine || "").toLowerCase();
  const shown = !engine || engine === "All engines" ? crawlers : crawlers.filter((c) => (c.engines || []).some((e) => e.toLowerCase().includes(name) || name.includes(e.toLowerCase())));
  const llmsState = !llms || !Object.keys(llms).length ? null : llms.present && !llms.problem ? "ok" : llms.problem || "missing";
  return (
    <div style={{ borderRadius: "22px", background: "#101215", border: "1px solid #1A1D22", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", alignItems: "baseline" }}>
        <span style={{ fontSize: "15px", fontWeight: 600 }}>AI crawler access (robots.txt)</span>
        {llmsState ? (
          <span style={{ fontFamily: MONO, fontSize: "11px", color: llmsState === "ok" ? "#3DDC84" : "#9AA1AB" }}>
            llms.txt · {llmsState === "ok" ? "found" : llmsState === "html" ? "returns a web page" : llmsState === "format" ? "wrong format" : llmsState === "unreachable" ? "not checked" : "not found (optional)"}
          </span>
        ) : null}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "8px" }}>
        {shown.map((c, i) => (
          <motion.div
            key={c.agent}
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reduce ? 0 : i * 0.025, duration: 0.2 }}
            title={c.rule ? `Blocked by “${c.rule}”` : "Allowed"}
            style={{ borderRadius: "12px", border: `1px solid ${c.allowed ? "#1A1D22" : c.role === "training" ? "rgba(255,197,61,.35)" : "rgba(255,90,78,.45)"}`, background: "#0A0B0D", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "4px" }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: c.allowed ? "#3DDC84" : c.role === "training" ? "#FFC53D" : "#FF5A4E" }} />
              <strong style={{ fontFamily: MONO, fontSize: "12px", fontWeight: 600 }}>{c.agent}</strong>
            </span>
            <span style={{ fontSize: "11.5px", color: "#9AA1AB" }}>
              {c.company} · {(c.engines || []).join(", ")}
            </span>
            <span style={{ fontSize: "11px", color: c.allowed ? "#7D848E" : "#FFB4AE" }}>{c.allowed ? `Allowed · ${ROLE[c.role] || c.role}` : `Blocked · ${c.rule || "robots.txt"}`}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function brief(r) {
  const lines = [`${r.name} (${r.severity})`, "", r.fix || "", ""];
  (r.steps || []).forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  (r.pages || []).slice(0, 15).forEach((p) => lines.push(`- ${p.title ? `${p.title} ` : ""}${p.url || ""}${p.detail ? ` — ${p.detail}` : ""}`));
  if (r.technical) lines.push("", `Technical: ${r.technical}`);
  return lines.join("\n");
}

const chip = {
  minHeight: "34px",
  padding: "0 12px",
  borderRadius: "999px",
  border: "1px solid #262A31",
  background: "transparent",
  fontSize: "13px",
  cursor: "pointer",
};

const ghostBtn = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "36px",
  padding: "0 12px",
  borderRadius: "10px",
  border: "1px solid #262A31",
  background: "transparent",
  color: "#D7DADE",
  fontSize: "13px",
  textDecoration: "none",
  cursor: "pointer",
};
