"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import { usePageBoot } from "@/lib/usePageBoot";
import {
  changePath,
  changeTitle,
  getGoogleStatus,
  historyItems,
  listChanges,
  listCmsConnections,
  loadFeature,
  queueItems,
  syncGoogleLive,
} from "@/lib/v1Api";
import { activeJourneySite, beginAnotherWebsite, loadJourney, planById, recommendationsFor } from "@/lib/journey";

function todayLabel() {
  return "Overview";
}

export default function OverviewPage() {
  const toast = useV3Toast();
  const router = useRouter();
  const [changes, setChanges] = useState([]);
  const [metrics, setMetrics] = useState({ clicks: "—", pages: "—", published: 0 });
  const [gscOk, setGscOk] = useState(false);
  const [wpOk, setWpOk] = useState(false);
  const [sites, setSites] = useState([]);
  const [siteLimit, setSiteLimit] = useState(5);
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = usePageBoot((s) => s.getChanges());
  const [brief, setBrief] = useState(null);

  useEffect(() => {
    const state = loadJourney();
    const site = activeJourneySite(state);
    setBrief({ site, plan: planById(state.planId), items: recommendationsFor(site) });
  }, []);

  const load = useCallback(async () => {
    const [{ data: ch }, organic, pages, google, cms] = await Promise.all([
      listChanges({ force: true }),
      loadFeature("organic-search"),
      loadFeature("top-pages"),
      getGoogleStatus(),
      listCmsConnections(),
    ]);
    const list = Array.isArray(ch) ? ch : [];
    setChanges(list);
    const g = google.data?.connection;
    setGscOk(Boolean(g?.gscSiteUrl || g?.status === "connected"));
    const conns = cms.data?.connections || [];
    setWpOk(Boolean(conns.some((c) => c.provider === "wordpress" && c.status === "connected")));
    setSites(conns);
    setSiteLimit(Number(cms.data?.limit) || 5);
    const hist = historyItems(list);
    let clicks = "—";
    const kpis = organic?.data?.payload?.kpis || organic?.data?.kpis;
    if (Array.isArray(kpis) && kpis[0]) clicks = String(kpis[0][1] ?? kpis[0]);
    const pageRows = pages?.data?.payload?.rows || pages?.data?.rows || [];
    setMetrics({
      clicks,
      pages: pageRows.length ? String(pageRows.length) : "—",
      published: hist.filter((c) => c.status !== "undone" && c.status !== "failed").length,
    });
    setBooted(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ready = useMemo(() => (gscOk ? queueItems(changes) : []), [changes, gscOk]);

  const refreshQueue = async () => {
    setBusy(true);
    const sync = await syncGoogleLive();
    setBusy(false);
    if (!sync.ok) {
      toast(sync.data?.detail || "Connect Google Search Console first. WordPress alone does not fill the queue.");
      return;
    }
    const created = sync.data?.queue?.created;
    toast(
      created != null
        ? `Opened ${created} opportunities from Search Console.`
        : "Google synced. Open the work queue to review live pages.",
    );
    load();
  };

  if (!booted) return <PageSkeleton />;

  return (
    <>
      {brief?.site ? (
        <div className="sf-focus" style={{ marginBottom: 22 }}>
          <Pill>{brief.plan ? `${brief.plan.name} plan` : "From your setup"}</Pill>
          <h2 style={{ marginTop: 12 }}>Results for {String(brief.site.answers?.site || "this website").replace(/^https?:\/\//, "")}</h2>
          <p>These recommendations come from the questions you answered. Live Search Console items appear below once that connection is on. Nothing is published until you approve it.</p>
          <div className="sf-list" style={{ marginTop: 16 }}>
            {brief.items.map((item) => (
              <div className="sf-listrow" key={item.title}>
                <div>
                  <h3>{item.title}</h3>
                  <div className="sf-small">{item.detail}</div>
                </div>
                <Link className="sf-link" href="/app/queue">Review →</Link>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Hero
        label={todayLabel()}
        line1="YOUR NEXT"
        line2="MOVE."
        sub={`${ready.length} suggested updates ready. Review each change before it goes live.`}
        action={<Btn primary onClick={() => (ready.length ? router.push(`/app/queue/${ready[0].id}`) : router.push("/app/history"))}>{ready.length ? "Review updates →" : "View change history"}</Btn>}
      />

      <div className="sf-focus sf-gap">
        <div className="sf-row sf-between">
          <div>
            <Pill>{ready.length ? "Ready for review" : gscOk ? "Queue empty" : "Connect first"}</Pill>
            <h2 style={{ marginTop: 13 }}>
              {ready.length ? changeTitle(ready[0]) : gscOk ? "Pull live pages into the work queue" : "Connect Google to fill the work queue"}
            </h2>
            <p>
              {ready.length
                ? "Review the draft, then approve. WordPress stays unchanged until you publish."
                : wpOk && !gscOk
                  ? "WordPress is connected for publishing only. Search Console creates queue items."
                  : "Google Search Console finds pages. WordPress publishes approved titles and descriptions."}
            </p>
          </div>
          <Btn
            primary
            onClick={() =>
              ready.length ? router.push(`/app/queue/${ready[0].id}`) : gscOk ? refreshQueue() : router.push("/app/connections")
            }
            disabled={busy}
          >
            {ready.length ? "Review updates →" : gscOk ? (busy ? "Checking…" : "Find opportunities →") : "Connect Google →"}
          </Btn>
        </div>
        <div className="sf-divider" />
        <div className="sf-row sf-between">
          <span className="sf-small">{ready.length} remaining · Titles and descriptions only</span>
          <span className="sf-small">
            {gscOk ? "GSC connected" : "GSC not connected"}
            {" · "}
            {wpOk ? "WordPress connected" : "WordPress not connected"}
          </span>
        </div>
      </div>

      <div className="sf-three sf-gap">
        <div className="sf-box">
          <div className="sf-small">Organic clicks · Last 28 days</div>
          <div className="sf-metric">{metrics.clicks}</div>
          <span className="sf-small">From Search Console</span>
        </div>
        <div className="sf-box">
          <div className="sf-small">Updates published</div>
          <div className="sf-metric">{metrics.published}</div>
          <span className="sf-small">Approved by your team</span>
        </div>
        <div className="sf-box">
          <div className="sf-small">Pages monitored</div>
          <div className="sf-metric">{metrics.pages}</div>
          <span className="sf-small">GSC top pages</span>
        </div>
      </div>

      <div className="sf-row sf-between sf-gap" style={{ marginBottom: 13 }}>
        <h2>This week’s work</h2>
        <Btn href="/app/queue">See all</Btn>
      </div>
      <div className="sf-list">
        {ready.length ? (
          ready.slice(0, 5).map((c) => (
            <div className="sf-listrow" key={c.id}>
              <div>
                <h3>{changeTitle(c)}</h3>
                <div className="sf-small">{changePath(c)}</div>
              </div>
              <Link className="sf-link" href={`/app/queue/${c.id}`}>
                Review →
              </Link>
            </div>
          ))
        ) : (
          <div className="sf-empty">
            {gscOk
              ? "No live opportunities yet. Sync Search Console to open pages in the work queue."
              : "Connect Google Search Console, then find opportunities. WordPress is for publishing only."}
          </div>
        )}
      </div>

      <div className="sf-note sf-gap">
        Your business details guide every suggestion.{" "}
        <Link className="sf-link" href="/app/profile">
          Review business profile →
        </Link>
      </div>

      <div className="sf-row sf-between sf-gap" style={{ marginBottom: 13 }}>
        <h2>Your projects · {sites.length} / {siteLimit}</h2>
        <Btn onClick={() => router.push(beginAnotherWebsite())}>Add website →</Btn>
      </div>
      <div className="sf-list sf-gap">
        {sites.length ? (
          sites.map((site) => (
            <div className="sf-listrow" key={site.id}>
              <div>
                <h3>{site.label || site.siteUrl}</h3>
                <div className="sf-small">
                  {site.siteUrl}
                  {" · "}
                  GSC {site.meta?.gscSiteUrl ? "on" : "off"}
                  {" · "}
                  GA4 {site.meta?.ga4PropertyId ? "on" : "off"}
                  {" · "}
                  Ads {site.meta?.adsCustomerId ? "on" : "off"}
                </div>
              </div>
              <Link className="sf-link" href={`/app/connections/google?site=${site.id}`}>
                Open →
              </Link>
            </div>
          ))
        ) : (
          <div className="sf-empty">No website projects yet. Connect WordPress in Settings → Connections.</div>
        )}
      </div>

      <div className="sf-row sf-between sf-gap">
        <h2>Your workspace</h2>
        <span className="sf-small">Live workspace</span>
      </div>
      <div className="sf-featurelinks sf-gap">
        {[
          ["Performance", "/app/results"],
          ["Research", "/app/keywords"],
          ["Content", "/app/content"],
          ["Local", "/app/local"],
          ["AI Visibility", "/app/visibility"],
          ["Reports", "/app/reports"],
          ["Workspace", "/app/workspace"],
          ["Operations", "/app/operations"],
          ["Settings", "/app/connections"],
        ].map(([label, href]) => (
          <button key={href} type="button" className="sf-btn" onClick={() => router.push(href)}>
            {label} →
          </button>
        ))}
      </div>
    </>
  );
}
