"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OverviewTour from "@/components/board/OverviewTour";
import HomepageReview from "@/components/board/HomepageReview";
import SiteDrafts from "@/components/board/SiteDrafts";
import { useConnectionStatus } from "@/components/board/ConnectDialog";
import { userIsAuthenticated } from "@/utils/users/Helpers";
import { BREADTH_LABELS, loadGuardrails, saveGuardrails } from "@/lib/guardrails";
import { useWorkspaceSite } from "@/components/board/useBusinessBrief";
import { hostnameOf, starterKeywords, starterPrompts } from "@/lib/businessBrief";
import { activeJourneySite, hydrateJourney, loadJourney, planById, requiredJourneyPath, resumeSetup } from "@/lib/journey";
import { loadFeature, researchBacklinks } from "@/lib/v1Api";
import "@/styles/results-board.css";

const NAV = [
  { href: "/app", icon: "◫", label: "Overview" },
  { href: "/app/queue", icon: "◷", label: "Needs human approval", count: true },
  { href: "/app/connections", icon: "◎", label: "Connections" },
  { href: "/app/keywords", icon: "⌕", label: "Keywords" },
  { href: "/app/visibility", icon: "✧", label: "AI visibility" },
  { href: "/app/backlinks", icon: "↔", label: "Backlinks" },
  { href: "/app/results", icon: "▤", label: "Site audit" },
  { href: "/app/workspace", icon: "▦", label: "Manage workspace" },
  { href: "/app/plans", icon: "▣", label: "Subscription" },
];

const DOCK = [
  { href: "/app", icon: "◫", label: "Results" },
  { href: "/app/queue", icon: "◷", label: "Approve" },
  { href: "/app/connections", icon: "◎", label: "Connect" },
  { href: "/app/keywords", icon: "⌕", label: "Keywords" },
  { href: "/app/workspace", icon: "▦", label: "More" },
];

export default function ResultsBoard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [plan, setPlan] = useState(null);
  const [breadth, setBreadth] = useState(() => loadGuardrails().breadth);
  const [mode, setMode] = useState(() => loadGuardrails().mode);
  const [styleNote, setStyleNote] = useState("");
  const guardrailRef = useRef(null);
  const [siteName, setSiteName] = useState("");
  const { brief, site } = useWorkspaceSite();
  const [addedKeywords, setAddedKeywords] = useState(0);
  const [status] = useConnectionStatus();
  const [live, setLive] = useState({ score: "", keywords: null, domains: null });
  const [liveLoading, setLiveLoading] = useState(true);
  useEffect(() => {
    if (!userIsAuthenticated()) {
      router.replace("/login");
      return;
    }
    let cancel = false;
    hydrateJourney().then(() => {
    if (cancel) return;
    const gate = requiredJourneyPath("/app");
    if (gate) {
      router.replace(gate);
      return;
    }
    const state = loadJourney();
    const active = activeJourneySite(state);
    setPlan(planById(state.planId));
    const countKeywords = (journeySite) => {
      try {
        const raw = JSON.parse(localStorage.getItem("sf_research_v1") || "{}");
        const bag = raw.keywordsBySite;
        const siteKey = journeySite?.id ? `journey:${journeySite.id}` : "";
        if (bag && siteKey && Array.isArray(bag[siteKey])) return bag[siteKey].length;
        return Array.isArray(raw.keywords) ? raw.keywords.length : 0;
      } catch {
        return 0;
      }
    };
    setAddedKeywords(countKeywords(active));
    setReady(true);
    });
    return () => { cancel = true; };
  }, [router]);

  const connected = [status.wordpress, status.gsc, status.ga].filter(Boolean).length;
  const breadthLabel = BREADTH_LABELS[breadth] || BREADTH_LABELS[1];
  const applyGuardrail = (next) => {
    const saved = saveGuardrails({ breadth, mode, ...next });
    setBreadth(saved.breadth);
    setMode(saved.mode);
    setStyleNote("Saved for this workspace. Every live change still requires your approval.");
  };
  const connectedHost = hostnameOf(status.wordpressUrl || status.google?.gscSiteUrl);
  const displayName = brief.hostname || connectedHost || siteName || "your website";
  const preparedKeywords = starterKeywords(brief).length + addedKeywords;
  const preparedPrompts = starterPrompts(brief).length;

  useEffect(() => {
    let cancel = false;
    setLiveLoading(true);
    const payload = (res) => res?.data?.payload || {};
    Promise.all([
      loadFeature("site-audit").catch(() => null),
      loadFeature("organic-search").catch(() => null),
      brief.siteUrl ? researchBacklinks({ site: brief.siteUrl, storedOnly: true }).catch(() => null) : Promise.resolve(null),
    ]).then(([audit, queries, links]) => {
      if (cancel) return;
      const auditPayload = payload(audit);
      const score = (auditPayload.kpis || []).find((row) => String(row[0]).toLowerCase() === "seo")?.[1]
        || auditPayload.scores?.mobile?.seo
        || "";
      const queryRows = payload(queries).rows || payload(queries).items || [];
      const linkSummary = links?.ok ? links.data?.summary || null : null;
      setLive({
        score: score && score !== "—" ? String(score) : "",
        keywords: queryRows.length ? queryRows.length : null,
        domains: linkSummary?.referringDomains ?? null,
        domainsAt: linkSummary ? links.data.fetchedAt || "" : "",
      });
    }).finally(() => {
      if (!cancel) setLiveLoading(false);
    });
    return () => { cancel = true; };
  }, [displayName, brief.siteUrl]);

  useEffect(() => {
    const node = guardrailRef.current;
    const query = window.matchMedia("(min-width: 1081px)");
    const apply = () => {
      if (node) node.open = query.matches;
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [ready]);

  useEffect(() => {
    const onSite = (event) => {
      if (event?.detail?.local) return;
      if (event.detail?.label) setSiteName(event.detail.label);
      const next = activeJourneySite();
      try {
        const raw = JSON.parse(localStorage.getItem("sf_research_v1") || "{}");
        const bag = raw.keywordsBySite;
        const siteKey = next?.id ? `journey:${next.id}` : "";
        setAddedKeywords(bag && siteKey && Array.isArray(bag[siteKey]) ? bag[siteKey].length : (Array.isArray(raw.keywords) ? raw.keywords.length : 0));
      } catch {
        setAddedKeywords(0);
      }
    };
    window.addEventListener("sf-site", onSite);
    return () => window.removeEventListener("sf-site", onSite);
  }, []);

  if (!ready) return null;

  return (
    <>
              <section className="dash-view">
                <div className="dashhead" data-tour="overview">
                  <div>
                    <div className="dash-eyebrow">SEARCHIFY WORKSPACE <span>·</span> <span>{displayName}</span></div>
                    <h1>Your next SEO moves.</h1>
                    <p>
                      {`Selected website: ${displayName}. The numbers and drafts on this page are for this website.`}
                      {brief.focus ? ` Setup: ${brief.focus}.` : ""}
                    </p>
                  </div>
                  <div className="dash-status">
                    <span className="sample-badge"><i aria-hidden="true" />{connected ? "CONNECTED" : "YOUR WEBSITE"}</span>
                    <span>Human approval required</span>
                    <button className="w-button" type="button" onClick={() => window.dispatchEvent(new CustomEvent("sf-start-tour"))}>Take the tour</button>
                  </div>
                </div>
                <div className="connect-banner">
                  <div>
                    <span className="dash-eyebrow">{connected}/3 CONNECTIONS</span>
                    <h2>{connected ? `${displayName} is connected.` : `${displayName} is selected.`}</h2>
                    <p>WordPress publishes approved changes. Search Console and Analytics provide the evidence.</p>
                  </div>
                  <Link className="w-button" href="/app/connections">Manage connections</Link>
                </div>
                <div className="w-metrics" data-tour="metrics" aria-busy={liveLoading}>
                  {liveLoading ? [0, 1, 2, 3].map((item) => (
                    <div className="w-metric" key={item}><span className="audit-skel" /><strong className="audit-skel" /><small className="audit-skel" /></div>
                  )) : (
                    <>
                      <div className="w-metric"><span>Site audit</span><strong>{live.score ? `${live.score} / 100` : "—"}</strong><small>{live.score ? `PageSpeed for ${displayName}` : `No score stored for ${displayName}`}</small></div>
                      <div className="w-metric"><span>Tracked keywords</span><strong>{live.keywords ?? (brief.ready ? preparedKeywords : "—")}</strong><small>{live.keywords ? `Search Console queries for ${displayName}` : "From this website’s setup until Search Console has queries"}</small></div>
                      <div className="w-metric"><span>AI prompts</span><strong>{brief.ready ? preparedPrompts : "—"}</strong><small>{brief.ready ? `Prepared for ${displayName}` : `Add setup answers for ${displayName}`}</small></div>
                      <div className="w-metric"><span>Referring domains</span><strong>{live.domains ?? "—"}</strong><small>{live.domains != null ? `DataForSEO live total${live.domainsAt ? `, checked ${live.domainsAt.slice(0, 10)}` : ""}` : `No backlink report stored for ${displayName}`}</small></div>
                    </>
                  )}
                </div>
                {liveLoading ? <p className="w-footnote" role="status">Loading audit data for {displayName}.</p> : null}
                <HomepageReview brief={brief} onSetup={() => router.push(resumeSetup())} />
                <div className="dashgrid">
                  <SiteDrafts site={site} brief={brief} showScanDetails={false} />
                  <aside className="control-column">
                    <section className="control-card" data-tour="guardrails">
                      <details className="guardrail-fold" ref={guardrailRef}>
                      <summary>
                        <div className="dash-eyebrow">YOUR GUARDRAILS</div>
                        <h2>Set the working style.</h2>
                      </summary>
                      <label className="setting-label" htmlFor="breadth">Keyword specificity</label>
                      <div className="range-labels"><span>Exact & focused</span><span>Broader discovery</span></div>
                      <input id="breadth" className="breadth" type="range" min="0" max="2" step="1" value={breadth} onChange={(event) => applyGuardrail({ breadth: Number(event.target.value) })} />
                      <div className="selected-mode">{breadthLabel}</div>
                      <p className="setting-help">This changes how broadly Searchify explores. It does not claim that a keyword is accurate; source evidence stays visible.</p>
                      <div className="setting-label approval-label">Approval policy</div>
                      <div className="mode-list" role="group" aria-label="Approval policy">
                        <button type="button" className={`mode-option${mode === "review" ? " active" : ""}`} aria-pressed={mode === "review"} onClick={() => applyGuardrail({ mode: "review" })}>
                          <span className="mode-radio" />
                          <span><strong>Review every change</strong><small>Approve or dismiss each item before publishing.</small></span>
                        </button>
                        <button type="button" className={`mode-option${mode === "drafts" ? " active" : ""}`} aria-pressed={mode === "drafts"} onClick={() => applyGuardrail({ mode: "drafts" })}>
                          <span className="mode-radio" />
                          <span><strong>Prepare drafts automatically</strong><small>Searchify organizes suggestions; you still approve each live change.</small></span>
                        </button>
                        <button type="button" className="mode-option future" disabled>
                          <span className="mode-radio" />
                          <span><strong>Bounded autopilot · future</strong><small>Only after explicit limits, audit logs and rollback are built.</small></span>
                        </button>
                      </div>
                      <p className="setting-help mode-help">Every live change requires your approval in this first-release concept.</p>
                      {styleNote ? <p className="setting-help">{styleNote}</p> : null}
                      </details>
                    </section>
                  </aside>
                </div>
              </section>
              <OverviewTour />
    </>
  );
}
