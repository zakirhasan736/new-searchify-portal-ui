"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { loadFeatures } from "@/lib/clientApi";
import { getProject } from "@/utils/users/ProjectUtil";
import GoogleConnectPanel from "@/components/studio/GoogleConnectPanel";

const PLACES = ["United States", "United Kingdom", "Worldwide", "Nigeria", "Canada"];
const SCOPES = ["Root Domain", "Subdomain", "URL"];
const DEVICES = ["Desktop", "Mobile", "Desktop + Mobile"];
const RANGES = ["Last 7 days", "Last 28 days", "Last 3 months", "Last 12 months"];
const TRAFFIC_TABS = ["Searchify data", "Google data"];
const CHANNELS = [
  ["Direct", true],
  ["Referral", true],
  ["Organic Search", true],
  ["Organic Social", false],
  ["Paid Social", false],
  ["Paid Search", true],
  ["Display Ads", false],
  ["Email", false],
];

const SETUP = [
  ["On Page SEO Checker", "Titles, meta, and on-page fixes for one URL.", "/site/on-page"],
  ["Backlink Audit", "Toxic and safe links waiting for review.", "/links/audit"],
  ["Organic Traffic Insights", "Domain keyword and page gaps.", "/organicsearch/home"],
  ["Link Building", "Prospects — outreach waits for a person.", "/links/building"],
];

const SECTIONS = [
  ["ai", "AI answers"],
  ["seo", "Domain pulse"],
  ["positions", "Ranks"],
  ["audit", "Health"],
  ["setup", "Tooling"],
  ["traffic", "Traffic"],
  ["lists", "Lists"],
  ["google", "Connect"],
];

function Menu({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-9 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-xs">
        <span className="text-white/35">{label}</span>
        <span>{value}</span>
      </button>
      {open ? (
        <ul className="studio-scroll absolute right-0 z-20 mt-1 max-h-52 w-44 overflow-y-auto rounded-2xl border border-white/10 bg-[#120e1c] py-1 shadow-2xl">
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-xs hover:bg-brand/15"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Band({ id, eyebrow, title, href, onHide, children, actions }) {
  return (
    <section id={`band-${id}`} className="scroll-mt-24 border-b border-white/10 py-6 sm:scroll-mt-8 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blush sm:text-[11px]">{eyebrow}</p>
          <h2 className="mt-2 font-sans text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {href ? (
            <Link href={href} className="rounded-2xl bg-brand/20 px-3 py-2 text-xs font-medium text-brand">
              Open tool
            </Link>
          ) : null}
          {onHide ? (
            <button type="button" onClick={onHide} className="rounded-2xl border border-white/10 px-3 py-2 text-xs text-white/40">
              Tuck away
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-5 sm:mt-6">{children}</div>
    </section>
  );
}

function MiniTrend({ points, labels }) {
  if (!points?.length) return null;
  const width = 640;
  const height = 160;
  const max = Math.max(...points.flatMap((p) => p.slice(1).map(Number)), 1);
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const path = (idx) =>
    points
      .map((point, i) => {
        const y = height - 14 - ((Number(point[idx]) || 0) / max) * (height - 32);
        return `${i === 0 ? "M" : "L"} ${i * step} ${y}`;
      })
      .join(" ");
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-brand/10 to-transparent p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full">
        <path d={`${path(1)} L ${width} ${height} L 0 ${height} Z`} fill="rgba(146,107,255,0.14)" />
        <path d={path(1)} fill="none" stroke="#926BFF" strokeWidth="3" className="chart-line" pathLength="1" />
        {points[0]?.length > 2 ? <path d={path(2)} fill="none" stroke="#E85782" strokeWidth="3" className="chart-line" pathLength="1" /> : null}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-white/35">
        {points.map((point) => (
          <span key={point[0]}>{point[0]}</span>
        ))}
      </div>
      {labels?.length ? (
        <div className="mt-2 flex gap-3 text-[11px]">
          <span className="text-brand">{labels[0]}</span>
          {labels[1] ? <span className="text-blush">{labels[1]}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function HealthRing({ value, label }) {
  const radius = 52;
  const dash = 2 * Math.PI * radius;
  const offset = dash - (Math.min(100, Number(value) || 0) / 100) * dash;
  return (
    <svg viewBox="0 0 130 130" className="h-36 w-36">
      <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
      <circle cx="65" cy="65" r={radius} fill="none" stroke="url(#healthGrad)" strokeWidth="10" strokeDasharray={dash} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 65 65)" />
      <defs>
        <linearGradient id="healthGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E85782" />
          <stop offset="100%" stopColor="#926BFF" />
        </linearGradient>
      </defs>
      <text x="65" y="62" textAnchor="middle" fill="white" fontSize="26" fontFamily="Poppins, sans-serif">
        {value}%
      </text>
      <text x="65" y="82" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="10">
        {label || "Health"}
      </text>
    </svg>
  );
}

function payloadOf(map, kind) {
  return map[kind]?.[0]?.payload || {};
}

export default function SeoDashboard() {
  const [data, setData] = useState({});
  const [domain, setDomain] = useState("searchify.example");
  const [place, setPlace] = useState("United States");
  const [scope, setScope] = useState("Root Domain");
  const [device, setDevice] = useState("Desktop");
  const [range, setRange] = useState("Last 28 days");
  const [trafficTab, setTrafficTab] = useState("Searchify data");
  const [channels, setChannels] = useState(() => Object.fromEntries(CHANNELS));
  const [hidden, setHidden] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const project = getProject();
    const site = project?.websites?.[0];
    if (site?.url || site?.name) setDomain(site.url || site.name);
    const kinds = ["seo-dashboard", "visibility-overview", "domain-snapshot", "position-tracking", "site-audit", "traffic-analytics", "keyword-ranking", "backlinks", "organic-search"];
    Promise.all(kinds.map(async (kind) => [kind, await loadFeatures(kind)])).then((pairs) => {
      setData(Object.fromEntries(pairs));
    });
  }, []);

  const panels = payloadOf(data, "seo-dashboard").panels || {};
  const visibility = payloadOf(data, "visibility-overview");
  const domainSnap = payloadOf(data, "domain-snapshot");
  const positions = payloadOf(data, "position-tracking");
  const audit = payloadOf(data, "site-audit");
  const traffic = payloadOf(data, "traffic-analytics");
  const rankings = payloadOf(data, "keyword-ranking");
  const backlinks = payloadOf(data, "backlinks");

  const aiKpis = panels.aiKpis || [
    ["AI Visibility", visibility.rows?.find((r) => String(r[0]).toLowerCase().includes("ai"))?.[2] || "7"],
    ["Mentions", "7"],
    ["Cited pages", "3"],
  ];
  const platforms = panels.aiPlatforms || [
    ["ChatGPT", "4"],
    ["AI Overview", "1"],
    ["AI Mode", "1"],
    ["Gemini", "1"],
  ];
  const seoKpis = panels.seoKpis || [
    ["Authority", domainSnap.panels?.score ?? "42"],
    ["Organic traffic", domainSnap.rows?.find((r) => String(r[0]).toLowerCase().includes("traffic"))?.[1] || "18420"],
    ["Organic keywords", domainSnap.rows?.find((r) => String(r[0]).toLowerCase().includes("keyword"))?.[1] || "1280"],
    ["Paid keywords", "24"],
    ["Ref. domains", domainSnap.rows?.find((r) => String(r[0]).toLowerCase().includes("referring"))?.[1] || "86"],
  ];
  const visibilityTrend = panels.visibilityTrend || positions.panels?.trend || [
    ["Sep 1", 0.08],
    ["Sep 8", 0.09],
    ["Sep 15", 0.11],
    ["Sep 22", 0.12],
  ];
  const buckets = panels.rankBuckets || positions.panels?.distribution || [
    ["Top 3", "12"],
    ["Top 10", "48"],
    ["Top 20", "96"],
    ["Top 100", "310"],
  ];
  const topKeywords = panels.topKeywords || (positions.rows || rankings.rows || []).slice(0, 5).map((row) => [row[0], row[1], row[2] || "—"]);
  const health = panels.healthScore ?? audit.panels?.score ?? 72;
  const auditCounts = panels.auditCounts || audit.panels?.audit || [
    ["Errors", "40"],
    ["Warnings", "14"],
  ];
  const crawled = panels.crawledPages || [
    ["Crawled", "820"],
    ["Limit", "1000"],
  ];
  const trafficTrend = panels.trafficTrend || traffic.panels?.trend || [
    ["Apr", 9200, 6100],
    ["May", 10100, 6800],
    ["Jun", 11400, 7400],
    ["Jul", 12800, 8100],
    ["Aug", 14200, 9000],
    ["Sep", 18420, 12004],
  ];
  const trafficKpis = panels.trafficKpis || traffic.rows?.slice(0, 5) || [
    ["Visits", "18420"],
    ["Uniques", "12004"],
    ["Pages / visit", "2.4"],
    ["Duration", "00:02:14"],
    ["Bounce", "38%"],
  ];
  const organicRows = panels.organicRankings || rankings.rows?.slice(0, 4) || [];
  const backlinkRows = panels.backlinkRows || backlinks.rows?.slice(0, 4) || [];

  const visible = useMemo(() => SECTIONS.map(([id]) => id).filter((id) => !hidden.includes(id)), [hidden]);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 pb-12 sm:gap-8 lg:grid-cols-[11rem_1fr]">
      <div className="studio-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
        {SECTIONS.map(([id, label]) => (
          <a
            key={id}
            href={`#band-${id}`}
            className={`shrink-0 rounded-full px-3 py-2 text-xs ${hidden.includes(id) ? "bg-white/5 text-white/25 line-through" : "bg-brand/20 text-brand"}`}
          >
            {label}
          </a>
        ))}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-4 space-y-1 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-3">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Reel</p>
          {SECTIONS.map(([id, label]) => (
            <a
              key={id}
              href={`#band-${id}`}
              className={`block rounded-xl px-3 py-2 text-sm ${hidden.includes(id) ? "text-white/25 line-through" : "text-white/65 hover:bg-brand/15 hover:text-white"}`}
            >
              {label}
            </a>
          ))}
        </div>
      </aside>

      <div className="min-w-0">
        <header className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-brand/20 via-[#120e1c] to-blush/15 px-4 py-6 sm:rounded-[2rem] sm:px-8 sm:py-8">
          <p className="text-xs text-white/45">
            <Link href="/home" className="hover:text-brand">
              Studio
            </Link>
            <span className="mx-2 text-white/25">/</span>
            <span className="text-brand">SEO space</span>
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="break-all font-sans text-3xl font-semibold tracking-tight sm:text-5xl">{domain.replace(/^https?:\/\//, "")}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">SEO reel — AI answers, ranks, health, and traffic from stored project facts. Providers stay waiting until connected.</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
              <Link href="/seooptimization/new" className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-ink">
                New SEO project
              </Link>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(typeof window !== "undefined" ? window.location.href : "");
                  setMessage("Link copied to clipboard.");
                }}
                className="h-11 rounded-2xl border border-white/15 px-4 text-sm"
              >
                Copy link
              </button>
            </div>
          </div>
          {message ? <p className="mt-3 text-sm text-brand">{message}</p> : null}
        </header>

        {visible.includes("ai") ? (
          <Band id="ai" eyebrow="01 · AI answers" title="Where the brand shows up in AI" href="/visibility/overview" onHide={() => setHidden((c) => [...c, "ai"])} actions={<Menu label="Location" value={place} options={PLACES} onChange={setPlace} />}>
            <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {aiKpis.map((row) => (
                  <div key={row[0]} className="rounded-[1.25rem] bg-white/[0.04] px-4 py-4 sm:py-5">
                    <p className="text-[11px] text-white/40">{row[0]}</p>
                    <p className="mt-2 font-sans text-2xl font-semibold sm:text-3xl">{row[1]}</p>
                  </div>
                ))}
              </div>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {platforms.map((row) => (
                  <li key={row[0]} className="flex items-center justify-between rounded-[1.25rem] border border-white/10 px-4 py-3 text-sm">
                    <span className="text-white/60">{row[0]}</span>
                    <span className="font-semibold text-brand">{row[1]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Band>
        ) : null}

        {visible.includes("seo") ? (
          <Band
            id="seo"
            eyebrow="02 · Domain pulse"
            title="Core SEO snapshot"
            href="/domainoverview/home"
            onHide={() => setHidden((c) => [...c, "seo"])}
            actions={
              <>
                <Menu label="Scope" value={scope} options={SCOPES} onChange={setScope} />
                <Menu label="Device" value={device} options={DEVICES} onChange={setDevice} />
                <Menu label="Range" value={range} options={RANGES} onChange={setRange} />
              </>
            }
          >
            <div className="flex studio-scroll gap-3 overflow-x-auto pb-1">
              {seoKpis.map((row) => (
                <div key={row[0]} className="min-w-[140px] flex-1 rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent px-4 py-5">
                  <p className="text-[11px] text-white/40">{row[0]}</p>
                  <p className="mt-3 font-sans text-3xl font-semibold">{row[1]}</p>
                </div>
              ))}
            </div>
          </Band>
        ) : null}

        {visible.includes("positions") ? (
          <Band id="positions" eyebrow="03 · Ranks" title="Position tracking reel" href="/site/positions" onHide={() => setHidden((c) => [...c, "positions"])}>
            <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
              <MiniTrend points={visibilityTrend} labels={["Visibility"]} />
              <div className="grid grid-cols-2 gap-2">
                {buckets.map((row) => (
                  <div key={row[0]} className="rounded-[1.25rem] border border-white/10 px-4 py-4">
                    <p className="text-xs text-white/40">{row[0]}</p>
                    <p className="mt-2 text-2xl font-semibold">{row[1]}</p>
                  </div>
                ))}
              </div>
            </div>
            <ul className="mt-5 space-y-2">
              {topKeywords.map((row) => (
                <li key={row[0]} className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3 text-sm">
                  <span>{row[0]}</span>
                  <span className="text-white/50">
                    #{row[1]} <span className={String(row[2]).startsWith("+") ? "text-emerald-300" : String(row[2]).startsWith("-") ? "text-blush" : ""}>{row[2]}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Band>
        ) : null}

        {visible.includes("audit") ? (
          <Band id="audit" eyebrow="04 · Health" title="Site audit scoreboard" href="/site/audit" onHide={() => setHidden((c) => [...c, "audit"])}>
            <div className="flex flex-wrap items-center gap-8">
              <HealthRing value={health} label="Site health" />
              <div className="grid flex-1 grid-cols-2 gap-3 sm:max-w-md">
                {auditCounts.slice(0, 2).map((row) => (
                  <div key={row[0]} className="rounded-[1.5rem] border border-white/10 px-5 py-5">
                    <p className={`text-xs ${row[0] === "Errors" ? "text-blush" : "text-amber-200"}`}>{row[0]}</p>
                    <p className="mt-2 font-sans text-4xl font-semibold">{row[1]}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 max-w-lg">
              <div className="flex justify-between text-sm text-white/55">
                <span>Crawl coverage</span>
                <span>
                  {crawled[0]?.[1]} / {crawled[1]?.[1]}
                </span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                <div className="bar-grow h-full rounded-full bg-gradient-to-r from-blush to-brand" style={{ width: `${Math.min(100, (Number(crawled[0]?.[1]) / Math.max(1, Number(crawled[1]?.[1]))) * 100)}%` }} />
              </div>
            </div>
          </Band>
        ) : null}

        <div className="my-2 rounded-[1.75rem] border border-brand/25 bg-gradient-to-r from-blush/20 via-transparent to-brand/25 px-6 py-6">
          <p className="font-sans text-2xl font-semibold">Ranks are covered — extend into AI answers</p>
          <p className="mt-2 max-w-xl text-sm text-white/65">Prompts for this project are already stored. Answers wait for a provider.</p>
          <Link href="/visibility/overview" className="mt-4 inline-flex h-11 items-center rounded-2xl bg-white px-5 text-sm font-semibold text-ink">
            Jump to AI Visibility
          </Link>
        </div>

        {visible.includes("setup") ? (
          <Band id="setup" eyebrow="05 · Tooling" title="Spin up the next SEO job" onHide={() => setHidden((c) => [...c, "setup"])}>
            <div className="grid gap-3 sm:grid-cols-2">
              {SETUP.map(([title, body, href], index) => (
                <Link key={title} href={href} className="group rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 hover:border-brand/40">
                  <p className="text-[11px] text-brand">0{index + 1}</p>
                  <p className="mt-2 font-sans text-lg font-semibold">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/55">{body}</p>
                  <p className="mt-4 text-xs text-white/40 group-hover:text-brand">Launch →</p>
                </Link>
              ))}
            </div>
          </Band>
        ) : null}

        {visible.includes("traffic") ? (
          <Band
            id="traffic"
            eyebrow="06 · Traffic"
            title="Traffic analytics lane"
            href="/market/traffic-analytics"
            onHide={() => setHidden((c) => [...c, "traffic"])}
            actions={
              <div className="flex rounded-2xl border border-white/10 p-1">
                {TRAFFIC_TABS.map((tab) => (
                  <button key={tab} type="button" onClick={() => setTrafficTab(tab)} className={`rounded-xl px-3 py-1.5 text-xs ${trafficTab === tab ? "bg-brand/30 text-white" : "text-white/45"}`}>
                    {tab}
                  </button>
                ))}
              </div>
            }
          >
            {trafficTab === "Google data" ? (
              <Suspense fallback={<p className="text-sm text-white/45">Loading Google…</p>}>
                <GoogleConnectPanel compact />
              </Suspense>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap gap-2">
                  {trafficKpis.map((row) => (
                    <div key={row[0]} className="rounded-2xl border border-white/10 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.1em] text-white/35">{row[0]}</p>
                      <p className="mt-1 font-semibold">{row[1]}</p>
                    </div>
                  ))}
                </div>
                <MiniTrend points={trafficTrend} labels={["Visits", "Uniques"]} />
                <div className="mt-4 flex flex-wrap gap-2">
                  {CHANNELS.map(([name]) => (
                    <label key={name} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-1.5 text-xs">
                      <input type="checkbox" checked={!!channels[name]} onChange={() => setChannels((c) => ({ ...c, [name]: !c[name] }))} className="accent-[#926BFF]" />
                      {name}
                    </label>
                  ))}
                </div>
              </>
            )}
          </Band>
        ) : null}

        {visible.includes("lists") ? (
          <Band id="lists" eyebrow="07 · Lists" title="Organic ranks & backlinks" onHide={() => setHidden((c) => [...c, "lists"])}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans text-lg font-semibold">Organic rankings</h3>
                  <Link href="/SEOranking" className="text-xs text-brand">
                    Open
                  </Link>
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {organicRows.map((row) => (
                    <li key={row[0]} className="flex justify-between border-b border-white/5 pb-2">
                      <span>{row[0]}</span>
                      <span className="text-white/50">#{row[1]}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans text-lg font-semibold">Backlinks</h3>
                  <Link href="/links/backlinks" className="text-xs text-brand">
                    Open
                  </Link>
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {backlinkRows.map((row) => (
                    <li key={`${row[0]}-${row[1]}`} className="flex justify-between gap-3 border-b border-white/5 pb-2">
                      <span className="truncate">{row[0]}</span>
                      <span className="shrink-0 text-white/50">{row[3] || row[2]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Band>
        ) : null}

        {visible.includes("google") ? (
          <Band id="google" eyebrow="08 · Connect" title="Google services" onHide={() => setHidden((c) => [...c, "google"])}>
            <Suspense fallback={<p className="text-sm text-white/45">Loading Google…</p>}>
              <GoogleConnectPanel />
            </Suspense>
          </Band>
        ) : null}

        <div className="pt-6">
          <p className="text-xs uppercase tracking-[0.14em] text-white/35">Tucked bands</p>
          {!hidden.length ? <p className="mt-2 text-sm text-white/45">Nothing tucked. Use “Tuck away” on a band to park it here.</p> : null}
          {hidden.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {hidden.map((id) => (
                <li key={id}>
                  <button type="button" onClick={() => setHidden((c) => c.filter((x) => x !== id))} className="rounded-2xl border border-white/10 px-3 py-1.5 text-xs capitalize hover:bg-brand/15">
                    Restore {id}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
