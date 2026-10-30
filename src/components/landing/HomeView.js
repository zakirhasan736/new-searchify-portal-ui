"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LandingShell from "@/components/landing/LandingShell";
import HomeBrandHero from "@/components/landing/HomeBrandHero";
import LandingMotion from "@/components/motion/LandingMotion";
import { normalizeSiteUrl, seedDraftSite, stashPendingSite } from "@/lib/journey";
import { previewSiteScan } from "@/lib/v1Api";
import { userIsAuthenticated } from "@/utils/users/Helpers";
import { SkeletonCards } from "@/components/v8/SkeletonWave";

const COLORS = { red: "#FF5A4E", yellow: "#FFC53D", green: "#3DDC84", blue: "#4DA3FF" };
const RGB = { red: "255,90,78", yellow: "255,197,61", green: "61,220,132", blue: "77,163,255" };
const KEYS = ["red", "yellow", "green", "blue"];
const LABELS = { red: "5 DIRE", yellow: "9 MEDIUM", green: "18 PASS", blue: "8 LOCKED" };
const TILE = {
  red: ["Dire", "Costing you the most. Fix first."],
  yellow: ["Medium", "Worth doing after the reds."],
  green: ["Passes", "Meets the criteria. Rechecked weekly."],
  blue: ["Locked", "Winning pages Searchify never touches."],
};
const DOT_PATTERN = "gbgygrbgggybgygrbggybggrgbyggbgybgygb";
const ACCENT = "#D5F879";

const LOOK_FOR = [
  "Google",
  "ChatGPT",
  "Google AI Overviews",
  "Perplexity",
  "Gemini",
  "Microsoft Copilot",
  "Claude",
  "Bing",
];

const AI_HELPS = [
  { n: "01", tag: "Included", soon: false, title: "Let AI in the door", body: "Many sites accidentally block the bots ChatGPT and Perplexity use to read the web. We check, and fix it on WordPress." },
  { n: "02", tag: "Included", soon: false, title: "Say it plainly", body: "AI quotes pages that answer clearly: what you do, where, and for whom. Searchify rewrites the pages that don't." },
  { n: "03", tag: "Included", soon: false, title: "Get seen beyond Google", body: "Every change is pushed to Bing too, which feeds Copilot and is one of the sources ChatGPT draws on." },
  { n: "04", tag: "Coming soon", soon: true, title: "See if AI mentions you", body: "Check whether ChatGPT, Perplexity and Google's AI bring up your business for the searches that matter." },
];

const VS_ROWS = [
  { label: "Sees your real Google data", chat: "Only what you paste in", ours: "Connected to Search Console and Analytics, with months of history" },
  { label: "Knows your competitors' rankings", chat: "Guesses", ours: "Real search data on who outranks you, and for what" },
  { label: "Changes your website", chat: "No, you copy and paste", ours: "Ships the fix to WordPress once you approve it" },
  { label: "Checks the change worked", chat: "No", ours: "Reads the page back to confirm it's live" },
  { label: "Measures the result", chat: "No", ours: "Before and after, about a month later" },
  { label: "Undo", chat: "No", ours: "One click, with a full change log" },
  { label: "Keeps watching", chat: "Only when you ask", ours: "Every week, and alerts you if something slips" },
];

const PLATFORM_SHARE = [
  { name: "WordPress · works today", pct: "43.3%", color: "#3DDC84", live: true, dash: "216.15 502.65", offset: "0" },
  { name: "Shopify", pct: "4.4%", color: "#FFC53D", live: false, dash: "20.62 502.65", offset: "-217.65" },
  { name: "Wix", pct: "2.7%", color: "#FF9F43", live: false, dash: "12.07 502.65", offset: "-239.77" },
  { name: "Squarespace", pct: "2.1%", color: "#C9B8FF", live: false, dash: "9.06 502.65", offset: "-253.34" },
  { name: "Joomla", pct: "1.7%", color: "#8A93A3", live: false, dash: "7.05 502.65", offset: "-263.89" },
  { name: "Webflow", pct: "0.8%", color: "#4DA3FF", live: false, dash: "2.52 502.65", offset: "-272.44" },
  { name: "Every other platform", pct: "14.0%", color: "#5B616B", live: false, dash: "68.87 502.65", offset: "-276.46" },
  { name: "Custom-built, no platform", pct: "31.0%", color: "#2E333B", live: false, dash: "154.32 502.65", offset: "-346.83" },
];

const CONNECT_NOW = [
  { title: "WordPress", body: "Where your fixes get made, safely, with one-click undo." },
  { title: "Google Search Console", body: "Google's own data on the searches you show up for and the clicks you get." },
  { title: "Google Analytics", body: "Visits, calls and leads, so you can see what each fix earned (Pro and Agency)." },
  { title: "Bing", body: "Your changes are sent to Bing too, which feeds Copilot and AI answers." },
];

const COMING_SOON = [
  { title: "Shopify", body: "For online stores." },
  { title: "Webflow", body: "For design-led sites and agencies." },
  { title: "Wix and Squarespace", body: "For small local businesses." },
];

const CheckIcon = ({ color = "#3DDC84" }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="8" fill="none" stroke="#FFC53D" strokeWidth="2" />
    <path d="M12 8v4l3 2" fill="none" stroke="#FFC53D" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const QUOTES = [
  { text: "Add a real customer quote here: one or two sentences on the result they saw.", who: "Customer name", role: "Business · City", color: "#FF5A4E" },
  { text: "Add a real customer quote here: ideally an agency talking about client reports.", who: "Customer name", role: "Agency · City", color: "#FFC53D" },
  { text: "Add a real customer quote here: a specific number beats a general compliment.", who: "Customer name", role: "Business · City", color: "#4DA3FF" },
];

const LOG_SEED = [
  { id: "a", type: "TITLE", what: "Roof repair title now mentions Calgary + 24/7", sub: "/services/roof-repair · Oct 14" },
  { id: "b", type: "IMAGE", what: "Alt text added to 9 skylight photos", sub: "/services/skylights · Oct 12" },
  { id: "c", type: "META", what: "New description for the siding page", sub: "/services/siding · Oct 9" },
  { id: "d", type: "LINKS", what: "3 posts now link to gutter guards", sub: "/services/gutter-guards · Oct 6" },
];

function sceneFor(tile, shipped) {
  const base = {
    red: {
      tag: "DIRE · TITLE REWRITE",
      page: "/services/roof-repair",
      title: "Your title hides the two words people search for.",
      isFix: true,
      beforeT: "Roof Repair Services | Northline Roofing",
      beforeD: "Learn more about our roof repair services.",
      afterT: "Roof Repair in Calgary — 24/7 Emergency Leaks | Northline",
      afterD: "Same-day leak repairs across Calgary. Written quote before any work starts.",
      gain: "+40–90 clicks / month",
    },
    yellow: {
      tag: "MEDIUM · DESCRIPTION",
      page: "/services/siding",
      title: "Google is guessing your description. Give it a real one.",
      isFix: true,
      beforeT: "Siding | Northline Roofing",
      beforeD: "(No description. Google shows a random sentence from the page.)",
      afterT: "Siding Repair & Replacement in Calgary | Northline",
      afterD: "Hail-damaged siding? Calgary crews, insurance help, quotes in 24 hours.",
      gain: "+10–20 clicks / month",
    },
    green: {
      tag: "PASSES · 4 CHECKS",
      page: "/contact",
      title: "This page passes. Nothing to ship.",
      isList: true,
      rows: [
        { title: "Title length OK", sub: "52 characters", icon: "✓" },
        { title: "Indexed by Google", sub: "last crawl 3 days ago", icon: "✓" },
        { title: "Mobile-friendly", sub: "no layout issues", icon: "✓" },
        { title: "Loads fast", sub: "1.8s on phones", icon: "✓" },
      ],
      foot: "Searchify rechecks green pages every week. If one slips, it turns yellow and lands in your queue.",
    },
    blue: {
      tag: "LOCKED · WINNING",
      page: "/services/flat-roofs",
      title: "This page is winning. Searchify won’t touch it.",
      isList: true,
      rows: [
        { title: "#2 on Google", sub: "flat roof repair calgary", icon: "▲" },
        { title: "+71% clicks", sub: "since the September change", icon: "▲" },
        { title: "3 leads a month", sub: "from this page alone", icon: "▲" },
        { title: "Locked", sub: "unlocks only if rankings drop for 2 weeks", icon: "🔒" },
      ],
      foot: "Locked pages are protected from automation, so a good result never gets “optimised” away.",
    },
  }[tile];

  return {
    ...base,
    color: COLORS[tile],
    border: `rgba(${RGB[tile]},.45)`,
    glow: `0 0 34px rgba(${RGB[tile]},.12)`,
    afterLabel: shipped ? "LIVE IN GOOGLE · CHECKED" : "WE SUGGEST",
    afterLabelColor: shipped ? "#3DDC84" : "#4DA3FF",
    afterBorder: shipped ? "#3DDC84" : "#4DA3FF",
  };
}

function hostLabel(raw) {
  const site = normalizeSiteUrl(raw);
  if (!site) return "yourwebsite.com";
  try {
    return new URL(site).hostname.replace(/^www\./, "") || "yourwebsite.com";
  } catch {
    return String(raw || "yourwebsite.com").replace(/^https?:\/\//i, "").replace(/^www\./, "") || "yourwebsite.com";
  }
}

function PlugChip({ label, ariaHidden = false }) {
  return (
    <span className="sf-plug" aria-hidden={ariaHidden || undefined}>
      <span className="sf-plug-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

export default function HomeView() {
  const router = useRouter();
  const [focus, setFocus] = useState(0);
  const [tile, setTile] = useState("red");
  const [shipped, setShipped] = useState(false);
  const [undone, setUndone] = useState({});
  const [heroUrl, setHeroUrl] = useState("");
  const [footUrl, setFootUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scan, setScan] = useState(null);
  const [scanError, setScanError] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setFocus((value) => (value + 1) % 4), 2200);
    return () => clearInterval(timer);
  }, []);

  const focusKey = KEYS[focus];
  const dots = useMemo(() => {
    const map = { r: "red", y: "yellow", g: "green", b: "blue" };
    return Array.from({ length: 40 }, (_, i) => {
      const c = map[DOT_PATTERN[i % DOT_PATTERN.length]];
      const on = c === focusKey;
      return {
        color: COLORS[c],
        op: on ? 1 : 0.16,
        shadow: on ? `0 0 20px ${COLORS[c]}` : "none",
        anim: on,
      };
    });
  }, [focusKey]);

  const sc = sceneFor(tile, shipped);
  const log = LOG_SEED.map((row) => {
    const reverted = !!undone[row.id];
    return { ...row, reverted };
  });

  const runPreview = async (raw) => {
    const site = normalizeSiteUrl(raw);
    if (!site || !hostLabel(site).includes(".")) {
      setScanError("Enter a website address, like example.com.");
      return;
    }
    setScanError("");
    setScan(null);
    setScanning(true);
    const res = await previewSiteScan(site);
    setScanning(false);
    if (!res.ok) {
      const detail = res.data?.detail;
      setScanError(typeof detail === "string" ? detail : "Could not read that site. Check the address and try again.");
      return;
    }
    const next = res.data?.scan || null;
    setScan(next);
    if (next?.home) stashPendingSite(next.home);
    const board = document.getElementById("scan");
    board?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const openFullScan = () => {
    const site = scan?.home || normalizeSiteUrl(heroUrl || footUrl);
    if (!site) return;
    stashPendingSite(site);
    if (userIsAuthenticated()) {
      seedDraftSite(site);
      router.push("/app/start");
      return;
    }
    const q = new URLSearchParams({ next: "/app/start", site });
    router.push(`/signup?${q}`);
  };

  const previewHost = hostLabel(heroUrl || footUrl);
  const boardDots = scan
    ? Array.from({ length: 40 }, (_, index) => {
        const item = scan.dots?.[index];
        if (!item) return { color: "#2C3138", op: 0.35, shadow: "none", anim: false, title: "" };
        const color = COLORS[item.color] || COLORS.yellow;
        return {
          color,
          op: 1,
          shadow: `0 0 16px ${color}`,
          anim: false,
          title: item.path || "",
        };
      })
    : dots;

  return (
    <LandingShell current="home">
      <LandingMotion />
      <HomeBrandHero />

      <div className="sf-rest" id="rest">
      <header className="sf-hero sf-hero-v3">
        <div className="sf-hero-copy">
          <h1>Get found on Google. And in the AI answers.</h1>
          <p>
            Your customers search Google, then ask ChatGPT. Searchify finds what&apos;s keeping your site out of both,
            fixes it one step at a time with your OK, and shows you what each fix earned.
          </p>
          <form
            id="scan"
            className="sf-urlrow"
            onSubmit={(event) => {
              event.preventDefault();
              runPreview(heroUrl);
            }}
          >
            <label className="sf-urlfield">
              <span className="sf-sr">Your website</span>
              <input
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="yourwebsite.com"
                value={heroUrl}
                onChange={(event) => setHeroUrl(event.target.value)}
              />
            </label>
            <button className="sf-btn-blue lg" type="submit" disabled={scanning}>
              {scanning ? "Scanning…" : "Scan it free"}
            </button>
          </form>
          <span className="sf-note">No account. About 60 seconds. Nothing on your site changes. Then try Solo free for your first month.</span>
          {scanError ? (
            <p role="alert" className="sf-note" style={{ color: "#FF5A4E" }}>
              {scanError}
            </p>
          ) : null}
          {scanning ? <SkeletonCards count={1} lines={3} /> : null}
          {scan ? (
            <div className="sf-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <strong>
                {scan.host} · {scan.pagesRead} {scan.pagesRead === 1 ? "page" : "pages"} read
              </strong>
              <span className="sf-note" style={{ margin: 0 }}>
                {scan.counts?.red || 0} dire · {scan.counts?.yellow || 0} medium · {scan.counts?.green || 0} in place
              </span>
              {(scan.findings || []).length ? (
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                  {scan.findings.map((item) => (
                    <li key={`${item.path}-${item.label}`} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <i style={{ width: 10, height: 10, marginTop: 6, borderRadius: "50%", background: COLORS[item.color] || COLORS.yellow, flex: "none" }} />
                      <span>
                        <strong>{item.label}</strong>
                        <span className="sf-note" style={{ display: "block" }}>
                          {item.path} · {item.detail}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="sf-note" style={{ margin: 0 }}>
                  The pages we read already have a title and description.
                </span>
              )}
              <button className="sf-btn-blue" type="button" onClick={openFullScan}>
                {userIsAuthenticated() ? "Continue this scan in Searchify" : "Save this scan and continue"}
              </button>
            </div>
          ) : null}
        </div>

        <div className="sf-hero-visual">
          <div className="sf-hero-board" aria-hidden={scan ? undefined : true}>
            <div className="sf-hero-board-top">
              <span>{scan?.host || previewHost}</span>
              <span style={{ color: scan ? COLORS.red : COLORS[focusKey] }}>
                {scanning
                  ? "READING"
                  : scan
                    ? `${scan.counts?.red || 0} DIRE`
                    : LABELS[focusKey]}
              </span>
            </div>
            <div className="sf-dots">
              {boardDots.map((dot, index) => (
                <div className="sf-dot-cell" key={index} title={dot.title || undefined}>
                  <div
                    className={`sf-dot${dot.anim ? " is-live" : ""}`}
                    style={{
                      background: dot.color,
                      opacity: dot.op,
                      boxShadow: dot.shadow,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="sf-hero-hand" aria-hidden="true">
            <svg width="70" height="64" viewBox="0 0 70 64" role="presentation">
              <path d="M60 58 C 30 58, 14 44, 16 8" fill="none" stroke="#4DA3FF" strokeWidth="3" strokeLinecap="round" />
              <path d="M7 18 L16 6 L25 18" fill="none" stroke="#4DA3FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p>
              Getting every light green is only the beginning. The real goal is a board full of{" "}
              <span>blue</span>: pages that are winning, and locked in.
            </p>
          </div>
        </div>
      </header>

      <section className="sf-plugs" aria-label="Where people look for you">
        <div className="sf-plugs-inner">
          <span className="sf-plugs-label">WHERE PEOPLE LOOK FOR YOU</span>
          <div className="sf-marquee">
            <div className="sf-track">
              {[...LOOK_FOR, ...LOOK_FOR].map((label, index) => (
                <PlugChip key={`${label}-${index}`} label={label} ariaHidden={index >= LOOK_FOR.length} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="ai" className="sf-ai-block" aria-labelledby="ai-h">
        <div className="sf-split">
          <div className="sf-split-copy">
            <span className="sf-script">Search has changed.</span>
            <h2 id="ai-h">Ranking on Google isn&apos;t enough anymore.</h2>
            <p>
              More and more people ask ChatGPT, Perplexity or Google&apos;s AI for a recommendation and never scroll the
              results. Those answers mention only a handful of businesses, and they don&apos;t simply copy Google&apos;s
              top ten. If AI can&apos;t read your site, or can&apos;t tell what you do and where, it recommends someone else.
            </p>
            <span className="sf-note">Ahrefs found only about 1 in 10 AI citations comes from a page in Google&apos;s top 10 (2026).</span>
          </div>
          <figure className="sf-ai-chat" aria-label="Example of an AI answer that recommends a local business">
            <span className="sf-ai-q">Who&apos;s good for hail damage roof repair in Calgary?</span>
            <div className="sf-ai-a">
              <span className="sf-ai-badge" aria-hidden="true">AI</span>
              <div className="sf-ai-a-body">
                <span>
                  A few well-reviewed options: <strong>Northline Roofing</strong> offers 24/7 emergency leak repair across
                  Calgary and helps with insurance claims <span className="sf-ai-cite">northline.example</span>, and two
                  other local companies also come up often.
                </span>
                <span style={{ fontSize: 13, color: "#9AA1AB" }}>
                  The businesses that get named are the ones whose sites clearly say what they do, where, and why to trust them.
                </span>
              </div>
            </div>
            <figcaption className="sf-note">Illustration. Real AI answers vary.</figcaption>
          </figure>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>How Searchify helps AI find and recommend you</h3>
          <div className="sf-ai-help-grid">
            {AI_HELPS.map((item) => (
              <div className="sf-ai-help-card" key={item.n}>
                <span className="sf-ai-help-top">
                  <span className="sf-ai-help-num">{item.n}</span>
                  <span className={`sf-tag ${item.soon ? "is-soon" : "is-in"}`}>{item.tag}</span>
                </span>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </div>
            ))}
          </div>
          <span className="sf-ai-help-note">
            Straight talk: nobody can promise an AI will mention you. What we can do is make sure nothing on your site is
            standing in the way.
          </span>
        </div>
      </section>

      <section id="vs" className="sf-vs-block" aria-labelledby="vs-h">
        <div className="sf-vs-copy">
          <span className="sf-script">&quot;Can&apos;t I just ask ChatGPT?&quot;</span>
          <h2 id="vs-h">An AI chat gives advice. Searchify does the work.</h2>
          <p>
            ChatGPT, Claude and Gemini are brilliant at explaining SEO. We use AI too. But a chat window can&apos;t see
            your private Google data, can&apos;t log in to your website, and isn&apos;t watching it next week. Searchify
            connects to all of it, acts on it with your OK, and proves what changed.
          </p>
        </div>
        <div className="sf-vs-table" role="table" aria-label="AI chat assistants versus Searchify">
          <div className="sf-vs-table-inner">
            <div className="sf-vs-head" role="row">
              <span role="columnheader" />
              <span role="columnheader">AI CHAT ASSISTANTS</span>
              <span role="columnheader">SEARCHIFY</span>
            </div>
            {VS_ROWS.map((row) => (
              <div className="sf-vs-row" role="row" key={row.label}>
                <strong role="rowheader">{row.label}</strong>
                <span className="muted" role="cell">{row.chat}</span>
                <span className="sf-vs-ok" role="cell">
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M5 12.5l4.5 4.5L19 7.5"
                      fill="none"
                      stroke="#3DDC84"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{row.ours}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <span className="sf-ai-help-note">
          Think of it this way: a chat assistant is a smart friend with good advice. Searchify is the crew that shows up
          every week, does the job, and shows you the before and after.
        </span>
      </section>

      <section id="platforms" className="sf-platforms-block" aria-labelledby="pl-h">
        <div className="sf-split">
          <div className="sf-split-copy">
            <span className="sf-script">On WordPress? You&apos;re in.</span>
            <h2 id="pl-h">Nearly half the internet runs on WordPress. Searchify works with it today.</h2>
            <p>
              About 43% of all websites are built on WordPress, more than every other platform combined. If yours is one
              of them, Searchify can scan it, fix it and prove the results right now. Other platforms are on the way.
            </p>
          </div>
          <figure className="sf-platforms-chart" aria-label="Website platform share">
            <svg viewBox="0 0 220 220" role="img" aria-hidden="true">
              <circle cx="110" cy="110" r="80" fill="none" stroke="#16181C" strokeWidth="40" />
              {PLATFORM_SHARE.map((item) => (
                <circle
                  key={item.name}
                  cx="110"
                  cy="110"
                  r="80"
                  fill="none"
                  stroke={item.color}
                  strokeWidth={item.live ? 46 : 40}
                  strokeDasharray={item.dash}
                  strokeDashoffset={item.offset}
                />
              ))}
            </svg>
            <div className="sf-plat-legend">
              {PLATFORM_SHARE.map((item) => (
                <div className={`sf-plat-legend-row${item.live ? " is-live" : ""}`} key={item.name}>
                  <span className="sf-plat-swatch" style={{ background: item.color }} />
                  <span>{item.name}</span>
                  <span className="sf-mono">{item.pct}</span>
                </div>
              ))}
              <figcaption className="sf-note" style={{ paddingTop: 6 }}>
                Share of all websites by platform. Source: W3Techs, 2025–2026.
              </figcaption>
            </div>
          </figure>
        </div>
        <div className="sf-plat-cards">
          <div className="sf-plat-card is-live">
            <span className="sf-tag is-in">Works today</span>
            <h3>What Searchify connects to right now</h3>
            {CONNECT_NOW.map((item) => (
              <div className="sf-plat-row" key={item.title}>
                <CheckIcon />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.body}</small>
                </span>
              </div>
            ))}
            <Link className="sf-btn-blue" href="/#scan">
              Scan my WordPress site free
            </Link>
          </div>
          <div className="sf-plat-card">
            <span className="sf-tag is-soon">Coming soon</span>
            <h3>On another platform? We&apos;re working on it.</h3>
            {COMING_SOON.map((item) => (
              <div className="sf-plat-row" key={item.title}>
                <SoonIcon />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.body}</small>
                </span>
              </div>
            ))}
            <span className="sf-note">
              You can still run a free scan on any site today. We&apos;ll email you the day your platform is supported.
            </span>
          </div>
        </div>
      </section>

      <section id="how" className="sf-section">
        <h2>You handle plugging in your sites, we handle the rest.</h2>
        <div className="sf-how-grid">
          <article className="sf-card">
            <span className="sf-kicker">01 · PLUG IN</span>
            <svg viewBox="0 0 300 70" aria-hidden="true" className="sf-cable">
              <g style={{ filter: "drop-shadow(0 0 8px rgba(77,163,255,.7))" }}>
                <path
                  d="M-10 35 C 60 35, 90 14, 150 28 S 200 48, 214 35"
                  fill="none"
                  stroke="#4DA3FF"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  className="sf-flow"
                  d="M-10 35 C 60 35, 90 14, 150 28 S 200 48, 214 35"
                  fill="none"
                  stroke="#CFE6FF"
                  strokeWidth="2"
                  strokeDasharray="3 16"
                />
                <rect x="212" y="20" width="40" height="30" rx="7" fill="#4DA3FF" />
              </g>
              <rect x="252" y="12" width="44" height="46" rx="10" fill="#131519" stroke="#4DA3FF" strokeWidth="2" />
            </svg>
            <h3>Connect Google and WordPress</h3>
            <p>Two cables. When they glow blue, data is flowing. That&apos;s the whole setup.</p>
          </article>
          <article className="sf-card">
            <span className="sf-kicker">02 · SHIP ONE MOVE</span>
            <div className="sf-before-after" aria-hidden="true">
              <div className="sf-strike">Roof Repair Services | Northline</div>
              <div className="sf-suggest">Roof Repair in Calgary — 24/7 Emergency Leaks</div>
            </div>
            <h3>Approve the next fix in one tap</h3>
            <p>See the exact before and after, and why. Nothing goes live without you, and every change has one-click undo.</p>
          </article>
          <article className="sf-card">
            <span className="sf-kicker">03 · SEE WHAT IT EARNED</span>
            <div className="sf-gain" aria-hidden="true">
              <span style={{ color: ACCENT }}>+64</span>
              <small>visitors / month</small>
            </div>
            <h3>Get proof, not promises</h3>
            <p>
              Good SEO takes at least a month to show. About four weeks after each change, Searchify shows what it did
              (visitors, calls, rankings) and adds it to your total.
            </p>
          </article>
        </div>
      </section>

      <section className="sf-band">
        <div className="sf-band-inner">
          <div className="sf-band-copy">
            <h2>Every task, colour-coded.</h2>
            <p>No 40-tab SEO dashboard. One board that tells you what&apos;s urgent, what can wait, and what to leave alone.</p>
          </div>

          <div className="sf-tiles" role="group" aria-label="Pick a colour to see it in action">
            {KEYS.map((key) => {
              const on = key === tile;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  className={`sf-tile${on ? " is-on" : ""}`}
                  style={{
                    background: on ? `rgba(${RGB[key]},.08)` : "transparent",
                    borderColor: on ? COLORS[key] : "#262A31",
                    boxShadow: on ? `0 0 26px rgba(${RGB[key]},.3)` : "none",
                  }}
                  onClick={() => {
                    setTile(key);
                    setShipped(false);
                  }}
                >
                  <span className="sf-tile-top">
                    <span
                      className={`sf-tile-dot${on ? " is-live" : ""}`}
                      style={{
                        background: COLORS[key],
                        boxShadow: on ? `0 0 12px ${COLORS[key]}` : "none",
                      }}
                    />
                    <span style={{ color: on ? COLORS[key] : "#5B616B" }}>{on ? "SHOWING ↓" : "TAP TO SEE"}</span>
                  </span>
                  <strong>{TILE[key][0]}</strong>
                  <span>{TILE[key][1]}</span>
                </button>
              );
            })}
          </div>

          <div
            className="sf-scene"
            aria-live="polite"
            style={{ borderColor: sc.border, boxShadow: sc.glow }}
          >
            <div className="sf-scene-meta">
              <span style={{ color: sc.color }}>
                <i style={{ background: sc.color, boxShadow: `0 0 10px ${sc.color}` }} />
                {sc.tag}
              </span>
              <span className="sf-dotsep">·</span>
              <span className="sf-mono muted">{sc.page}</span>
              <span className="sf-scene-note">Example from a real-style scan</span>
            </div>
            <h3>{sc.title}</h3>

            {sc.isFix ? (
              <>
                <div className="sf-compare">
                  <div className="sf-compare-card">
                    <span className="sf-mono tiny">IN GOOGLE NOW</span>
                    <strong>{sc.beforeT}</strong>
                    <p>{sc.beforeD}</p>
                  </div>
                  <div className="sf-compare-card is-after" style={{ borderColor: sc.afterBorder }}>
                    <span className="sf-mono tiny" style={{ color: sc.afterLabelColor }}>
                      {sc.afterLabel}
                    </span>
                    <strong>{sc.afterT}</strong>
                    <p>{sc.afterD}</p>
                  </div>
                </div>
                <div className="sf-scene-actions">
                  <span className="sf-scene-gain" style={{ color: ACCENT }}>
                    {sc.gain}
                  </span>
                  {!shipped ? (
                    <button className="sf-btn-blue" type="button" onClick={() => setShipped(true)}>
                      Try it: Ship it
                    </button>
                  ) : (
                    <span className="sf-shipped-row">
                      <span className="sf-shipped">● Shipped · checked live · logged in the change log</span>
                      <button className="sf-btn-ghost" type="button" onClick={() => setShipped(false)}>
                        Undo
                      </button>
                    </span>
                  )}
                </div>
              </>
            ) : null}

            {sc.isList ? (
              <>
                <div className="sf-list-grid">
                  {sc.rows.map((row) => (
                    <div className="sf-list-row" key={row.title}>
                      <span
                        className="sf-list-icon"
                        style={{
                          background: tile === "blue" ? "rgba(77,163,255,.15)" : "rgba(61,220,132,.15)",
                          color: tile === "blue" ? "#4DA3FF" : "#3DDC84",
                        }}
                      >
                        {row.icon}
                      </span>
                      <span>
                        <strong>{row.title}</strong>
                        <small className="sf-mono">{row.sub}</small>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="sf-scene-foot">{sc.foot}</p>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="sf-section sf-trust">
        <h2>Automation you can actually trust with a client&apos;s site.</h2>

        <div className="sf-changelog">
          <div className="sf-changelog-copy">
            <span className="sf-pill-blue">ONLY IN SEARCHIFY · THE CHANGE LOG</span>
            <h3>Every change is recorded, reversible and reported.</h3>
            <p>
              Searchify keeps its own change log tab for every site. You see exactly what changed, on which page, and
              when — titles, descriptions, images, links, content. Undo any change in one click, or roll a page back to
              any earlier version. Every change and every reversal flows straight into the report your client or boss
              receives.
            </p>
            <div className="sf-chips">
              <span>↺ Undo in one click</span>
              <span>⟲ Roll back to any version</span>
              <span>✉ Reported automatically</span>
            </div>
          </div>
          <div className="sf-log-panel">
            <div className="sf-log-head">
              <span>Change log · northline.example</span>
              <span className="sf-mono tiny">LIVE DEMO</span>
            </div>
            {log.map((row) => (
              <div
                key={row.id}
                className={`sf-log-row${row.reverted ? " is-undone" : ""}`}
              >
                <span className="sf-log-type">{row.type}</span>
                <span className="sf-log-body">
                  <strong style={{ textDecoration: row.reverted ? "line-through" : "none" }}>{row.what}</strong>
                  <small className="sf-mono">
                    {row.reverted ? "Reverted to the previous version · client report updated" : row.sub}
                  </small>
                </span>
                <button
                  type="button"
                  className="sf-btn-ghost sm"
                  style={{
                    color: row.reverted ? "#FFC53D" : "#F2F4F5",
                    borderColor: row.reverted ? "rgba(255,197,61,.5)" : "#262A31",
                  }}
                  onClick={() =>
                    setUndone((prev) => ({ ...prev, [row.id]: !prev[row.id] }))
                  }
                >
                  {row.reverted ? "Redo" : "Undo"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="sf-trust-grid">
          <div>
            <strong>You approve every change</strong>
            <span>Searchify drafts. You decide. Edit anything first.</span>
          </div>
          <div>
            <strong>Checked live</strong>
            <span>After shipping, it reads the page back to confirm it matches.</span>
          </div>
          <div>
            <strong>Nothing is ever lost</strong>
            <span>The old version of every change is saved in the change log, forever.</span>
          </div>
          <div>
            <strong>Winners stay locked</strong>
            <span>Pages that already perform are off-limits.</span>
          </div>
        </div>
      </section>

      <section id="testimonials" className="sf-section sf-testimonials">
        <h2>What customers say</h2>
        <div className="sf-quote-grid">
          {QUOTES.map((quote) => (
            <figure className="sf-quote" key={quote.color + quote.role}>
              <span aria-hidden="true" style={{ color: quote.color }}>
                “
              </span>
              <blockquote>{quote.text}</blockquote>
              <figcaption>
                <i />
                <span>
                  <strong>{quote.who}</strong>
                  <small>{quote.role}</small>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
        <span className="sf-mono tiny muted">PLACEHOLDER · REPLACE WITH REAL CUSTOMER QUOTES BEFORE LAUNCH</span>
      </section>

      <section id="agencies" className="sf-section sf-agencies">
        <div className="sf-agency">
          <div>
            <span className="sf-kicker">FOR AGENCIES</span>
            <h2>Every client on one screen. Reports that write themselves.</h2>
            <p>
              See which client needs attention, approve moves across sites, and send a branded monthly report showing
              exactly what you shipped and what it earned.
            </p>
          </div>
          <div className="sf-agency-list" aria-hidden="true">
            <div>
              <i style={{ background: "#FF5A4E", boxShadow: "0 0 10px #FF5A4E" }} />
              <span>Northline Roofing</span>
              <small className="sf-mono">6 dire</small>
            </div>
            <div>
              <i style={{ background: "#FFC53D" }} />
              <span>Bowvalley Dental</span>
              <small className="sf-mono">4 medium</small>
            </div>
            <div>
              <i style={{ background: "#4DA3FF" }} />
              <span>Prairie Coffee Co.</span>
              <small className="sf-mono">all clear</small>
            </div>
          </div>
        </div>
      </section>

      <section className="sf-closing">
        <h2>Find out if Google, and AI, can find you.</h2>
        <form
          className="sf-urlrow center"
          onSubmit={(event) => {
            event.preventDefault();
            runPreview(footUrl || heroUrl);
          }}
        >
          <label className="sf-urlfield">
            <span className="sf-sr">Your website</span>
            <input
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="yourwebsite.com"
              value={footUrl}
              onChange={(event) => setFootUrl(event.target.value)}
            />
          </label>
          <button className="sf-btn-blue lg" type="submit" disabled={scanning}>
            {scanning ? "Scanning…" : "Scan it free"}
          </button>
        </form>
      </section>
      </div>
    </LandingShell>
  );
}
