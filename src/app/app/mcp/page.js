"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { activeSiteContext } from "@/lib/siteContext";
import { loadJourney } from "@/lib/journey";

const AI = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
};

const PROMPTS = [
  {
    tag: "Find",
    text: "What should I fix first on my website?",
    fixes: 0,
    steps: [
      ["read", "Reading your latest SearchLites scan", "searchify.get_scan", "61 checks across 33 pages · 6 red lights"],
      ["read", "Checking which pages Google shows most", "search_console.top_pages", "Last 28 days of your Google data"],
      ["think", "Ranking red lights by visitors you could win back", "searchify.prioritize", "Roof repair title comes out on top: about 140 visitors a month"],
      ["reply", "Sent the answer back to your AI", "searchify.reply", "Top 3 fixes, in plain words"],
    ],
    answer:
      "Start with your roof repair page title. It leaves out “Calgary”, which is what people search for. Fixing it could win back about 140 visitors a month. Want me to write it?",
  },
  {
    tag: "Fix",
    text: "Rewrite the title on my roof repair page and publish it.",
    fixes: 1,
    okText: "Publish “Roof Repair in Calgary | Same-Week Quotes” to your roof repair page?",
    steps: [
      ["read", "Opening your roof repair page", "wordpress.get_page", "/services/roof-repair · current title: “Roof Repair Services”"],
      ["think", "Writing 3 new titles", "searchify.draft_fix", "Best: “Roof Repair in Calgary | Same-Week Quotes”"],
      ["think", "Checking it against Searchify criteria", "searchify.check", "4 of 4 met: search words, location, length, clear offer"],
      ["approve", "Waiting for your OK", "searchify.request_approval", "This changes what people see in Google."],
      ["publish", "Published to your website", "wordpress.update_page", "Live now · one-click undo in the change log"],
      ["track", "Added to In progress", "searchify.track", "Google usually notices in a few days. We’ll watch it for 4 weeks."],
    ],
    answer:
      "Done. Your new title is live: “Roof Repair in Calgary | Same-Week Quotes”. Google usually notices in a few days, and I’ll track it for you in Searchify.",
  },
  {
    tag: "Fix",
    text: "Fix every red light that won’t change how my site looks.",
    fixes: 4,
    okText: "Publish these 4 behind-the-scenes fixes?",
    steps: [
      ["read", "Reading your red lights", "searchify.get_scan", "6 red lights found"],
      ["think", "Keeping only behind-the-scenes fixes", "searchify.filter_safe", "4 of 6 don’t change how your site looks: descriptions, image text, a broken link"],
      ["think", "Writing all 4 fixes", "searchify.draft_fix ×4", "Each one checked against Searchify criteria"],
      ["approve", "Waiting for your OK", "searchify.request_approval", "4 small fixes, all undoable."],
      ["publish", "Published 4 fixes", "wordpress.update_page ×4", "Live now · every one can be undone"],
      ["track", "Added to In progress", "searchify.track", "2 red lights left. Both change how a page looks, so they’re yours to review."],
    ],
    answer:
      "Done. 4 red lights are fixed and live. The 2 left change how pages look, so I’ve saved them in Edit and publish for you to review.",
  },
  {
    tag: "Report",
    text: "How did my fixes do this month?",
    fixes: 0,
    steps: [
      ["read", "Gathering this month’s results", "searchify.get_results", "7 fixes published · 1 result in · 4 measuring"],
      ["read", "Comparing 4 weeks before vs after", "search_console.compare", "Measured from your own Google data"],
      ["think", "Writing your summary", "searchify.build_report", "Plain words, no jargon"],
      ["reply", "Sent the answer back to your AI", "searchify.reply", "Full report saved in Reports"],
    ],
    answer:
      "Your best result so far: flat roofs went from #8 to #5 on Google, about 33 more visitors a month. 4 more fixes are being measured, with early signs pointing up. The full report is in Searchify.",
  },
  {
    tag: "Find",
    text: "Which keywords do my competitors rank for that I don’t?",
    fixes: 0,
    steps: [
      ["read", "Finding your top competitors on Google", "dataforseo.serp_competitors", "3 roofers show up next to you most often"],
      ["read", "Comparing their keywords to yours", "dataforseo.domain_intersection", "42 searches they appear for and you don’t"],
      ["think", "Picking the ones worth chasing", "searchify.prioritize", "5 are close to your services and searched often"],
      ["reply", "Sent the answer back to your AI", "searchify.reply", "Ready to add to your Keyword tracker"],
    ],
    answer:
      "Your competitors show up for 42 searches you don’t. The 5 worth chasing start with “metal roofing calgary” (about 320 searches a month). Want me to add them to your Keyword tracker?",
  },
];

const TAG = {
  Find: ["rgba(77,163,255,.14)", "#8CC4FF"],
  Fix: ["rgba(61,220,132,.14)", "#3DDC84"],
  Report: ["rgba(255,197,61,.14)", "#FFC53D"],
};

const SKILLS = [
  { t: "Read your scan and Google data", c: "#3DDC84" },
  { t: "Find keywords and competitors", c: "#3DDC84" },
  { t: "Write and check fixes", c: "#3DDC84" },
  { t: "Publish a fix", c: "#FFC53D" },
  { t: "Undo a fix", c: "#FFC53D" },
  { t: "Build a report", c: "#3DDC84" },
];

const STAT = {
  running: ["Working", "#4DA3FF", "sfy-breathe 1.2s ease-in-out infinite"],
  done: ["Done", "#3DDC84", "none"],
  stopped: ["Stopped", "#9AA1AB", "none"],
  waiting: ["Needs your OK", "#FFC53D", "sfy-breathe 1.2s ease-in-out infinite"],
};

function slugOf(host) {
  const clean = String(host || "")
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .replace(/[^a-z0-9.-]+/gi, "");
  return clean || "your-site";
}

export default function McpPage() {
  const [host, setHost] = useState("your-site");
  const address = `https://mcp.searchify.io/${slugOf(host)}`;
  const [ai, setAi] = useState("claude");
  const [mode, setMode] = useState("ask");
  const [waitlist, setWaitlist] = useState(false);
  const [copied, setCopied] = useState("");
  const [fixed, setFixed] = useState(0);
  const [step, setStep] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [popAt, setPopAt] = useState(-1);
  const [custom, setCustom] = useState("Which keywords do my competitors rank for that I don't?");
  const [active, setActive] = useState(1);
  const [log, setLog] = useState([{ id: 1, pi: 0, ai: "claude", when: "Yesterday, 4:12 pm", status: "done" }]);
  const snap = useRef({});
  const copyTimer = useRef(0);
  snap.current = { ai, mode, fixed, step, waiting, active, log };

  const copy = (key, text) => {
    try {
      navigator.clipboard?.writeText(text);
    } catch {
      /* clipboard may be blocked */
    }
    window.clearTimeout(copyTimer.current);
    setCopied(key);
    copyTimer.current = window.setTimeout(() => setCopied(""), 1600);
  };

  const run = (pi) => {
    const S = snap.current;
    const id = Date.now();
    const next = [{ id, pi, ai: S.ai, when: "Just now", status: "running" }]
      .concat(S.log.map((row) => (row.status === "running" ? { ...row, status: "stopped" } : row)))
      .slice(0, 6);
    setLog(next);
    setActive(id);
    setStep(0);
    setWaiting(false);
  };

  useEffect(() => {
    setHost(activeSiteContext(loadJourney()).hostname || "your-site");
    const kick = window.setTimeout(() => run(1), 1400);
    const iv = window.setInterval(() => {
      const S = snap.current;
      const entry = S.log.find((row) => row.id === S.active);
      if (!entry || entry.status !== "running" || S.waiting) return;
      const steps = PROMPTS[entry.pi].steps;
      const next = S.step + 1;
      if (next >= steps.length) {
        setStep(steps.length);
        setLog((rows) => rows.map((row) => (row.id === entry.id ? { ...row, status: "done" } : row)));
        return;
      }
      const kind = steps[next][0];
      setStep(next);
      if (kind === "approve" && S.mode === "ask") setWaiting(true);
      if (kind === "publish") {
        setPopAt(S.fixed);
        setFixed((n) => Math.min(6, n + PROMPTS[entry.pi].fixes));
      }
    }, 1250);
    return () => {
      window.clearTimeout(kick);
      window.clearInterval(iv);
    };
  }, []);

  const entry = log.find((row) => row.id === active) || log[0];
  const prompt = PROMPTS[entry.pi];
  const finished = entry.status === "done";
  const stopped = entry.status === "stopped";
  const aiName = AI[ai];
  const steps = prompt.steps.map((row, i) => {
    const done = finished || (!stopped && i < step) || (stopped && i < step);
    const now = !finished && !stopped && i === step;
    const wait = now && waiting;
    const auto = row[0] === "approve" && mode === "auto" && (done || now);
    return {
      label: auto ? "Approved on its own (small fix)" : row[1],
      tool: row[2],
      detail: auto ? "You allowed small fixes to publish on their own." : row[3],
      isDone: done,
      isNow: now && !wait,
      isWait: wait,
      askOk: wait,
      okText: prompt.okText || "",
      op: done || now ? 1 : 0.35,
      detailColor: wait ? "#F2F4F5" : "#9AA1AB",
      bg: done ? "rgba(61,220,132,.14)" : wait ? "rgba(255,197,61,.14)" : now ? "rgba(77,163,255,.12)" : "#101215",
      ring: done ? "rgba(61,220,132,.6)" : wait ? "#FFC53D" : now ? "#4DA3FF" : "#262A31",
      line: i === prompt.steps.length - 1 ? "transparent" : done ? "rgba(61,220,132,.45)" : "#1A1D22",
      pop: done ? "sfy-pop .35s ease-out both" : "none",
    };
  });

  const order = [0, 7, 13, 18, 4, 21];
  const yellow = new Set([2, 5, 9, 11, 15, 17, 20, 23]);
  const dots = Array.from({ length: 24 }, (_, i) => {
    const ri = order.indexOf(i);
    let c = "#3DDC84";
    if (ri >= 0) c = ri < fixed ? "#3DDC84" : "#FF5A4E";
    else if (yellow.has(i)) c = "#FFC53D";
    else if (i === 10 || i === 22) c = "#4DA3FF";
    const justFixed = ri >= 0 && ri < fixed && ri >= popAt;
    return {
      c,
      anim: justFixed ? "sfy-pop .6s ease-out both" : ri >= 0 && ri >= fixed ? "sfy-breathe 1.6s ease-in-out infinite" : "none",
    };
  });
  const redLeft = 6 - fixed;

  return (
    <div style={{ color: "#F2F4F5", fontFamily: "Geist, 'Helvetica Neue', sans-serif", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 26, padding: "24px clamp(16px, 3.4vw, 48px) 56px" }}>
      <style>{`
        @keyframes sfy-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes sfy-breathe{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes sfy-spin{to{transform:rotate(360deg)}}
        @keyframes sfy-pop{0%{transform:scale(.4)}70%{transform:scale(1.3)}100%{transform:scale(1)}}
        .mc-dot{transition:background .5s ease,box-shadow .5s ease}
        .mc-p:hover{border-color:#2E333B !important}
        .mc-page a{color:#4DA3FF;text-decoration:none}
        .mc-page a:hover{color:#8CC4FF}
        .mc-page button{font-family:inherit;cursor:pointer}
        .mc-page button:focus-visible,.mc-page a:focus-visible,.mc-page input:focus-visible{outline:2px solid #4DA3FF;outline-offset:2px}
        .mc-page [style*="Geist Mono"]{font-family:"Open Sans",sans-serif !important;font-weight:700 !important}
        @media (prefers-reduced-motion: reduce){.mc-page *{animation:none !important;transition:none !important}}
      `}</style>
      <div className="mc-page" style={{ maxWidth: 1180, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 16px", borderRadius: 16, background: "#101215", border: "1px solid #262A31" }}>
          <span style={{ width: 32, height: 32, flex: "none", borderRadius: 10, background: "#1A1D22", display: "grid", placeItems: "center" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D7DADE" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </span>
          <span style={{ flex: "1 1 300px", fontSize: 14, color: "#D7DADE" }}>
            <strong style={{ color: "#F2F4F5" }}>Coming soon.</strong> This is a preview of how it will work. Everything below is a live demo.
          </span>
          <button
            type="button"
            onClick={() => setWaitlist(true)}
            style={{
              minHeight: 40,
              padding: "0 16px",
              borderRadius: 11,
              border: `1px solid ${waitlist ? "rgba(61,220,132,.5)" : "#3A404A"}`,
              background: "transparent",
              color: waitlist ? "#3DDC84" : "#F2F4F5",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {waitlist ? "✓ You’re on the list" : "Tell me when it’s ready"}
          </button>
        </div>

        <section style={{ display: "flex", flexDirection: "column", gap: 10, animation: "sfy-rise .4s ease both" }}>
          <h1 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(34px, 4.2vw, 52px)", lineHeight: 1.04, letterSpacing: "-1.5px", fontWeight: 700 }}>
            Run Searchify from the AI you already use.
          </h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "#D7DADE", maxWidth: 760 }}>
            Ask Claude, ChatGPT or Gemini in plain words. Searchify does the work on your website, and you can watch every step right here. Nothing goes live without your OK unless you say so.
          </p>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 16, alignItems: "stretch" }}>
          <section aria-labelledby="s1-h" style={{ borderRadius: 22, background: "#101215", border: "1px solid #1A1D22", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 id="s1-h" style={{ margin: 0, display: "flex", alignItems: "center", gap: 10, fontSize: 17, fontWeight: 600 }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(77,163,255,.16)", color: "#4DA3FF", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 }}>1</span>
              Connect your AI
            </h2>
            <div role="group" aria-label="Which AI do you use?" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
              {Object.keys(AI).map((key) => {
                const on = ai === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setAi(key)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      padding: "14px 8px",
                      borderRadius: 16,
                      border: `1.5px solid ${on ? "#4DA3FF" : "#1A1D22"}`,
                      background: on ? "rgba(77,163,255,.08)" : "#0A0B0D",
                      color: "#F2F4F5",
                    }}
                  >
                    <span style={{ width: 36, height: 36, borderRadius: "50%", background: "#1A1D22", border: "1px solid #2E333B", display: "grid", placeItems: "center", fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 16, fontWeight: 800 }}>
                      {AI[key].charAt(0)}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{AI[key]}</span>
                    <span style={{ fontSize: 11, color: on ? "#8CC4FF" : "#7D848E" }}>{on ? "Selected" : "Tap to pick"}</span>
                  </button>
                );
              })}
            </div>
            <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <li style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 14, color: "#D7DADE" }}>
                  <strong style={{ color: "#F2F4F5" }}>a.</strong> Copy your Searchify address
                </span>
                <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ flex: 1, minWidth: 0, minHeight: 44, boxSizing: "border-box", display: "flex", alignItems: "center", padding: "0 14px", borderRadius: 12, background: "#0A0B0D", border: "1px solid #262A31", fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: 13, color: "#F2F4F5", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                    {address}
                  </span>
                  <button type="button" onClick={() => copy("addr", address)} style={{ minHeight: 44, minWidth: 88, padding: "0 14px", borderRadius: 12, border: 0, background: copied === "addr" ? "#3DDC84" : "#4DA3FF", color: "#0A0B0D", fontSize: 14, fontWeight: 600 }}>
                    {copied === "addr" ? "Copied" : "Copy"}
                  </button>
                </span>
              </li>
              <li style={{ fontSize: 14, color: "#D7DADE", lineHeight: 1.5 }}>
                <strong style={{ color: "#F2F4F5" }}>b.</strong> In {aiName}, open its connectors (sometimes called apps or extensions) and add a custom one.
              </li>
              <li style={{ fontSize: 14, color: "#D7DADE", lineHeight: 1.5 }}>
                <strong style={{ color: "#F2F4F5" }}>c.</strong> Paste the address and sign in to Searchify. {aiName} can now read your scan and draft fixes.
              </li>
            </ol>
          </section>

          <section aria-labelledby="s2-h" style={{ borderRadius: 22, background: "#101215", border: "1px solid #1A1D22", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 id="s2-h" style={{ margin: 0, display: "flex", alignItems: "center", gap: 10, fontSize: 17, fontWeight: 600 }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(77,163,255,.16)", color: "#4DA3FF", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 }}>2</span>
              Ask it something
            </h2>
            <span style={{ fontSize: 13, color: "#9AA1AB", marginTop: -6 }}>Copy one of these into {aiName}, or press Try it to see what happens.</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PROMPTS.slice(0, 4).map((item, i) => (
                <div key={item.text} className="mc-p" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 10px 10px 14px", borderRadius: 14, background: "#0A0B0D", border: "1px solid #1A1D22" }}>
                  <span style={{ flex: "none", padding: "3px 8px", borderRadius: 999, background: TAG[item.tag][0], color: TAG[item.tag][1], fontSize: 11, fontWeight: 600 }}>{item.tag}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.4 }}>“{item.text}”</span>
                  <button type="button" onClick={() => copy(`p${i}`, item.text)} aria-label="Copy this request" style={{ flex: "none", minHeight: 36, padding: "0 10px", borderRadius: 10, border: "1px solid #262A31", background: "transparent", color: "#9AA1AB", fontSize: 12 }}>
                    {copied === `p${i}` ? "Copied" : "Copy"}
                  </button>
                  <button type="button" onClick={() => run(i)} style={{ flex: "none", minHeight: 36, padding: "0 12px", borderRadius: 10, border: 0, background: "rgba(77,163,255,.14)", color: "#8CC4FF", fontSize: 13, fontWeight: 600 }}>
                    Try it
                  </button>
                </div>
              ))}
            </div>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Your own request</span>
              <input
                type="text"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                style={{ flex: 1, minWidth: 0, minHeight: 46, boxSizing: "border-box", padding: "0 14px", borderRadius: 12, background: "#0A0B0D", border: "1px solid #262A31", color: "#F2F4F5", fontFamily: "inherit", fontSize: 14 }}
              />
              <button type="button" onClick={() => run(4)} style={{ minHeight: 46, padding: "0 18px", borderRadius: 12, border: 0, background: "#4DA3FF", color: "#0A0B0D", fontSize: 14, fontWeight: 600 }}>
                Send
              </button>
            </label>
          </section>
        </div>

        <section aria-labelledby="s3-h" style={{ borderRadius: 24, background: "#101215", border: "1px solid #262A31", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h2 id="s3-h" style={{ margin: 0, display: "flex", alignItems: "center", gap: 10, fontSize: 17, fontWeight: 600, marginRight: "auto" }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(77,163,255,.16)", color: "#4DA3FF", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 }}>3</span>
              Watch it work
            </h2>
            <div role="group" aria-label="Publishing" style={{ display: "inline-flex", padding: 3, borderRadius: 12, background: "#0A0B0D", border: "1px solid #1A1D22" }}>
              {[
                ["ask", "Ask me before publishing"],
                ["auto", "Small fixes on their own"],
              ].map(([id, label]) => {
                const on = mode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setMode(id);
                      if (id === "auto") setWaiting(false);
                    }}
                    style={{ minHeight: 38, padding: "0 12px", borderRadius: 9, border: 0, background: on ? "#262A31" : "transparent", color: on ? "#F2F4F5" : "#9AA1AB", fontSize: 13, fontWeight: on ? 600 : 400 }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "stretch" }}>
            <div style={{ flex: "1 1 280px", maxWidth: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: ".06em", color: "#9AA1AB" }}>PROMPT LOG</span>
              {log.map((row) => {
                const on = row.id === active;
                const key = row.status === "running" && on && waiting ? "waiting" : row.status;
                const st = STAT[key] || STAT.done;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => {
                      if (row.id !== active) {
                        setActive(row.id);
                        setStep(row.status === "running" ? step : 99);
                        setWaiting(false);
                      }
                    }}
                    aria-pressed={on}
                    style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, padding: "12px 14px", borderRadius: 14, border: `1.5px solid ${on ? "#4DA3FF" : "#1A1D22"}`, background: on ? "rgba(77,163,255,.06)" : "#0A0B0D", color: "#F2F4F5", textAlign: "left", animation: "sfy-rise .3s ease both" }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", fontSize: 12, color: "#9AA1AB" }}>
                      <span style={{ fontWeight: 600, color: "#D7DADE" }}>{AI[row.ai]}</span>· {row.when}
                      <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, color: st[1] }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: st[1], animation: st[2] }} />
                        {st[0]}
                      </span>
                    </span>
                    <span style={{ fontSize: 14, lineHeight: 1.4 }}>“{PROMPTS[row.pi].text}”</span>
                  </button>
                );
              })}
            </div>

            <div style={{ flex: "2.2 1 460px", minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: ".06em", color: "#9AA1AB" }}>LIVE · WHAT SEARCHIFY IS DOING</span>
              <div style={{ borderRadius: 16, background: "#0A0B0D", border: "1px solid #1A1D22", padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ width: 30, height: 30, flex: "none", borderRadius: "50%", background: "#1A1D22", border: "1px solid #2E333B", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700 }}>You</span>
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 12, color: "#9AA1AB" }}>You asked {AI[entry.ai]}</span>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>“{prompt.text}”</span>
                </span>
              </div>
              <ol aria-live="polite" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
                {steps.map((s) => (
                  <li key={s.tool + s.label} style={{ display: "flex", gap: 14, opacity: s.op, transition: "opacity .3s ease" }}>
                    <span style={{ flex: "none", width: 28, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span style={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", background: s.bg, border: `1.5px solid ${s.ring}`, boxSizing: "border-box", animation: s.pop }}>
                        {s.isDone ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : null}
                        {s.isNow ? <span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #4DA3FF", borderRightColor: "transparent", animation: "sfy-spin .8s linear infinite" }} /> : null}
                        {s.isWait ? <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#FFC53D", animation: "sfy-breathe 1.2s ease-in-out infinite" }} /> : null}
                      </span>
                      <span style={{ flex: 1, width: 2, minHeight: 12, background: s.line }} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0, padding: "3px 0 16px", display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{s.label}</span>
                        <span style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: 11, color: "#5B616B" }}>{s.tool}</span>
                      </span>
                      <span style={{ fontSize: 13, color: s.detailColor, lineHeight: 1.45 }}>{s.detail}</span>
                      {s.askOk ? (
                        <span style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4, padding: "12px 14px", borderRadius: 14, background: "rgba(255,197,61,.06)", border: "1px solid rgba(255,197,61,.45)" }}>
                          <span style={{ fontSize: 14, color: "#F2F4F5" }}>{s.okText}</span>
                          <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button type="button" onClick={() => setWaiting(false)} style={{ minHeight: 42, padding: "0 18px", borderRadius: 11, border: 0, background: "#3DDC84", color: "#0A0B0D", fontSize: 14, fontWeight: 600 }}>
                              Yes, publish it
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setWaiting(false);
                                setLog((rows) => rows.map((row) => (row.id === entry.id ? { ...row, status: "stopped" } : row)));
                              }}
                              style={{ minHeight: 42, padding: "0 14px", borderRadius: 11, border: "1px solid #262A31", background: "transparent", color: "#D7DADE", fontSize: 14 }}
                            >
                              Not now
                            </button>
                          </span>
                          <span style={{ fontSize: 12, color: "#9AA1AB" }}>You can also just reply “yes” in {AI[entry.ai]}.</span>
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ol>
              {finished ? (
                <div style={{ borderRadius: 16, background: "rgba(61,220,132,.05)", border: "1px solid rgba(61,220,132,.35)", padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start", animation: "sfy-rise .4s ease both" }}>
                  <span style={{ width: 30, height: 30, flex: "none", borderRadius: "50%", background: "#1A1D22", border: "1px solid #2E333B", display: "grid", placeItems: "center", fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 13, fontWeight: 800 }}>
                    {AI[entry.ai].charAt(0)}
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontSize: 12, color: "#9AA1AB" }}>{AI[entry.ai]} replied to you</span>
                    <span style={{ fontSize: 15, lineHeight: 1.5 }}>{prompt.answer}</span>
                  </span>
                </div>
              ) : null}
              {stopped ? (
                <div style={{ borderRadius: 16, background: "#0A0B0D", border: "1px solid #262A31", padding: "14px 16px", fontSize: 14, color: "#D7DADE" }}>
                  Stopped. Nothing was published. The draft is saved in Edit and publish if you change your mind.
                </div>
              ) : null}
            </div>

            <div style={{ flex: "1 1 230px", maxWidth: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: ".06em", color: "#9AA1AB" }}>YOUR SEARCHLITES</span>
              <div style={{ borderRadius: 16, background: "#0A0B0D", border: "1px solid #1A1D22", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                <div aria-label={`${redLeft} red lights left out of 24`} role="img" style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 9 }}>
                  {dots.map((d, i) => (
                    <span key={i} className="mc-dot" style={{ aspectRatio: "1", borderRadius: "50%", background: d.c, boxShadow: `0 0 8px ${d.c}`, animation: d.anim }} />
                  ))}
                </div>
                <span style={{ fontSize: 13, color: "#D7DADE", lineHeight: 1.45 }}>
                  <strong style={{ color: "#FF5A4E" }}>{redLeft} red</strong> left. {fixed > 0 ? "Your board updates the moment a fix goes live." : "Watch them turn green as fixes go live."}
                </span>
                <Link
                  href="/app/results"
                  className="mc-link"
                  style={{ fontSize: 13, fontWeight: 600, color: "#4DA3FF", textDecoration: "none" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#8CC4FF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#4DA3FF";
                  }}
                >
                  Open SearchLites →
                </Link>
              </div>
              <div style={{ borderRadius: 16, background: "#0A0B0D", border: "1px solid #1A1D22", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>What {aiName} can ask Searchify to do</span>
                {SKILLS.map((k) => (
                  <span key={k.t} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#D7DADE" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: k.c }} />
                    {k.t}
                  </span>
                ))}
                <span style={{ fontSize: 12, color: "#7D848E", lineHeight: 1.45 }}>Yellow ones always wait for your OK, unless you switch on small fixes.</span>
              </div>
            </div>
          </div>
        </section>

        <p style={{ margin: 0, fontSize: 12, color: "#7D848E", lineHeight: 1.5 }}>
          For the developer: MCP server exposes Searchify tools (get_scan, prioritize, draft_fix, check, publish_fix, undo, get_results, build_report). Every call made through MCP is written to the prompt log and streamed to this live view. publish_fix requires an approval token unless the site&apos;s mode is &quot;small fixes on their own&quot; and the fix is behind-the-scenes only.
        </p>
      </div>
    </div>
  );
}
