"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LandingShell from "@/components/landing/LandingShell";
import TestimonialsSlider from "@/components/landing/TestimonialsSlider";
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

const PLUGS = [
  { id: "Claude", label: "Claude", short: "Cl", color: "#D97757" },
  { id: "Google Search Console", label: "Google Search Console", short: "SC", color: "#4285F4" },
  { id: "Google Analytics", label: "Google Analytics", short: "GA", color: "#F9AB00" },
  { id: "Shopify", label: "Shopify", short: "Sh", color: "#95BF47" },
  { id: "WordPress", label: "WordPress", short: "WP", color: "#3D8FD1" },
  { id: "Webflow", label: "Webflow", short: "Wf", color: "#4353FF" },
  { id: "ChatGPT", label: "ChatGPT", short: "GPT", color: "#10A37F" },
];

const QUOTES = [
  { text: "Add a real customer quote here: one or two sentences on the result they saw.", who: "Customer name", role: "Business · City", color: "#FF5A4E" },
  { text: "Add a real customer quote here: ideally an agency talking about client reports.", who: "Customer name", role: "Agency · City", color: "#FFC53D" },
  { text: "Add a real customer quote here: a specific number beats a general compliment.", who: "Customer name", role: "Business · City", color: "#4DA3FF" },
  { text: "Add a real customer quote here: what changed after they approved the first title rewrite.", who: "Customer name", role: "Business · City", color: "#3DDC84" },
  { text: "Add a real customer quote here: how the change log helped a client conversation.", who: "Customer name", role: "Agency · City", color: "#FF9F43" },
  { text: "Add a real customer quote here: a locked winning page they did not want automation to touch.", who: "Customer name", role: "Business · City", color: "#2CC7C0" },
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

function PlugChip({ item, ariaHidden = false }) {
  return (
    <span className="sf-plug" aria-hidden={ariaHidden || undefined}>
      <span className="sf-plug-mark" data-logo={item.id} style={{ color: item.color }}>
        {item.short}
      </span>
      {item.label}
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
      <header className="sf-hero">
        <div className="sf-hero-copy">
          <h1>Don&apos;t lose customers on Google. Cast a better net.</h1>
          <p>
            Searchify scans your site, colour-codes every fix, and ships them one at a time — with your approval, and
            proof of what each one earned.
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
          <span className="sf-note">No account. Nothing on your site changes. A few live pages, colour-coded.</span>
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
      </header>

      <section className="sf-plugs" aria-label="Works with">
        <div className="sf-plugs-inner">
          <span className="sf-plugs-label">PLUGS INTO</span>
          <div className="sf-marquee">
            <div className="sf-track">
              {[...PLUGS, ...PLUGS].map((item, index) => (
                <PlugChip key={`${item.id}-${index}`} item={item} ariaHidden={index >= PLUGS.length} />
              ))}
            </div>
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
            <p>Four weeks after each change, Searchify shows what it did — visitors, calls, ranking — and adds it to your total.</p>
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

      <section id="testimonials" className="sf-section">
        <h2>What customers say</h2>
        <TestimonialsSlider items={QUOTES} />
        <span className="sf-mono tiny muted">PLACEHOLDER · REPLACE WITH REAL CUSTOMER QUOTES BEFORE LAUNCH</span>
      </section>

      <section id="agencies" className="sf-section">
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
        <h2>Find out what your site is leaving on the table.</h2>
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
        <p className="sf-note">
          Prefer to explore first?{" "}
          <Link href="/signup">Create an account</Link> or <Link href="/login">sign in</Link>.
        </p>
      </section>
    </LandingShell>
  );
}
