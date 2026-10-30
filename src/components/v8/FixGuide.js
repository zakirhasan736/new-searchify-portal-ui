"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * "How to fix" that stays out of the way until the user asks for it.
 *
 *   <HowToFix fix="…" steps={[…]} title="…">{action buttons}</HowToFix>
 *
 * Collapsed: one "View how to fix" button. Open: the explanation, numbered steps, and a
 * "Show me" player that plays the steps like a short GIF (a looping animated walkthrough of
 * the screen the step talks about: robots.txt, WordPress, Search Console, Cloudflare …).
 */

const MONO = "'Geist Mono', monospace";
const STEP_MS = 3600;

export function HowToFix({ fix, steps = [], title = "", defaultOpen = false, accent = "#4DA3FF", children }) {
  const [open, setOpen] = useState(defaultOpen);
  const [mode, setMode] = useState("steps");
  const reduce = useReducedMotion();
  const list = (Array.isArray(steps) ? steps : []).filter(Boolean);
  if (!fix && !list.length && !children) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div>
        <motion.button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          whileHover={reduce ? undefined : { y: -1 }}
          whileTap={reduce ? undefined : { scale: 0.97 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "38px",
            padding: "0 14px",
            borderRadius: "10px",
            border: open ? `1px solid ${accent}` : 0,
            background: open ? "transparent" : accent,
            color: open ? "#F2F4F5" : "#0A0B0D",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <motion.svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <path d="M9 6l6 6-6 6" />
          </motion.svg>
          {open ? "Hide how to fix" : "View how to fix"}
          {list.length ? <span style={{ fontFamily: MONO, fontSize: "11px", opacity: 0.75 }}>{list.length} steps</span> : null}
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="fix"
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ borderRadius: "14px", background: "#0A0B0D", border: "1px solid #1A1D22", padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: MONO, fontSize: "11px", color: accent, letterSpacing: "0.5px" }}>HOW TO FIX</span>
                {list.length ? (
                  <div role="tablist" aria-label="How to fix view" style={{ display: "inline-flex", padding: "3px", borderRadius: "10px", background: "#101215", border: "1px solid #1A1D22" }}>
                    {[
                      ["steps", "Steps"],
                      ["show", "▶ Show me"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={mode === id}
                        onClick={() => setMode(id)}
                        style={{
                          position: "relative",
                          minHeight: "30px",
                          padding: "0 12px",
                          border: 0,
                          borderRadius: "8px",
                          background: "transparent",
                          color: mode === id ? "#0A0B0D" : "#B6BCC5",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {mode === id ? (
                          <motion.span layoutId={`fix-tab-${title}`} transition={{ type: "spring", stiffness: 420, damping: 34 }} style={{ position: "absolute", inset: 0, borderRadius: "8px", background: accent }} />
                        ) : null}
                        <span style={{ position: "relative" }}>{label}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              {fix ? <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.55, color: "#E4E7EA" }}>{fix}</p> : null}
              {list.length && mode === "steps" ? <StepList steps={list} accent={accent} /> : null}
              {list.length && mode === "show" ? <FixPlayer steps={list} accent={accent} /> : null}
              {children ? <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>{children}</div> : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function StepList({ steps, accent }) {
  const reduce = useReducedMotion();
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
      {steps.map((step, index) => (
        <motion.li
          key={index}
          initial={reduce ? false : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05, duration: 0.24 }}
          style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "13.5px", lineHeight: 1.5, color: "#D7DADE" }}
        >
          <span style={{ flex: "none", width: "22px", height: "22px", borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(77,163,255,.14)", color: accent, fontFamily: MONO, fontSize: "11px" }}>
            {index + 1}
          </span>
          <span style={{ paddingTop: "2px" }}>{step}</span>
        </motion.li>
      ))}
    </ol>
  );
}

// ------------------------------------------------------------------------------------------
// Animated walkthrough ("GIF")
// ------------------------------------------------------------------------------------------

/** Which mock screen best illustrates a step. */
export function sceneFor(step) {
  const t = String(step || "").toLowerCase();
  if (/robots\.txt|disallow|user-agent/.test(t)) return "robots";
  if (/llms\.txt/.test(t)) return "llms";
  if (/cloudflare|firewall|cdn|wordfence|sucuri|bot/.test(t)) return "firewall";
  if (/search console|url inspection|request indexing|validate fix|sitemaps?\b/.test(t)) return "gsc";
  if (/rich results|schema|json-ld|structured data|faqpage/.test(t)) return "schema";
  if (/wordpress|yoast|rank math|seo plugin|settings →|plugin|permalink/.test(t)) return "wordpress";
  if (/redirect|301|https/.test(t)) return "redirect";
  if (/image|alt text|alt=|webp|compress/.test(t)) return "image";
  if (/title|description|h1|heading|paragraph|content|text|faq|question/.test(t)) return "editor";
  if (/re-check|scan again|run again|press run|try again|refresh/.test(t)) return "recheck";
  if (/email|support|developer|admin|host/.test(t)) return "handoff";
  return "browser";
}

export function FixPlayer({ steps, accent = "#4DA3FF" }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(!reduce);
  const [hover, setHover] = useState(false);
  const timer = useRef(null);
  const count = steps.length;
  const active = playing && !hover && !reduce;

  useEffect(() => {
    if (!active) return undefined;
    timer.current = setTimeout(() => setIndex((i) => (i + 1) % count), STEP_MS);
    return () => clearTimeout(timer.current);
  }, [active, index, count]);

  const step = steps[index] || "";
  const scene = useMemo(() => sceneFor(step), [step]);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ borderRadius: "14px", border: "1px solid #1A1D22", background: "#101215", overflow: "hidden" }}
    >
      {/* progress like stories */}
      <div style={{ display: "flex", gap: "4px", padding: "10px 12px 0" }}>
        {steps.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Step ${i + 1}`}
            onClick={() => setIndex(i)}
            style={{ flex: 1, height: "4px", padding: 0, border: 0, borderRadius: "999px", background: "#262A31", overflow: "hidden", cursor: "pointer" }}
          >
            <motion.span
              key={`${i}-${index}-${active}`}
              initial={{ width: i < index ? "100%" : "0%" }}
              animate={{ width: i < index ? "100%" : i === index ? (active ? "100%" : "50%") : "0%" }}
              transition={i === index && active ? { duration: STEP_MS / 1000, ease: "linear" } : { duration: 0.2 }}
              style={{ display: "block", height: "100%", background: accent }}
            />
          </button>
        ))}
      </div>

      <div style={{ padding: "12px", display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "12px" }}>
        <MockWindow scene={scene} step={step} index={index} accent={accent} reduce={reduce} />
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}
          >
            <span style={{ flex: "none", fontFamily: MONO, fontSize: "11px", color: accent, paddingTop: "3px" }}>
              STEP {index + 1}/{count}
            </span>
            <span style={{ fontSize: "14px", lineHeight: 1.5, color: "#F2F4F5" }}>{step}</span>
          </motion.div>
        </AnimatePresence>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <PlayerBtn label="Previous step" onClick={() => setIndex((i) => (i - 1 + count) % count)}>
            <path d="M15 6l-6 6 6 6" />
          </PlayerBtn>
          <PlayerBtn label={playing ? "Pause" : "Play"} onClick={() => setPlaying((p) => !p)} disabled={reduce}>
            {playing && !reduce ? <path d="M9 6v12M15 6v12" /> : <path d="M8 5l11 7-11 7z" />}
          </PlayerBtn>
          <PlayerBtn label="Next step" onClick={() => setIndex((i) => (i + 1) % count)}>
            <path d="M9 6l6 6-6 6" />
          </PlayerBtn>
          <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: "11px", color: "#7D848E" }}>
            {reduce ? "Motion reduced · use the arrows" : hover ? "Paused while you read" : playing ? "Playing · loops" : "Paused"}
          </span>
        </div>
      </div>
    </div>
  );
}

function PlayerBtn({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      style={{ width: "34px", height: "34px", borderRadius: "10px", border: "1px solid #262A31", background: "transparent", color: "#D7DADE", display: "grid", placeItems: "center", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1 }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    </button>
  );
}

const SCENE_URL = {
  robots: "yoursite.com/robots.txt",
  llms: "yoursite.com/llms.txt",
  firewall: "dash.cloudflare.com › Security › Bots",
  gsc: "search.google.com/search-console",
  schema: "search.google.com/test/rich-results",
  wordpress: "yoursite.com/wp-admin",
  redirect: "http://yoursite.com → https://yoursite.com",
  image: "yoursite.com/wp-admin › Media",
  editor: "yoursite.com/wp-admin › Edit page",
  recheck: "searchify › Re-check",
  handoff: "Email to your developer",
  browser: "yoursite.com",
};

/** A tiny fake app window with a moving cursor that "does" the step. */
function MockWindow({ scene, step, index, accent, reduce }) {
  return (
    <div aria-hidden="true" style={{ borderRadius: "12px", border: "1px solid #262A31", background: "#0A0B0D", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 10px", borderBottom: "1px solid #1A1D22", background: "#0D0F12" }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
          <span key={c} style={{ width: "8px", height: "8px", borderRadius: "50%", background: c, opacity: 0.8 }} />
        ))}
        <span style={{ marginLeft: "8px", flex: 1, minWidth: 0, fontFamily: MONO, fontSize: "10.5px", color: "#7D848E", padding: "3px 8px", borderRadius: "6px", background: "#15181C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {SCENE_URL[scene]}
        </span>
      </div>
      <div style={{ position: "relative", height: "168px", overflow: "hidden" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${scene}-${index}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: "absolute", inset: 0 }}
          >
            <Scene scene={scene} step={step} accent={accent} reduce={reduce} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const line = (w, c = "#262A31") => ({ height: "7px", width: w, borderRadius: "4px", background: c });

function Cursor({ path, reduce, delay = 0.35 }) {
  // path: [[x%, y%], ...]; ends with a click pulse
  const xs = path.map((p) => `${p[0]}%`);
  const ys = path.map((p) => `${p[1]}%`);
  const last = path[path.length - 1];
  if (reduce) {
    return (
      <span style={{ position: "absolute", left: `${last[0]}%`, top: `${last[1]}%` }}>
        <CursorIcon />
      </span>
    );
  }
  return (
    <>
      <motion.span
        initial={{ left: xs[0], top: ys[0] }}
        animate={{ left: xs, top: ys }}
        transition={{ duration: 1.4, delay, ease: "easeInOut" }}
        style={{ position: "absolute", zIndex: 3 }}
      >
        <CursorIcon />
      </motion.span>
      <motion.span
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: [0, 0.7, 0], scale: [0.2, 1.6, 2.2] }}
        transition={{ duration: 0.6, delay: delay + 1.45 }}
        style={{ position: "absolute", left: `calc(${last[0]}% - 9px)`, top: `calc(${last[1]}% - 9px)`, width: "18px", height: "18px", borderRadius: "50%", border: "2px solid #F2F4F5", zIndex: 2 }}
      />
    </>
  );
}

function CursorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,.6))" }}>
      <path d="M4 2l16 9-7 2-3 7z" fill="#F2F4F5" stroke="#0A0B0D" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function Highlight({ style, accent, delay = 1.7, reduce }) {
  return (
    <motion.span
      initial={reduce ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: reduce ? 0 : delay, duration: 0.25 }}
      style={{ position: "absolute", borderRadius: "6px", border: `1.5px solid ${accent}`, boxShadow: `0 0 0 4px ${accent}22`, ...style }}
    />
  );
}

function Typing({ text, delay = 1.8, reduce, color = "#3DDC84" }) {
  const chars = Array.from(text);
  return (
    <span style={{ fontFamily: MONO, fontSize: "11px", color }}>
      {chars.map((ch, i) => (
        <motion.span key={i} initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : delay + i * 0.03, duration: 0.01 }}>
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

function Scene({ scene, step, accent, reduce }) {
  const pad = { position: "absolute", inset: 0, padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" };
  switch (scene) {
    case "robots":
    case "llms": {
      const rows = scene === "robots"
        ? [["User-agent: *", "#9AA1AB"], ["Allow: /", "#9AA1AB"], ["", ""], ["User-agent: OAI-SearchBot", "#D7DADE"], ["Disallow: /", "#FF8A80"], ["", ""], ["Sitemap: https://yoursite.com/sitemap.xml", "#7D848E"]]
        : [["# Your business name", "#D7DADE"], ["> One line: what you do and where", "#9AA1AB"], ["", ""], ["## Key pages", "#D7DADE"], ["- [Services](https://…): what's included", "#9AA1AB"]];
      return (
        <div style={{ ...pad, fontFamily: MONO, fontSize: "11px", gap: "3px" }}>
          {rows.map(([text, color], i) => (
            <div key={i} style={{ position: "relative", height: "16px", color, display: "flex", gap: "10px" }}>
              <span style={{ width: "14px", color: "#3A3F47" }}>{i + 1}</span>
              {scene === "robots" && text === "Disallow: /" ? (
                <span>
                  <span style={{ position: "relative" }}>
                    {text}
                    <motion.span initial={reduce ? { width: "100%" } : { width: 0 }} animate={{ width: "100%" }} transition={{ delay: reduce ? 0 : 1.8, duration: 0.4 }} style={{ position: "absolute", left: 0, top: "50%", height: "1.5px", background: "#FF5A4E" }} />
                  </span>
                  <span style={{ marginLeft: "10px" }}>
                    <Typing text="Allow: /" delay={2.3} reduce={reduce} />
                  </span>
                </span>
              ) : (
                <span>{text}</span>
              )}
            </div>
          ))}
          {scene === "llms" ? (
            <div style={{ marginTop: "4px" }}>
              <Typing text="- [Contact](https://…): phone, hours, areas" delay={1.6} reduce={reduce} />
            </div>
          ) : null}
          <Cursor path={[[80, 85], [30, 62]]} reduce={reduce} />
        </div>
      );
    }
    case "firewall":
      return (
        <div style={pad}>
          <span style={{ fontSize: "12px", color: "#D7DADE", fontWeight: 600 }}>Bots</span>
          {[["Block AI bots", true], ["Bot fight mode", false], ["Allow verified bots", true]].map(([label, on], i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "8px", background: "#101215", border: "1px solid #1A1D22" }}>
              <span style={{ fontSize: "12px", color: "#B6BCC5" }}>{label}</span>
              <Toggle on={i === 0 ? false : on} from={on} animate={i === 0} reduce={reduce} accent={accent} />
            </div>
          ))}
          <Cursor path={[[20, 90], [88, 33]]} reduce={reduce} />
        </div>
      );
    case "gsc":
      return (
        <div style={{ ...pad, flexDirection: "row", gap: "12px" }}>
          <div style={{ width: "30%", display: "flex", flexDirection: "column", gap: "7px" }}>
            {["Overview", "URL inspection", "Pages", "Sitemaps", "Settings"].map((label, i) => (
              <span key={label} style={{ fontSize: "11px", padding: "4px 6px", borderRadius: "6px", color: i === 1 ? "#0A0B0D" : "#9AA1AB", background: i === 1 ? "#8AB4F8" : "transparent" }}>
                {label}
              </span>
            ))}
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ position: "relative", padding: "7px 9px", borderRadius: "8px", border: "1px solid #262A31", fontFamily: MONO, fontSize: "10.5px", color: "#9AA1AB" }}>
              <Typing text="https://yoursite.com/services/" delay={0.6} reduce={reduce} color="#D7DADE" />
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FFC53D" }} />
              <span style={{ fontSize: "11px", color: "#D7DADE" }}>URL is not on Google</span>
            </div>
            <div style={line("70%")} />
            <div style={line("50%")} />
            <span style={{ position: "relative", alignSelf: "flex-start", marginTop: "4px", fontSize: "11px", padding: "5px 10px", borderRadius: "999px", background: "#8AB4F8", color: "#0A0B0D", fontWeight: 600 }}>
              {/validate/i.test(step) ? "Validate fix" : "Request indexing"}
            </span>
          </div>
          <Cursor path={[[50, 15], [42, 83]]} reduce={reduce} delay={1.2} />
        </div>
      );
    case "schema":
      return (
        <div style={pad}>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1, padding: "7px 9px", borderRadius: "8px", border: "1px solid #262A31", fontFamily: MONO, fontSize: "10.5px", color: "#D7DADE" }}>https://yoursite.com/</div>
            <span style={{ fontSize: "11px", padding: "7px 10px", borderRadius: "8px", background: accent, color: "#0A0B0D", fontWeight: 600 }}>Test URL</span>
          </div>
          {["LocalBusiness", "FAQPage", "BreadcrumbList"].map((name, i) => (
            <motion.div key={name} initial={reduce ? false : { opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduce ? 0 : 1.6 + i * 0.25 }} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 9px", borderRadius: "8px", background: "#101215" }}>
              <span style={{ width: "14px", height: "14px", borderRadius: "50%", display: "grid", placeItems: "center", background: i === 1 ? "#FFC53D" : "#3DDC84", color: "#0A0B0D", fontSize: "10px", fontWeight: 700 }}>{i === 1 ? "!" : "✓"}</span>
              <span style={{ fontSize: "11.5px", color: "#D7DADE" }}>{name}</span>
              <span style={{ marginLeft: "auto", fontSize: "10.5px", color: "#7D848E" }}>{i === 1 ? "1 warning" : "valid"}</span>
            </motion.div>
          ))}
          <Cursor path={[[50, 85], [88, 18]]} reduce={reduce} delay={0.2} />
        </div>
      );
    case "wordpress":
    case "image":
    case "editor":
      return (
        <div style={{ ...pad, flexDirection: "row", gap: "0", padding: 0 }}>
          <div style={{ width: "26%", background: "#1D2327", padding: "10px 8px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {["Dashboard", "Pages", "Media", scene === "wordpress" ? "Yoast SEO" : "Posts", "Settings"].map((label, i) => (
              <span key={label} style={{ fontSize: "10.5px", padding: "3px 6px", borderRadius: "4px", color: "#C3C4C7", background: (scene === "image" ? i === 2 : scene === "editor" ? i === 1 : i === 3) ? "#2271B1" : "transparent" }}>
                {label}
              </span>
            ))}
          </div>
          <div style={{ position: "relative", flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {scene === "image" ? (
              <>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ width: "56px", height: "42px", borderRadius: "6px", background: "linear-gradient(135deg,#2B3A55,#4DA3FF55)" }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                    <span style={{ fontSize: "10px", color: "#7D848E" }}>Alternative text</span>
                    <div style={{ position: "relative", padding: "5px 7px", borderRadius: "6px", border: "1px solid #262A31" }}>
                      <Typing text="Plumber fixing a kitchen sink in Toronto" reduce={reduce} />
                    </div>
                  </div>
                </div>
                <div style={line("60%")} />
                <Highlight accent={accent} reduce={reduce} style={{ left: "calc(56px + 18px)", right: "12px", top: "26px", height: "26px" }} />
              </>
            ) : scene === "editor" ? (
              <>
                <span style={{ fontSize: "10px", color: "#7D848E" }}>{/title/i.test(step) ? "SEO title" : /description/i.test(step) ? "Meta description" : "Page heading / first paragraph"}</span>
                <div style={{ position: "relative", padding: "6px 8px", borderRadius: "6px", border: "1px solid #262A31" }}>
                  <Typing text="Emergency Plumber in Toronto | Acme Plumbing" reduce={reduce} />
                </div>
                <div style={line("90%")} />
                <div style={line("75%")} />
                <div style={line("82%")} />
                <span style={{ alignSelf: "flex-end", fontSize: "10.5px", padding: "4px 10px", borderRadius: "4px", background: "#2271B1", color: "#fff" }}>Update</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: "11px", color: "#D7DADE", fontWeight: 600 }}>{/reading|discourage/i.test(step) ? "Reading Settings" : "Advanced"}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 8px", borderRadius: "6px", background: "#101215" }}>
                  <motion.span initial={{ background: "#2271B1" }} animate={{ background: reduce ? "transparent" : ["#2271B1", "#2271B1", "transparent"] }} transition={{ duration: 2, times: [0, 0.85, 1] }} style={{ width: "12px", height: "12px", borderRadius: "3px", border: "1.5px solid #8C8F94" }} />
                  <span style={{ fontSize: "10.5px", color: "#B6BCC5" }}>{/reading|discourage/i.test(step) ? "Discourage search engines from indexing" : "No index this page"}</span>
                </div>
                <div style={line("70%")} />
                <div style={line("55%")} />
                <span style={{ alignSelf: "flex-start", fontSize: "10.5px", padding: "4px 10px", borderRadius: "4px", background: "#2271B1", color: "#fff" }}>Save changes</span>
              </>
            )}
          </div>
          <Cursor path={scene === "wordpress" ? [[60, 90], [35, 38], [36, 82]] : [[90, 90], [62, 32]]} reduce={reduce} />
        </div>
      );
    case "redirect":
      return (
        <div style={{ ...pad, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: "10px" }}>
          {["http://", "www.", "https://"].map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <motion.span initial={reduce ? false : { opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : 0.4 + i * 0.6 }} style={{ fontFamily: MONO, fontSize: "11px", padding: "8px 10px", borderRadius: "8px", border: `1px solid ${i === 2 ? "#3DDC84" : "#262A31"}`, color: i === 2 ? "#3DDC84" : "#B6BCC5" }}>
                {label}
              </motion.span>
              {i < 2 ? (
                <motion.span initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: reduce ? 0 : 0.7 + i * 0.6, duration: 0.4 }} style={{ transformOrigin: "left", fontFamily: MONO, fontSize: "10px", color: accent }}>
                  301 →
                </motion.span>
              ) : null}
            </div>
          ))}
        </div>
      );
    case "recheck":
      return (
        <div style={{ ...pad, alignItems: "center", justifyContent: "center", gap: "12px" }}>
          <motion.span
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 1.2, ease: "linear", repeat: 1 }}
            style={{ width: "34px", height: "34px", borderRadius: "50%", border: `3px solid #262A31`, borderTopColor: accent }}
          />
          <motion.span initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : 2.3 }} style={{ fontSize: "12px", color: "#3DDC84", fontWeight: 600 }}>
            ✓ Fixed — no longer reported
          </motion.span>
        </div>
      );
    case "handoff":
      return (
        <div style={pad}>
          {["To: developer@yoursite.com", "Subject: SEO fix needed"].map((label) => (
            <span key={label} style={{ fontFamily: MONO, fontSize: "10.5px", color: "#9AA1AB", paddingBottom: "4px", borderBottom: "1px solid #1A1D22" }}>
              {label}
            </span>
          ))}
          <Typing text="Hi — please fix the issue below (steps + pages attached)." delay={0.8} reduce={reduce} color="#D7DADE" />
          <div style={line("80%")} />
          <span style={{ alignSelf: "flex-end", fontSize: "11px", padding: "5px 12px", borderRadius: "8px", background: accent, color: "#0A0B0D", fontWeight: 600 }}>Send</span>
          <Cursor path={[[30, 30], [90, 86]]} reduce={reduce} delay={1.2} />
        </div>
      );
    default:
      return (
        <div style={pad}>
          <div style={line("40%", "#3A3F47")} />
          <div style={line("90%")} />
          <div style={line("80%")} />
          <div style={{ position: "relative", height: "40px", borderRadius: "8px", background: "#101215" }}>
            <Highlight accent={accent} reduce={reduce} style={{ inset: 0 }} />
          </div>
          <div style={line("65%")} />
          <Cursor path={[[85, 90], [50, 52]]} reduce={reduce} />
        </div>
      );
  }
}

function Toggle({ on, from, animate, reduce, accent }) {
  const start = animate ? from : on;
  return (
    <motion.span
      initial={{ background: start ? accent : "#3A3F47" }}
      animate={{ background: on ? accent : "#3A3F47" }}
      transition={{ delay: animate && !reduce ? 1.8 : 0, duration: 0.25 }}
      style={{ position: "relative", width: "30px", height: "17px", borderRadius: "999px", display: "inline-block" }}
    >
      <motion.span
        initial={{ left: start ? "15px" : "2px" }}
        animate={{ left: on ? "15px" : "2px" }}
        transition={{ delay: animate && !reduce ? 1.8 : 0, type: "spring", stiffness: 500, damping: 30 }}
        style={{ position: "absolute", top: "2px", width: "13px", height: "13px", borderRadius: "50%", background: "#F2F4F5" }}
      />
    </motion.span>
  );
}

export default HowToFix;
