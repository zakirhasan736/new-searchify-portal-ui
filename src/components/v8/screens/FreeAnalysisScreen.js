"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { previewSiteScan, runSiteScan } from "@/lib/v1Api";
import { hydrateJourney, normalizeSiteUrl, resolveSiteContinue, stashPendingSite } from "@/lib/journey";
import { userIsAuthenticated } from "@/utils/users/Helpers";
import "@/styles/v8-free-analysis.css";

const TONE = {
  red: ["#FF5A4E", "rgba(255,90,78,.6)"],
  yellow: ["#FFC53D", "rgba(255,197,61,.35)"],
  green: ["#3DDC84", "rgba(61,220,132,.25)"],
};

function Mark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" role="img" aria-label="Searchify">
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="#131519" stroke="#2E333B" />
      <circle cx="9" cy="12.5" r="2.9" fill="#FF5A4E" />
      <circle cx="16" cy="12.5" r="2.9" fill="#FF9F43" />
      <circle cx="23" cy="12.5" r="2.9" fill="#FFC53D" />
      <circle cx="9" cy="19.5" r="2.9" fill="#3DDC84" />
      <circle cx="16" cy="19.5" r="2.9" fill="#2CC7C0" />
      <circle cx="23" cy="19.5" r="2.9" fill="#4DA3FF" />
    </svg>
  );
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

function Lock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0" />
    </svg>
  );
}

function hostOf(raw) {
  try {
    return new URL(normalizeSiteUrl(raw) || "https://example.com").hostname.replace(/^www\./, "");
  } catch {
    return String(raw || "").replace(/^https?:\/\//i, "").replace(/^www\./, "") || "your site";
  }
}

function firstName(email, brand) {
  const local = String(email || "").split("@")[0] || "";
  const bit = local.split(/[._+-]/)[0];
  if (bit && bit.length >= 2) return bit.charAt(0).toUpperCase() + bit.slice(1);
  const b = String(brand || "").trim().split(/\s+/)[0];
  return b || "there";
}

function fmtVol(n) {
  if (n == null || n === "") return "—";
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString();
}

function toneColor(tone) {
  return TONE[tone]?.[0] || TONE.yellow[0];
}

const TOPIC_LABEL = {
  title: "Title",
  description: "Description",
  heading: "Heading",
  typography: "Typography",
  bem: "BEM",
  css: "CSS",
  javascript: "JavaScript",
  image: "Image",
  ssr: "SSR",
  csr: "CSR",
  lcp: "LCP",
  cls: "CLS",
  inp: "INP",
  places: "Places",
  grade: "Grade",
  speed: "Speed",
  content: "Content",
};

const TOPIC_ORDER = [
  "title",
  "description",
  "heading",
  "typography",
  "bem",
  "css",
  "javascript",
  "image",
  "lcp",
  "cls",
  "ssr",
  "csr",
  "places",
  "grade",
];

function topicLabel(topic) {
  return TOPIC_LABEL[String(topic || "").toLowerCase()] || "";
}

/**
 * FreeAnalysis.dc.html — public website analysis before sign-up.
 * Deep crawl via POST /api/v1/public/site-scan (+ Places + ranked keywords when configured).
 */
export default function FreeAnalysisScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState("start");
  const [site, setSite] = useState("");
  const [email, setEmail] = useState("");
  const [scan, setScan] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const scanReadyAt = useRef(0);
  const minScanMs = useRef(0);

  useEffect(() => {
    const q = params?.get("site") || "";
    const em = params?.get("email") || "";
    if (q) setSite(q);
    if (em) setEmail(em);
    if (q && params?.get("run") === "1") {
      runAnalysis(q, em);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const host = hostOf(scan?.home || site);
  const scanSteps = useMemo(() => {
    const pages = scan?.pagesRead || "…";
    const platform = scan?.platform || "your platform";
    return [
      { text: `Found ${pages} pages on your site`, delay: "0.2s" },
      {
        text: scan?.platform ? `Detected your platform: ${platform}` : "Checked how your pages are built",
        delay: "0.6s",
      },
      { text: "Checked titles, descriptions, links and headings", delay: "1.0s" },
      {
        text: scan?.pagespeed?.source
          ? `Ran Google PageSpeed (LCP ${scan.pagespeed?.vitals?.lcp || "—"}, CLS ${scan.pagespeed?.vitals?.cls || "—"})`
          : "Checked page speed signals when available",
        delay: "1.35s",
      },
      {
        text: scan?.rendering?.modeLabel
          ? `Checked ${scan.rendering.modeLabel} · images & server loading path`
          : "Checked SSR vs CSR delivery and image loading",
        delay: "1.55s",
      },
      {
        text: scan?.places?.length
          ? `Looked up ${scan.places.length} Google Places listings nearby`
          : "Checked Google Places for nearby listings",
        delay: "1.7s",
      },
      {
        text: scan?.onpageSource
          ? `On-page audit ${scan.onpageScore != null ? scan.onpageScore : "done"} from live search data`
          : "Checked on-page SEO when search data is connected",
        delay: "1.9s",
      },
      {
        text: scan?.business?.sentence
          ? `Understood the business${scan.category ? `: ${scan.category}` : ""}`
          : "Read the pages to understand the business",
        delay: "2.05s",
      },
      {
        text: scan?.researchSource
          ? `Matched ${scan.visibility?.searches || scan.keywords?.length || 0} live search rankings${scan.country ? ` in ${scan.country}` : ""}`
          : "Built your free Google health report",
        delay: "2.2s",
      },
    ];
  }, [scan]);

  useEffect(() => {
    if (step !== "scan") return undefined;
    setVisibleSteps(0);
    const timers = scanSteps.map((_, i) => setTimeout(() => setVisibleSteps(i + 1), 250 + i * 520));
    minScanMs.current = 250 + scanSteps.length * 520 + 400;
    return () => timers.forEach(clearTimeout);
  }, [step, scanSteps]);

  useEffect(() => {
    if (step !== "scan" || !scan) return undefined;
    const wait = Math.max(0, minScanMs.current - (Date.now() - scanReadyAt.current));
    const done = setTimeout(() => setStep("results"), wait || 200);
    return () => clearTimeout(done);
  }, [step, scan]);

  async function runAnalysis(rawSite = site, rawEmail = email) {
    const next = normalizeSiteUrl(rawSite);
    if (!next || !hostOf(next).includes(".")) {
      setError("Enter a website address, like example.com.");
      return;
    }
    setError("");
    setBusy(true);
    setStep("scan");
    setScan(null);
    scanReadyAt.current = Date.now();
    const res = await previewSiteScan(next, { email: (rawEmail || "").trim() });
    setBusy(false);
    scanReadyAt.current = Date.now();
    if (!res.ok) {
      setStep("start");
      const detail = res.data?.detail;
      setError(typeof detail === "string" ? detail : "Could not read that site. Check the address and try again.");
      return;
    }
    const payload = res.data?.scan || null;
    setScan(payload);
    if (payload?.home) stashPendingSite(payload.home);
  }

  const continueTrial = async () => {
    const home = scan?.home || normalizeSiteUrl(site);
    if (!home) return;
    stashPendingSite(home);
    if (userIsAuthenticated()) {
      await hydrateJourney({ force: true });
      const resolved = resolveSiteContinue(home);
      if (resolved.existing) {
        // Same connected domain — refresh scan data in place, skip setup.
        runSiteScan({ site: home, force: true }).catch(() => {});
      }
      router.push(resolved.path);
      return;
    }
    const q = new URLSearchParams({ next: "/app/start", site: home });
    if (email.trim()) q.set("email", email.trim());
    router.push(`/signup?${q}`);
  };

  const red = scan?.counts?.red || 0;
  const yellow = scan?.counts?.yellow || 0;
  const green = scan?.counts?.green || 0;
  const pages = scan?.pagesRead || 0;
  const grade = scan?.grade || "C+";
  const gradeColor = scan?.gradeColor || "#FFC53D";
  const gradeNote = scan?.gradeNote || "fair, with quick wins";
  const name = firstName(email || scan?.reportEmail, scan?.brand);
  const findings = scan?.findings || [];
  const problems = scan?.problems?.length ? scan.problems : findings.slice(0, 3);
  const places = scan?.places || [];
  const keywords = scan?.keywords || [];
  const gaps = scan?.gaps || [];
  const competitors = scan?.competitors || [];
  const visibility = scan?.visibility || {};
  const pagespeed = scan?.pagespeed || null;
  const rendering = scan?.rendering || null;
  const category = scan?.category || "";
  const city = scan?.city || "";
  const placesQuery = scan?.placesQuery || (category ? `${category}${city ? ` in ${city}` : ""}` : "");
  const topicStatus = useMemo(() => {
    const fromApi = Array.isArray(scan?.topicStatus) ? scan.topicStatus : [];
    if (fromApi.length) {
      const map = new Map(fromApi.map((row) => [String(row.topic || "").toLowerCase(), row]));
      return TOPIC_ORDER.map((key) => {
        if (map.has(key)) return map.get(key);
        return { topic: key, status: "ok", color: "green", label: "Looking fine", detail: "" };
      });
    }
    const pool = [...(findings || []), ...((rendering?.issues) || []), ...((scan?.markup?.issues) || [])];
    return TOPIC_ORDER.map((key) => {
      if (key === "places") {
        if (places.length) {
          return {
            topic: "places",
            status: "ok",
            color: "green",
            label: `${places.length} Google Places rivals nearby`,
            detail: placesQuery || category,
          };
        }
        return {
          topic: "places",
          status: "warning",
          color: "yellow",
          label: "No Google Places rivals found yet",
          detail: "",
        };
      }
      const hit = pool.find((row) => String(row.topic || "").toLowerCase() === key);
      if (!hit) return { topic: key, status: "ok", color: "green", label: "Looking fine", detail: "" };
      return {
        topic: key,
        status: hit.color === "red" ? "error" : "warning",
        color: hit.color || "yellow",
        label: hit.label,
        detail: hit.detail || "",
      };
    });
  }, [scan, findings, rendering, places, placesQuery, category]);
  const majorProblems = useMemo(() => {
    const pool = [...(problems || [])];
    const ranked = [...topicStatus]
      .filter((t) => t.status === "error" || t.status === "warning")
      .sort((a, b) => (a.status === "error" ? 0 : 1) - (b.status === "error" ? 0 : 1));
    ranked.forEach((t) => {
      if (pool.length >= 3) return;
      if (pool.some((p) => p.label === t.label)) return;
      pool.push({
        color: t.color,
        path: "/",
        label: t.label,
        detail: t.detail,
        topic: t.topic,
        source: "topic",
      });
    });
    return pool.slice(0, 3);
  }, [problems, topicStatus]);
  const ssrSolutions = rendering?.solutions || [];
  const moreIssuesCount = Math.max(
    0,
    Number(scan?.moreIssues) || Math.max(0, (findings?.length || 0) + topicStatus.filter((t) => t.status !== "ok").length - majorProblems.length),
  );
  const dots = useMemo(() => {
    const list = scan?.dots || [];
    if (list.length) {
      return list.slice(0, 48).map((d) => {
        const tone = TONE[d.color] || TONE.yellow;
        const position = d.position ? ` #${d.position}` : "";
        return {
          color: tone[0],
          glow: tone[1],
          label: `${d.label || d.keyword || d.path || ""}${position}`.trim(),
        };
      });
    }
    return Array.from({ length: 24 }, () => ({ color: "#2A2E36", glow: "transparent", label: "" }));
  }, [scan]);

  const marketLabel = visibility.market || city || "your market";

  return (
    <div className="v8-fa">
      <header className="v8-fa-head">
        <Link href="/" className="v8-fa-brand">
          <Mark />
          <span>searchify</span>
        </Link>
        <span className="v8-fa-nav">
          <Link href="/pricing">Pricing</Link>
          {scan ? <span className="v8-fa-badge">LIVE SCAN</span> : <span className="v8-fa-badge">NO LOGIN</span>}
        </span>
      </header>

      {step === "start" ? (
        <section className="v8-fa-start" aria-labelledby="st-h">
          <span className="v8-fa-script">Free, in about a minute</span>
          <h1 id="st-h">See how Google sees your website.</h1>
          <span className="v8-fa-lede">
            Which searches you show up for, who&apos;s beating you, and what&apos;s holding you back. No login, no credit card.
          </span>
          <form
            className="v8-fa-form"
            onSubmit={(e) => {
              e.preventDefault();
              runAnalysis();
            }}
          >
            <label className="v8-fa-field">
              Your website
              <input
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="yourwebsite.com"
                value={site}
                onChange={(e) => setSite(e.target.value)}
              />
            </label>
            <label className="v8-fa-field">
              Where should we send your report?
              <input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {error ? (
              <p className="v8-fa-err" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="v8-fa-cta" disabled={busy}>
              {busy ? "Analyzing…" : "Analyze my website"}
            </button>
            <span className="v8-fa-note">
              We&apos;ll email you a link back to your report. One email, plus a couple of tips. Unsubscribe anytime.
            </span>
          </form>
        </section>
      ) : null}

      {step === "scan" ? (
        <section className="v8-fa-scan" aria-live="polite">
          <h1>Looking at {host}…</h1>
          <div className="v8-fa-dotgrid" aria-hidden="true">
            {Array.from({ length: 30 }, (_, i) => (
              <span key={i} className="dot" style={{ animationDelay: `${(i * 0.08).toFixed(2)}s` }} />
            ))}
          </div>
          <ol className="v8-fa-steps">
            {scanSteps.slice(0, visibleSteps).map((s) => (
              <li key={s.text} style={{ animationDelay: s.delay }}>
                <Check />
                {s.text}
              </li>
            ))}
          </ol>
          {scan ? (
            <button type="button" className="v8-fa-cta is-sm" onClick={() => setStep("results")}>
              See my results
            </button>
          ) : (
            <span style={{ fontSize: 13, color: "#9AA1AB" }}>Deep scan in progress — reading pages across your site…</span>
          )}
        </section>
      ) : null}

      {step === "results" && scan ? (
        <div className="v8-fa-results">
          <section className="v8-fa-sum" aria-labelledby="sum-h">
            <div className="v8-fa-sum-copy">
              <span className="v8-fa-pills">
                {scan.platform ? (
                  <span className="v8-fa-pill is-ok">Built on {scan.platform} · Searchify works with it today</span>
                ) : (
                  <span className="v8-fa-pill is-ok">Public pages read · No login required</span>
                )}
                <span className="v8-fa-pill is-muted">
                  {pages} {pages === 1 ? "page" : "pages"} found
                </span>
              </span>
              <h1 id="sum-h">{scan.headline || `${name}, we checked ${pages} pages on ${host}.`}</h1>
              <p>
                {scan.aboutGoogle ||
                  "Your site is readable, but titles and descriptions decide what Google shows. Fix the urgent ones first."}
              </p>
              {scan.category ? (
                <span style={{ display: "block", marginTop: 8, fontSize: 14, color: "#D7DADE", lineHeight: 1.5 }}>
                  Category we read: {scan.category}.
                </span>
              ) : null}
              {scan.topics?.length ? (
                <span style={{ display: "block", marginTop: 8, fontSize: 14, color: "#D7DADE", lineHeight: 1.5 }}>
                  Topics on the site: {scan.topics.slice(0, 8).join(", ")}.
                </span>
              ) : null}
              {scan.offers?.length ? (
                <span style={{ display: "block", marginTop: 8, fontSize: 14, color: "#D7DADE", lineHeight: 1.5 }}>
                  Offers we read on the site: {scan.offers.slice(0, 6).join(", ")}.
                </span>
              ) : null}
            </div>
            <div className="v8-fa-health">
              <span style={{ fontSize: 13, color: "#9AA1AB" }}>Your Google health</span>
              <span className="v8-fa-health-grade">
                <strong style={{ color: gradeColor }}>{grade}</strong>
                <span style={{ fontSize: 14, color: "#9AA1AB" }}>{gradeNote}</span>
              </span>
              {scan.gradeDetail ? (
                <span style={{ fontSize: 12, color: "#7D848E", lineHeight: 1.45 }}>{scan.gradeDetail}</span>
              ) : null}
              <div
                className="v8-fa-health-dots"
                aria-label={scan.healthKind === "rankings" ? "Each dot is a live Google search" : "Each dot is a page we read"}
              >
                {dots.map((d, i) => (
                  <span key={`${d.label}-${i}`} title={d.label || undefined} style={{ background: d.color, boxShadow: `0 0 8px ${d.glow}` }} />
                ))}
              </div>
              <span className="v8-fa-legend">
                {scan.healthKind === "rankings" ? (
                  <>
                    <i style={{ "--dot": "#FF5A4E" }}>{red} buried</i>
                    <i style={{ "--dot": "#FFC53D" }}>{yellow} page 2</i>
                    <i style={{ "--dot": "#3DDC84" }}>{green} page one</i>
                  </>
                ) : (
                  <>
                    <i style={{ "--dot": "#FF5A4E" }}>{red} urgent</i>
                    <i style={{ "--dot": "#FFC53D" }}>{yellow} need work</i>
                    <i style={{ "--dot": "#3DDC84" }}>{green} healthy</i>
                  </>
                )}
              </span>
            </div>
          </section>

          <section className="v8-fa-kpis" aria-label="Visibility">
            {[
              {
                label: "Searches you show up for",
                value: String(visibility.searches || 0),
                sub: visibility.searches ? `in ${marketLabel}, any position` : "in your market, any position",
                color: "#F2F4F5",
              },
              {
                label: "On page one",
                value: String(visibility.pageOne || 0),
                sub: "where nearly all the clicks happen",
                color: "#FFC53D",
              },
              {
                label: "Near misses",
                value: String(visibility.nearMisses || 0),
                sub: "on page 2, closest to a quick win",
                color: "#FFC53D",
              },
              {
                label: "Estimated visits from Google",
                value: visibility.visits ? `~${fmtVol(visibility.visits)}` : "0",
                sub: "a month",
                color: "#F2F4F5",
              },
            ].map((k) => (
              <div key={k.label} className="v8-fa-kpi">
                <span style={{ fontSize: 13, color: "#9AA1AB" }}>{k.label}</span>
                <strong style={{ color: k.color }}>{k.value}</strong>
                <span style={{ fontSize: 12, color: "#7D848E" }}>{k.sub}</span>
              </div>
            ))}
          </section>

          <section className="v8-fa-panel" aria-labelledby="topics-h">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <h2 id="topics-h" style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                Major issues we checked
              </h2>
              <span style={{ fontSize: 13, color: "#9AA1AB" }}>
                Grade {grade}
                {pagespeed?.performance && pagespeed.performance !== "—" ? ` · Mobile speed ${pagespeed.performance}` : ""}
                {pagespeed?.desktop?.performance && pagespeed.desktop.performance !== "—" ? ` · Desktop ${pagespeed.desktop.performance}` : ""}
                {pagespeed?.seo && pagespeed.seo !== "—" ? ` · SEO ${pagespeed.seo}` : ""}
                {scan?.onpageScore != null ? ` · On-page ${scan.onpageScore}` : ""}
                {pagespeed?.vitals?.lcp ? ` · LCP ${pagespeed.vitals.lcp}` : ""}
                {pagespeed?.vitals?.cls ? ` · CLS ${pagespeed.vitals.cls}` : ""}
                {rendering?.modeLabel ? ` · ${rendering.modeLabel}` : ""}
              </span>
            </div>
            <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.45 }}>
              Title, description, typography/headings, BEM, CSS, JavaScript, images, LCP, CLS, SSR, CSR, and Google Places —
              live from your crawl{pagespeed?.source ? " and PageSpeed" : ""}.
            </span>
            <div className="v8-fa-topics">
              {topicStatus.map((row) => (
                <div key={row.topic} className={`v8-fa-topic is-${row.status || "ok"}`}>
                  <span className="v8-fa-topic-tag" style={{ color: toneColor(row.color) }}>
                    {topicLabel(row.topic) || row.topic}
                  </span>
                  <strong>{row.label}</strong>
                  <span className="v8-fa-topic-state">
                    {row.status === "error" ? "error" : row.status === "warning" ? "warning" : "ok"}
                  </span>
                  {row.detail ? <span className="v8-fa-topic-detail">{row.detail}</span> : null}
                </div>
              ))}
            </div>
            {ssrSolutions.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 13, color: "#9AA1AB" }}>SSR fixes for images &amp; loading speed:</span>
                {ssrSolutions.slice(0, 4).map((row) => (
                  <div key={row.label} className="v8-fa-gap-row" style={{ alignItems: "flex-start" }}>
                    <span>
                      <strong style={{ fontWeight: 600 }}>
                        {topicLabel(row.topic) ? `${topicLabel(row.topic)} · ` : ""}
                        {row.label}
                      </strong>
                      {row.detail ? (
                        <span style={{ display: "block", fontSize: 13, color: "#9AA1AB", marginTop: 3, lineHeight: 1.45 }}>
                          {row.detail}
                        </span>
                      ) : null}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <div className="v8-fa-row2">
            <section className="v8-fa-panel v8-fa-kw" aria-labelledby="kw-h">
              <h2 id="kw-h">Searches you already show up for</h2>
              <span style={{ fontSize: 13, color: "#9AA1AB" }}>
                Your best ones. Anything on page 2 is a near miss: close enough that a fix can move it.
              </span>
              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: 560 }}>
                  {keywords.length ? (
                    <>
                      <div className="v8-fa-table-head" aria-hidden="true">
                        <span>SEARCH</span>
                        <span style={{ textAlign: "right" }}>SEARCHES / MO</span>
                        <span style={{ textAlign: "right" }}>YOU&apos;RE AT</span>
                        <span>STATUS</span>
                      </div>
                      {keywords.map((row) => (
                        <div key={row.keyword} className="v8-fa-table-row">
                          <span>{row.keyword}</span>
                          <span style={{ textAlign: "right", fontFamily: "var(--mono)", color: "#9AA1AB" }}>
                            {fmtVol(row.volume)}
                          </span>
                          <span style={{ textAlign: "right", fontFamily: "var(--mono)", fontWeight: 600 }}>
                            {row.position ? `#${row.position}` : "—"}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: toneColor(row.tone) }}>{row.status}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p style={{ margin: 0, padding: "12px 0", fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>
                      No public rankings yet for this site. Connect Google Search Console in Solo to fill this table with
                      your live searches, volumes, and positions.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="v8-fa-panel v8-fa-rivals" aria-labelledby="cp-h">
              <h2 id="cp-h">Who&apos;s getting your customers</h2>
              <span style={{ fontSize: 13, color: "#9AA1AB" }}>
                {scan.rivalSource === "search" && placesQuery
                  ? `Sites Google ranks in ${scan.country || marketLabel} for “${placesQuery}”, the search this site is actually in.`
                  : placesQuery && scan.rivalSource === "places"
                    ? `Google Places for “${placesQuery}” in ${scan.city || city || "that city"}.`
                    : "Rivals from the same searches and category. None came back for this scan."}
              </span>
              {competitors.length === 0 && places.length === 0 ? (
                <p style={{ margin: 0, fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>
                  No Places rivals yet for this category. Solo still unlocks Search Console clicks and the exact searches
                  you lose.
                </p>
              ) : (
                (competitors.length
                  ? competitors
                  : places.slice(0, 4).map((p, i) => ({
                      label: p.name,
                      name: p.name,
                      pct: Math.max(12, 100 - i * 18),
                      you: false,
                      signal: `${p.rating}★ · ${p.reviews} reviews`,
                      address: p.address,
                    }))
                ).map((row, i) => (
                  <div key={`${row.label || row.name}-${i}`} className="v8-fa-rival">
                    <span className="v8-fa-rival-top">
                      <span style={{ fontWeight: row.you ? 700 : 400 }}>{row.label || row.name}</span>
                      <span style={{ fontFamily: "var(--mono)" }}>{row.signal}</span>
                    </span>
                    <div className="v8-fa-bar">
                      <i style={{ width: `${row.pct || 12}%`, background: row.you ? "#D5F879" : "#4A5160" }} />
                    </div>
                    {row.address ? <span style={{ fontSize: 12, color: "#7D848E" }}>{row.address}</span> : null}
                  </div>
                ))
              )}
            </section>
          </div>

          <div className="v8-fa-row2">
            <section className="v8-fa-panel" style={{ flex: "1 1 380px" }} aria-labelledby="gap-h">
              <h2 id="gap-h">Searches your competitors win and you don&apos;t</h2>
              <span style={{ fontSize: 13, color: "#9AA1AB" }}>
                {gaps.some((g) => g.volume != null)
                  ? "People are looking for these every month. You&apos;re not showing up in the top 100 yet."
                  : `Phrases pulled from your ${category || "site"} pages${city ? ` and ${city}` : ""}. Exact monthly volume unlocks with Solo.`}
              </span>
              {gaps.length ? (
                gaps.map((g) => (
                  <div key={g.keyword} className="v8-fa-gap-row">
                    <span>{g.keyword}</span>
                    <span style={{ fontFamily: "var(--mono)", color: "#9AA1AB" }}>
                      {g.volume != null ? `${fmtVol(g.volume)} / mo` : g.note || "volume after Solo"}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ margin: 0, fontSize: 14, color: "#9AA1AB" }}>
                  Connect Google to list the exact searches rivals win that you miss.
                </p>
              )}
            </section>
            <section className="v8-fa-panel is-blue" style={{ flex: "1 1 380px" }} aria-labelledby="ai-h">
              <h2 id="ai-h">What your website tells Google about you</h2>
              <span style={{ fontSize: 13, color: "#9AA1AB" }}>We read your pages the way Google does. Here&apos;s the gist:</span>
              <span className="v8-fa-about">{scan.aboutGoogle}</span>
              <span style={{ fontSize: 13, color: "#D7DADE", lineHeight: 1.5 }}>
                {city
                  ? `That’s why Google may be unsure whether to send ${city} searches your way. Fixing titles and local phrases is usually one of the quickest wins.`
                  : "That’s why Google may be unsure where to send you. Fixing titles and descriptions is usually one of the quickest wins."}
              </span>
            </section>
          </div>

          <section className="v8-fa-panel" aria-labelledby="fx-h">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <h2 id="fx-h">The 3 biggest problems we found</h2>
              <span style={{ fontSize: 13, color: "#9AA1AB" }}>Free to see. We&apos;ll fix them for you.</span>
            </div>
            {majorProblems.map((f) => (
              <div key={`${f.path}-${f.label}-fix`} className="v8-fa-fix">
                <span
                  className="v8-fa-fix-dot"
                  style={{
                    background: toneColor(f.color),
                    boxShadow: `0 0 10px ${toneColor(f.color)}`,
                  }}
                />
                <span className="v8-fa-fix-copy">
                  <span style={{ fontSize: 15, fontWeight: 600 }}>
                    {topicLabel(f.topic) ? `${topicLabel(f.topic)} · ` : ""}
                    {f.path && f.path !== "/" && f.path !== "" ? `${f.path}: ${f.label}` : f.label}
                  </span>
                  <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.5 }}>
                    {f.detail}
                    {f.title ? ` Current title: “${f.title}”.` : ""}
                    {f.source === "pagespeed" ? " From Google PageSpeed Insights." : ""}
                  </span>
                </span>
                <button type="button" className="v8-fa-fix-btn" onClick={continueTrial}>
                  <Lock />
                  Fix this for me
                </button>
              </div>
            ))}
            {moreIssuesCount > 0 ? (
              <>
                <div className="v8-fa-blur" aria-hidden="true">
                  <span />
                  <span />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, textAlign: "center" }}>
                  + {moreIssuesCount} more issues found across your {pages} pages
                </span>
              </>
            ) : null}
          </section>

          <section className="v8-fa-final" aria-labelledby="cta-h">
            <div className="v8-fa-final-copy">
              <span className="v8-fa-script">This is only what&apos;s public.</span>
              <h2 id="cta-h">Connect Google to see the real numbers, and let us start fixing.</h2>
              <span style={{ fontSize: 15, color: "#D7DADE", lineHeight: 1.55 }}>
                Everything above is from a live deep crawl of {pages} pages
                {category ? ` as a ${category}` : ""}
                {scan.researchSource ? ", public ranking estimates" : ""}
                {places.length ? ", and Google Places rivals in your category" : ""}
                {pagespeed?.source ? ", plus Google PageSpeed (titles, headings, CSS, JavaScript, images, LCP, CLS)" : ""}
                {rendering ? ", and SSR vs CSR delivery" : ""}.
                Connect Google Search Console
                {scan.platform === "WordPress" ? " and WordPress" : ""} and you&apos;ll see your actual clicks, the exact
                searches you&apos;re losing, and every fix ready to approve one tap at a time.
              </span>
            </div>
            <div className="v8-fa-final-actions">
              <button type="button" className="v8-fa-cta" onClick={continueTrial}>
                Try Solo free for your first month
              </button>
              <span style={{ fontSize: 12, color: "#7D848E", textAlign: "center" }}>
                Card required, not charged for 30 days. Results take at least a month to show, so your free month ends with
                a before-and-after report.
              </span>
            </div>
          </section>

          {(email || scan.reportEmail) && (
            <div className="v8-fa-mail" role="status">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" />
              </svg>
              A link to this report is ready for {email || scan.reportEmail}. Bookmark this page — it stays useful for 30
              days.
            </div>
          )}
          <span style={{ fontSize: 12, color: "#7D848E", lineHeight: 1.5 }}>
            Page health comes from a live deep crawl of your HTML. Rankings, search volumes and visits are estimates from
            public search data when available and can differ from your own numbers. Platform detected from your site&apos;s
            code.
          </span>
        </div>
      ) : null}
    </div>
  );
}
