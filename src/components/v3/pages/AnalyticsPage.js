"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import { createAiDraft } from "@/lib/clientApi";
import { usePageBoot } from "@/lib/usePageBoot";
import { loadFeature, syncGoogleLive } from "@/lib/v1Api";

export default function AnalyticsPage() {
  const toast = useV3Toast();
  const [gsc, setGsc] = useState(null);
  const [ga4, setGa4] = useState(null);
  const [pages, setPages] = useState([]);
  const [question, setQuestion] = useState("");
  const [insight, setInsight] = useState(null);
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = usePageBoot((s) => s.getFeature("organic-search"));

  const load = useCallback(async () => {
    const [organic, traffic, landings] = await Promise.all([
      loadFeature("organic-search"),
      loadFeature("traffic-analytics"),
      loadFeature("ga4-landing-pages"),
    ]);
    setGsc(organic?.data?.payload || organic?.data || null);
    setGa4(traffic?.data?.payload || traffic?.data || null);
    setPages(landings?.data?.payload?.rows || landings?.data?.rows || []);
    setBooted(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const kpi = (src, i, fallback = "—") => {
    const k = src?.kpis?.[i];
    return k ? String(k[1]) : fallback;
  };

  const analyze = async (preset) => {
    if (!gsc?.rows?.length && !ga4?.kpis?.length && !pages.length) {
      toast("Connect Google and sync first. Analysis uses live GSC/GA4 only.");
      return;
    }
    setBusy(true);
    const q = preset || question || "What should I prioritize?";
    const brief = `GSC clicks: ${kpi(gsc, 0)}. GA4 sessions: ${kpi(ga4, 0)}. Top pages: ${JSON.stringify(pages.slice(0, 5))}. Question: ${q}. Answer briefly with one next step. Do not invent metrics.`;
    try {
      const res = await createAiDraft({ kind: "seo-insight", brief, writingType: "Analytics insight", tokens: 400 });
      const data = await res.json().catch(() => ({}));
      setInsight({
        title: preset === "leads" ? "Review conversion pages." : preset === "summary" ? "Month snapshot." : "Start with evidence.",
        body: data.body || data.draft?.body || data.detail || "Connect Google and sync, then ask again.",
        question: q,
      });
    } catch {
      toast("Could not analyze. Check OpenAI configuration.");
    }
    setBusy(false);
  };

  if (!booted) return <PageSkeleton />;

  return (
    <>
      <Hero label="AI analytics" line1="TURN DATA" line2="INTO DECISIONS." sub="Understand search traffic and on-site behavior together. Start with a question." />

      <div className="sf-row">
        <Pill neutral>Search Console · {gsc?.rows?.length ? "Live" : "Sync needed"}</Pill>
        <Pill neutral>GA4 · {ga4?.rows?.length || ga4?.kpis?.length ? "Live" : "Sync needed"}</Pill>
        <Link className="sf-link" href="/app/connections">
          Manage connections →
        </Link>
      </div>

      <div className="sf-three sf-gap">
        <div className="sf-box">
          <div className="sf-small">Organic sessions</div>
          <div className="sf-metric">{kpi(ga4, 0)}</div>
          <div className="sf-small">GA4 · Last 28 days</div>
        </div>
        <div className="sf-box">
          <div className="sf-small">Organic clicks</div>
          <div className="sf-metric">{kpi(gsc, 0)}</div>
          <div className="sf-small">Search Console · Last 28 days</div>
        </div>
        <div className="sf-box">
          <div className="sf-small">Key events / conversions</div>
          <div className="sf-metric">{kpi(ga4, 2, kpi(ga4, 1))}</div>
          <div className="sf-small">GA4 · Configured events</div>
        </div>
      </div>

      <div className="sf-box sf-ai sf-gap">
        <h2>What do you want to understand?</h2>
        <div className="sf-toolform sf-gap">
          <label className="sf-field">
            Ask about this website
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Which pages should I work on first?" />
          </label>
          <Btn primary onClick={() => analyze()} disabled={busy}>
            {busy ? "Analyzing…" : "Analyze"}
          </Btn>
        </div>
        <div className="sf-chiprow">
          <Btn onClick={() => analyze("leads")}>Where are we losing leads?</Btn>
          <Btn onClick={() => analyze("priority")}>What should I prioritize?</Btn>
          <Btn onClick={() => analyze("summary")}>Summarize this month</Btn>
              <Btn
            onClick={async () => {
              setBusy(true);
              await syncGoogleLive();
              await load();
              setBusy(false);
              toast("Google data refreshed.");
            }}
          >
            Sync Google
          </Btn>
        </div>
        {insight ? (
          <div className="sf-answer" aria-live="polite">
            <div className="sf-label">AI analysis</div>
            <h2 style={{ marginTop: 12 }}>{insight.title}</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{insight.body}</p>
            <div className="sf-small">Evidence: GSC + GA4 · Last sync</div>
            <div className="sf-chiprow">
              <Btn href="/app/queue">Review opportunities</Btn>
              <Btn href="/app/results">Inspect performance</Btn>
            </div>
          </div>
        ) : null}
      </div>

      <div className="sf-box sf-gap">
        <h2>Page performance</h2>
        <div className="sf-tablewrap">
          <table className="sf-ranktable">
            <thead>
              <tr>
                <th>Landing page</th>
                <th>Sessions / clicks</th>
                <th>Engagement</th>
              </tr>
            </thead>
            <tbody>
              {(pages.length ? pages : gsc?.rows || []).slice(0, 8).map((r, i) => (
                <tr key={i}>
                  <td>{r[0]}</td>
                  <td>{r[1]}</td>
                  <td>{r[2] ?? r[3] ?? "—"}</td>
                </tr>
              ))}
              {!pages.length && !gsc?.rows?.length ? (
                <tr>
                  <td colSpan={3}>Sync GA4 / GSC to populate this table.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sf-note sf-gap">Clicks and sessions measure different things. Comparisons do not establish causation.</div>
    </>
  );
}
