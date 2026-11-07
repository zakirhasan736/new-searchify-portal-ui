"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  errorText,
  featurePayload,
  getGoogleStatus,
  loadFeature,
  proposeFromGsc,
  recheckAiReadiness,
  researchAudit,
  researchBacklinks,
  researchKeywords,
  runPageSpeed,
  runSiteScan,
  syncGoogle,
  syncPlaces,
} from "@/lib/v1Api";

/*
 * The SearchLites scan, step by step. Every step is a real call (site read, robots.txt, sitemap, the AI read,
 * Search Console, Analytics, DataForSEO keywords / backlinks / audit, PageSpeed, Places, AI crawler access,
 * listing drafts) and shows what it found. Steps hold on screen for a moment so the owner can follow the read;
 * slow services start early and run side by side, so the hold never adds to a slow call.
 */

const STEPS = [
  { id: "pages", label: "Reading your pages", group: "Website" },
  { id: "robots", label: "robots.txt", group: "Website" },
  { id: "sitemap", label: "Sitemap", group: "Website" },
  { id: "redirects", label: "Redirects and HTTPS", group: "Website" },
  { id: "business", label: "Understanding the business", group: "AI read" },
  { id: "gsc", label: "Google Search Console", group: "Google" },
  { id: "ga4", label: "Google Analytics", group: "Google" },
  { id: "keywords", label: "Keywords and rankings", group: "DataForSEO" },
  { id: "backlinks", label: "Backlinks", group: "DataForSEO" },
  { id: "audit", label: "Technical site audit", group: "DataForSEO" },
  { id: "speed", label: "PageSpeed Insights", group: "Google" },
  { id: "places", label: "Google Places (local competitors)", group: "Google" },
  { id: "ai", label: "AI search readiness", group: "AI search" },
  { id: "drafts", label: "Writing title and description suggestions", group: "AI read" },
  { id: "board", label: "Building your heatmap", group: "Result" },
];

const HOLD = {
  pages: 2600, robots: 1500, sitemap: 1300, redirects: 1000, business: 2600, gsc: 1800, ga4: 1300,
  keywords: 2200, backlinks: 1600, audit: 1600, speed: 1600, places: 1300, ai: 1400, drafts: 2400, board: 1400,
};

const COLOR = { ok: "#3DDC84", warn: "#FFC53D", error: "#FF5A4E", skip: "#7D848E", running: "#4DA3FF", pending: "#3A3F47" };
const MONO = { fontFamily: "'Geist Mono', monospace" };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const safe = (promise) => Promise.resolve(promise).catch((error) => ({ ok: false, data: { detail: String(error?.message || error) } }));
const kpi = (payload, re) => {
  const row = (payload?.kpis || []).find((item) => Array.isArray(item) && re.test(String(item[0] || "")));
  return row ? String(row[1]) : "";
};
const num = (value) => {
  const n = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && String(value ?? "").trim() !== "" ? n.toLocaleString("en-US") : "";
};
const pathOf = (url) => {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return String(url || "/");
  }
};

export default function ScanPipeline({ site, host, connection = {}, onBuild, onDone, onProgress }) {
  const [steps, setSteps] = useState(() => STEPS.map((s) => ({ ...s, state: "pending", detail: "", chips: [] })));
  const [feed, setFeed] = useState([]);
  const [now, setNow] = useState(0);
  const started = useRef(false);
  const mounted = useRef(true);
  const feedRef = useRef(null);
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // React may mount twice in development; the scan runs once and only stops updating on a real unmount.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const hold = (id, promise) => Promise.all([promise, sleep(reduced ? 250 : HOLD[id] || 1200)]).then(([value]) => value);
    const set = (id, patch) => mounted.current && setSteps((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    const say = (lines, tone = "") => mounted.current && setFeed((rows) => [...rows, ...lines.filter(Boolean).map((text) => ({ text, tone, key: `${rows.length}-${Math.random()}` }))].slice(-80));
    const run = async (id, fn) => {
      if (!mounted.current) return;
      setNow(STEPS.findIndex((s) => s.id === id));
      set(id, { state: "running" });
      try {
        const out = (await fn()) || {};
        set(id, { state: out.state || "ok", detail: out.detail || "", chips: out.chips || [] });
        say(out.lines || [], out.state);
      } catch (error) {
        set(id, { state: "warn", detail: String(error?.message || error).slice(0, 160) });
      }
    };

    (async () => {
      const home = /^https?:\/\//.test(site || "") ? site : `https://${host}`;
      say([`→ connecting to ${host}`]);
      // Ask Google's status here: the page's own status may not have loaded when a scan starts.
      const status = await safe(getGoogleStatus({ force: true }));
      const g = status.data?.connection || {};
      const link = {
        gsc: Boolean(connection.gsc || g.gsc?.status === "connected" || (g.connected && g.gscSiteUrl)),
        ga: Boolean(connection.ga || g.ga4?.status === "connected" || (g.connected && g.ga4PropertyId)),
      };
      // Google sync starts at once; it does not depend on the page read.
      const googleSync = link.gsc || link.ga ? safe(syncGoogle()) : Promise.resolve(null);
      const speed = safe(runPageSpeed(home));
      const ai = safe(recheckAiReadiness());

      let scan = {};
      await run("pages", async () => {
        say([`GET ${home}/`, "GET /sitemap_index.xml", "GET /robots.txt"]);
        const res = await hold("pages", safe(runSiteScan({ site, force: true })));
        scan = res.data?.scan || (res.ok ? res.data : {}) || {};
        if (!res.ok || !scan.pagesRead) {
          return { state: "error", detail: errorText(res, scan.error || "The website could not be read.") };
        }
        const paths = (scan.listings || []).map((row) => row.path || pathOf(row.url));
        return {
          detail: `${scan.pagesRead} page${scan.pagesRead === 1 ? "" : "s"} read${scan.siteRead?.readAsBrowser ? " (as a browser: a firewall blocked SearchifyBot)" : ""}`,
          state: scan.siteRead?.readAsBrowser ? "warn" : "ok",
          lines: paths.slice(0, 12).map((p) => `  ✓ ${p}`),
        };
      });
      // These need the business read, so they start once the pages are in.
      const keywords = safe(researchKeywords({ site: home }));
      const backlinks = safe(researchBacklinks({ site: home }));
      const audit = safe(researchAudit({ site: home }));
      const read = scan.siteRead || {};

      await run("robots", async () => {
        await hold("robots", null);
        const r = read.robots || {};
        if (r.status == null) return { state: "warn", detail: "robots.txt could not be read." };
        if (r.status >= 400) return { state: r.status >= 500 ? "error" : "warn", detail: `robots.txt returns HTTP ${r.status}.`, lines: r.problems };
        return {
          state: r.problems?.length ? "warn" : "ok",
          detail: `${r.rules || 0} rule${r.rules === 1 ? "" : "s"}${r.sitemaps?.length ? " · sitemap listed" : " · no sitemap listed"}`,
          lines: [...(r.preview || []).map((line) => `  ${line}`), ...(r.problems || []).map((p) => `  ! ${p}`)],
        };
      });
      await run("sitemap", async () => {
        await hold("sitemap", null);
        const s = read.sitemap || {};
        if (!s.url) return { state: "warn", detail: "No sitemap found. Google finds pages more slowly without one." };
        return {
          state: s.problems?.length ? "warn" : "ok",
          detail: `${num(s.urlCount) || 0} URLs in ${pathOf(s.url)}${s.index ? " (sitemap index)" : ""}`,
          lines: (s.problems || []).map((p) => `  ! ${p}`),
        };
      });
      await run("redirects", async () => {
        await hold("redirects", null);
        const p = read.redirects?.problems || [];
        return p.length ? { state: "warn", detail: p[0].slice(0, 140), lines: p.map((x) => `  ! ${x}`) } : { detail: "http and www go straight to one address" };
      });
      await run("business", async () => {
        await hold("business", null);
        if (!scan.business && !scan.category) {
          return { state: "warn", detail: "The AI read did not finish, so suggestions are built from the pages only." };
        }
        return {
          detail: scan.category ? `Category: ${scan.category}` : scan.business,
          chips: [...(scan.topics || []), ...(scan.offers || [])].filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 10),
          lines: [scan.business && `  “${scan.business}”`, scan.places?.length ? `  serves: ${scan.places.join(", ")}` : "", scan.proof?.length ? `  proof: ${scan.proof.join(" · ")}` : ""],
        };
      });
      const synced = await googleSync;
      await run("gsc", async () => {
        if (!link.gsc) return { state: "skip", detail: "Not connected. Connect Search Console for real clicks and queries." };
        await hold("gsc", null);
        if (synced && !synced.ok) return { state: "warn", detail: errorText(synced, "Search Console could not be read.") };
        const p = featurePayload(await safe(loadFeature("organic-search")));
        const clicks = num(kpi(p, /click/i));
        const impressions = num(kpi(p, /impression/i));
        if (!clicks && !impressions) return { state: "warn", detail: "Connected, but no search data for this property yet." };
        return { detail: `${clicks || 0} clicks · ${impressions || 0} impressions (28 days)`, lines: [`  avg position ${kpi(p, /position/i) || "—"} · CTR ${kpi(p, /ctr/i) || "—"}`] };
      });
      await run("ga4", async () => {
        if (!link.ga) return { state: "skip", detail: "Not connected. Connect Analytics to see visits from Google." };
        await hold("ga4", null);
        const p = featurePayload(await safe(loadFeature("traffic-analytics")));
        const sessions = num(kpi(p, /session/i));
        return sessions ? { detail: `${sessions} sessions (28 days)`, lines: [`  users ${num(kpi(p, /user/i)) || "—"} · views ${num(kpi(p, /view/i)) || "—"}`] } : { state: "warn", detail: "Connected, but no visits recorded yet." };
      });
      await run("keywords", async () => {
        const res = await hold("keywords", keywords);
        if (!res.ok) return { state: "warn", detail: errorText(res, "Keyword research is unavailable.") };
        const d = res.data || {};
        const ideas = d.ideas || [];
        return {
          detail: `${(d.ranked || []).length} searches you rank for · ${ideas.length} new ideas${d.location ? ` (${d.location})` : ""}`,
          lines: ideas.slice(0, 5).map((row) => `  + ${row.keyword}${row.volume != null ? ` · ${num(row.volume)}/mo` : ""}`),
        };
      });
      await run("backlinks", async () => {
        const res = await hold("backlinks", backlinks);
        if (!res.ok) return { state: "warn", detail: errorText(res, "Backlink data is unavailable.") };
        const s = res.data?.summary || {};
        if (s.referringDomains == null) return { state: "warn", detail: "No backlink data for this domain yet." };
        return { detail: `${num(s.referringDomains)} websites link to you · ${num(s.backlinks)} links` };
      });
      await run("audit", async () => {
        const res = await hold("audit", audit);
        if (!res.ok) return { state: "warn", detail: errorText(res, "The technical audit is unavailable.") };
        const d = res.data || {};
        const r = d.report || {};
        if (d.state && d.state !== "ready") return { detail: "Crawl started. Full results land on Site audit in a few minutes." };
        return { detail: `Score ${r.score ?? "—"} · ${(r.issues || []).length} issue types on ${r.pagesCrawled ?? "?"} pages` };
      });
      await run("speed", async () => {
        const res = await hold("speed", speed);
        if (!res.ok) return { state: "warn", detail: errorText(res, "PageSpeed could not test the home page.") };
        const r = res.data?.result || {};
        const perf = r.scoreNums?.performance;
        return {
          state: perf != null && perf < 50 ? "warn" : "ok",
          detail: `Mobile performance ${perf ?? "—"} · SEO ${r.scoreNums?.seo ?? "—"}`,
          lines: Object.entries(r.vitals || {}).filter(([, v]) => v && v !== "—").slice(0, 4).map(([k, v]) => `  ${k} ${v}`),
        };
      });
      await run("places", async () => {
        const where = (scan.places || [])[0] || "";
        const what = scan.category || (scan.offers || [])[0] || "";
        if (!what || !where) return { state: "skip", detail: "Needs the business type and city from the site read." };
        const res = await hold("places", safe(syncPlaces(`${what} ${where}`)));
        if (!res.ok) return { state: "skip", detail: res.status === 503 ? "Google Places is not set up on this workspace." : errorText(res, "Google Places did not answer.") };
        const rows = res.data?.rows || [];
        return { detail: `${rows.length} local businesses found for “${what} ${where}”`, lines: rows.slice(0, 4).map((row) => `  · ${Array.isArray(row) ? row[0] : row?.name || ""}`) };
      });
      await run("ai", async () => {
        const res = await hold("ai", ai);
        if (!res.ok) return { state: "warn", detail: errorText(res, "AI crawler access could not be checked.") };
        const crawlers = res.data?.readiness?.crawlers || [];
        const blocked = crawlers.filter((c) => !c.allowed);
        return {
          state: blocked.length ? "warn" : "ok",
          detail: crawlers.length ? `${crawlers.length - blocked.length} of ${crawlers.length} AI crawlers can read the site` : "Checked",
          lines: blocked.slice(0, 4).map((c) => `  ! ${c.agent} (${c.company}) blocked`),
        };
      });
      await run("drafts", async () => {
        const res = await hold("drafts", safe(proposeFromGsc({ limit: 3 })));
        if (!res.ok) return { state: "warn", detail: errorText(res, "Suggestions could not be written right now.") };
        const n = res.data?.created || 0;
        return { detail: n ? `${n} new title and description suggestion${n === 1 ? "" : "s"} ready to review` : "Your pages already have suggestions waiting" };
      });
      await run("board", async () => {
        const bundle = await hold("board", safe(onBuild?.()));
        const count = ["red", "yellow", "green", "blue"].reduce((sum, key) => sum + (bundle?.[key]?.length || 0), 0);
        return { detail: `${count} tasks on the board` };
      });
      if (mounted.current) {
        setNow(STEPS.length);
        await sleep(reduced ? 0 : 700);
        onDone?.();
      }
    })();
    // The scan runs once per mount; a replay remounts this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [feed]);

  // Keep the step being read in view as the list grows past the screen.
  useEffect(() => {
    const el = typeof document !== "undefined" ? document.querySelector(`[data-scan-step="${STEPS[now]?.id}"]`) : null;
    el?.scrollIntoView?.({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  }, [now, reduced]);

  const finished = steps.filter((s) => !["pending", "running"].includes(s.state)).length;
  const pct = Math.min(100, Math.round((finished / STEPS.length) * 100));
  const current = steps[now];

  useEffect(() => {
    onProgress?.(pct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 18, flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: "1 1 320px", minWidth: 0 }}>
          <span style={{ ...MONO, fontSize: 13, color: "#4DA3FF", letterSpacing: ".5px", textTransform: "uppercase", animation: reduced ? "none" : "sfy-breathe 1.2s ease-in-out infinite" }}>
            {pct >= 100 ? `Done · ${host}` : `Reading ${host}`}
          </span>
          <span aria-live="polite" style={{ fontSize: 17, color: "#D7DADE", minHeight: 24 }}>
            {current && current.state === "running" ? `${current.label}…` : pct >= 100 ? "Everything is read. Opening your board." : ""}
          </span>
        </div>
        <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(56px, 7vw, 96px)", lineHeight: 0.9, letterSpacing: "-3px", fontWeight: 800 }}>{pct}%</span>
      </div>
      <div role="progressbar" aria-label="Scan progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} style={{ height: 10, borderRadius: 999, background: "#1A1D22", overflow: "hidden" }}>
        <div style={{ height: 10, borderRadius: 999, background: "linear-gradient(90deg, #4DA3FF, #3DDC84)", boxShadow: "0 0 22px rgba(77,163,255,.6)", width: `${Math.max(pct, 3)}%`, transition: "width .6s ease" }} />
      </div>

      <section aria-label="Live read" style={{ width: "100%", boxSizing: "border-box", borderRadius: 16, background: "#0D0F12", border: "1px solid #1A1D22", display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid #1A1D22" }}>
            <span aria-hidden style={{ width: 8, height: 8, borderRadius: 4, background: pct >= 100 ? COLOR.ok : COLOR.running, animation: pct >= 100 || reduced ? "none" : "sfy-breathe 1s ease-in-out infinite" }} />
            <span style={{ ...MONO, fontSize: 12, color: "#9AA1AB" }}>live read · {host}</span>
          </div>
          <div ref={feedRef} style={{ ...MONO, fontSize: 12.5, lineHeight: 1.7, color: "#9AA1AB", padding: "12px 14px", overflowY: "auto", flex: 1, minHeight: 150, maxHeight: 180 }}>
            {feed.map((row) => (
              <div key={row.key} style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: row.text.trim().startsWith("!") ? COLOR.warn : row.text.trim().startsWith("✓") || row.text.trim().startsWith("+") ? "#BFE9CF" : "#9AA1AB", animation: reduced ? "none" : "sfy-rise .25s ease both" }}>
                {row.text}
              </div>
            ))}
            {pct < 100 ? <span aria-hidden style={{ display: "inline-block", width: 8, height: 14, background: "#4DA3FF", verticalAlign: "middle", animation: reduced ? "none" : "sfy-breathe .9s steps(2) infinite" }} /> : null}
          </div>
      </section>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "stretch" }}>
        <ol aria-label="Scan steps" style={{ listStyle: "none", margin: 0, padding: 0, flex: "1 1 340px", minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          {steps.map((step, index) => {
            const active = step.state === "running";
            const color = COLOR[step.state];
            const newGroup = index === 0 || STEPS[index - 1].group !== step.group;
            return (
              <li key={step.id} data-scan-step={step.id} style={{ display: "flex", flexDirection: "column", scrollMarginBottom: 24 }}>
                {newGroup ? <span style={{ ...MONO, fontSize: 11, color: "#7D848E", letterSpacing: ".6px", textTransform: "uppercase", margin: index ? "10px 0 4px" : "0 0 4px" }}>{step.group}</span> : null}
                <div
                  style={{
                    display: "flex", gap: 12, alignItems: "flex-start", padding: "9px 12px", borderRadius: 12,
                    background: active ? "rgba(77,163,255,.08)" : "transparent",
                    border: `1px solid ${active ? "rgba(77,163,255,.35)" : "transparent"}`,
                    opacity: step.state === "pending" ? 0.45 : 1, transition: "opacity .4s ease, background .3s ease",
                    animation: step.state !== "pending" && !reduced ? "sfy-rise .35s ease both" : "none",
                  }}
                >
                  <span aria-hidden style={{ position: "relative", width: 18, height: 18, flex: "none", marginTop: 2, display: "grid", placeItems: "center" }}>
                    {active ? (
                      <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(77,163,255,.25)", borderTopColor: "#4DA3FF", animation: reduced ? "none" : "sfy-spin .8s linear infinite" }} />
                    ) : step.state === "ok" ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                    ) : step.state === "pending" ? (
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
                    ) : step.state === "skip" ? (
                      <span style={{ width: 10, height: 2, borderRadius: 1, background: color }} />
                    ) : (
                      <span style={{ ...MONO, fontSize: 14, fontWeight: 700, color }}>!</span>
                    )}
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: "1 1 0" }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: "#F2F4F5" }}>
                      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                        {{ ok: "Done: ", warn: "Needs attention: ", error: "Failed: ", skip: "Skipped: ", running: "In progress: ", pending: "Waiting: " }[step.state]}
                      </span>
                      {step.label}
                    </span>
                    {step.detail ? <span style={{ fontSize: 13, lineHeight: 1.45, color: step.state === "ok" ? "#9AA1AB" : color === COLOR.skip ? "#7D848E" : "#D7DADE", overflowWrap: "anywhere" }}>{step.detail}</span> : null}
                    {step.chips?.length ? (
                      <span style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                        {step.chips.map((chip, i) => (
                          <span key={chip} style={{ fontSize: 12, padding: "3px 9px", borderRadius: 999, border: "1px solid rgba(77,163,255,.35)", color: "#BFDDFF", animation: reduced ? "none" : `sfy-rise .3s ${i * 0.12}s ease both` }}>{chip}</span>
                        ))}
                      </span>
                    ) : null}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

      </div>
    </div>
  );
}
