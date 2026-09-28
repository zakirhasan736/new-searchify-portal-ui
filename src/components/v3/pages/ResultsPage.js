"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import { usePageBoot } from "@/lib/usePageBoot";
import {
  changePath,
  featureKpi,
  featurePayload,
  historyItems,
  listChanges,
  loadFeature,
  syncGoogleLive,
} from "@/lib/v1Api";

function WeeklyClicksChart({ weeks }) {
  const points = weeks.length ? weeks : [];
  const values = points.map((w) => Number(w[1]) || 0);
  const maxY = Math.max(10, ...values);
  const top = Math.ceil(maxY / 50) * 50 || 50;
  const mid = Math.round(top / 2);
  const n = Math.max(points.length, 1);
  const xs = points.map((_, i) => (n === 1 ? 315 : 55 + (i * 520) / (n - 1)));
  const ys = values.map((v) => 190 - (v / top) * 165);
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x} ${ys[i]}`).join(" ");
  const label = values.join(", ");

  if (!points.length) {
    return (
      <div className="sf-empty" style={{ padding: "36px 16px" }}>
        <p style={{ fontSize: 14 }}>No weekly click data yet. Sync Search Console to load the chart.</p>
      </div>
    );
  }

  return (
    <svg className="sf-chart" viewBox="0 0 610 220" role="img" aria-label={`Weekly organic clicks: ${label}`}>
      <g stroke="var(--sf-line)" strokeWidth="1">
        <path d="M45 25H590M45 80H590M45 135H590M45 190H590" />
      </g>
      <text x="12" y="29">
        {top}
      </text>
      <text x="12" y="84">
        {mid}
      </text>
      <text x="18" y="139">
        {Math.round(mid / 2)}
      </text>
      <text x="25" y="194">
        0
      </text>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="3" />
      <g fill="currentColor">
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]} r="4" />
        ))}
      </g>
      {points.map((w, i) => (
        <text key={i} x={Math.max(20, xs[i] - 18)} y="212">
          {w[0]}
        </text>
      ))}
    </svg>
  );
}

export default function ResultsPage() {
  const toast = useV3Toast();
  const [metrics, setMetrics] = useState({
    clicks: "—",
    impressions: "—",
    ctr: "—",
    sessions: "—",
    psi: "—",
    places: "—",
  });
  const [history, setHistory] = useState([]);
  const [pageRows, setPageRows] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [lastDay, setLastDay] = useState("");
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = usePageBoot((s) => s.getFeature("organic-search"));

  const load = useCallback(async () => {
    const [ch, organic, traffic, psi, places, topPages] = await Promise.all([
      listChanges(),
      loadFeature("organic-search"),
      loadFeature("traffic-analytics"),
      loadFeature("site-audit"),
      loadFeature("local-seo"),
      loadFeature("top-pages"),
    ]);
    setHistory(historyItems(Array.isArray(ch.data) ? ch.data : []));
    const gsc = featurePayload(organic);
    const ga = featurePayload(traffic);
    const speed = featurePayload(psi);
    const local = featurePayload(places);
    const pages = featurePayload(topPages);
    setPageRows(pages.rows || []);

    const chartWeeks = (() => {
      if (Array.isArray(gsc.weekly) && gsc.weekly.length) return gsc.weekly;
      if (Array.isArray(gsc.panels?.weeklyClicks) && gsc.panels.weeklyClicks.length) return gsc.panels.weeklyClicks;
      if (Array.isArray(gsc.daily) && gsc.daily.length) {
        const ordered = [...gsc.daily].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
        const buckets = [];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        for (let i = 0; i < ordered.length; i += 7) {
          const chunk = ordered.slice(i, i + 7);
          const clicks = chunk.reduce((s, r) => s + (Number(r[1]) || 0), 0);
          const start = String(chunk[0][0] || "");
          const parts = start.split("-");
          const label =
            parts.length === 3 ? `${months[Number(parts[1]) - 1]} ${Number(parts[2])}` : start.slice(5) || start;
          buckets.push([label, clicks]);
        }
        return buckets.slice(-4);
      }
      return [];
    })();
    setWeekly(chartWeeks);
    setLastDay(gsc.lastCompleteDay || (gsc.daily?.length ? gsc.daily[gsc.daily.length - 1][0] : "") || "");

    setMetrics({
      clicks: featureKpi(gsc, "click", gsc.kpis?.[0]?.[1] || "—"),
      impressions: featureKpi(gsc, "impr", gsc.kpis?.[1]?.[1] || "—"),
      ctr: featureKpi(gsc, "ctr", gsc.kpis?.[2]?.[1] || "—"),
      sessions: featureKpi(ga, "session", ga.kpis?.[0]?.[1] || "—"),
      psi: featureKpi(speed, "performance", speed.kpis?.[0]?.[1] || speed.rows?.[0]?.[1] || "—"),
      places: featureKpi(local, "Places", String((local.rows || []).length || "—")),
    });
    setBooted(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const weekTotal = useMemo(() => weekly.reduce((s, w) => s + (Number(w[1]) || 0), 0), [weekly]);

  const refresh = async () => {
    setBusy(true);
    toast("Syncing Search Console, GA4, PageSpeed & Places…");
    const res = await syncGoogleLive();
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Sync failed. Connect Google in Settings first.");
      return;
    }
    const s = res.data?.synced || {};
    toast(`Updated — GSC:${s.gsc ? "✓" : "–"} GA4:${s.ga4 ? "✓" : "–"} PSI:${s.pagespeed ? "✓" : "–"} Places:${s.places ? "✓" : "–"}`);
    if (res.data?.queueError) toast(res.data.queueError);
    await load();
  };

  if (!booted) return <PageSkeleton />;

  return (
    <>
      <Hero
        label="Performance"
        line1="SEE THE"
        line2="RESULTS."
        sub="Search performance alongside your published updates."
        action={
          <Btn primary onClick={refresh} disabled={busy}>
            {busy ? "Syncing live data…" : "Refresh GSC · GA4 · PSI · Places"}
          </Btn>
        }
      />

      <div className="sf-note">
        Sources: <strong>GSC</strong> clicks/impr/CTR · <strong>GA4</strong> sessions · <strong>PageSpeed</strong> mobile
        score · <strong>Places</strong> listings · Tag events via GA4 (no separate GTM connector)
      </div>

      <div className="sf-three sf-gap">
        <div className="sf-box">
          <div className="sf-small">Clicks · Search Console</div>
          <div className="sf-metric">{metrics.clicks}</div>
          <Pill>GSC</Pill>
        </div>
        <div className="sf-box">
          <div className="sf-small">Impressions · Search Console</div>
          <div className="sf-metric">{metrics.impressions}</div>
          <Pill>GSC</Pill>
        </div>
        <div className="sf-box">
          <div className="sf-small">Click-through rate · Search Console</div>
          <div className="sf-metric">{metrics.ctr}</div>
          <Pill>GSC</Pill>
        </div>
      </div>

      <div className="sf-box sf-gap">
        <div className="sf-row sf-between">
          <h3>Weekly organic clicks</h3>
          <span className="sf-small">Last 28 days · Search Console{weekTotal ? ` · Total ${weekTotal}` : ""}</span>
        </div>
        <WeeklyClicksChart weeks={weekly} />
        <div className="sf-small">
          Source: Google Search Console
          {lastDay ? ` · Last complete day: ${lastDay}` : " · Sync to load live weekly series"}
        </div>
      </div>

      <div className="sf-three sf-gap">
        <div className="sf-box">
          <div className="sf-small">GA4 sessions</div>
          <div className="sf-metric">{metrics.sessions}</div>
          <Pill neutral>Analytics</Pill>
        </div>
        <div className="sf-box">
          <div className="sf-small">PageSpeed (mobile)</div>
          <div className="sf-metric">{metrics.psi}</div>
          <Pill neutral>PageSpeed Insights</Pill>
        </div>
        <div className="sf-box">
          <div className="sf-small">Places synced</div>
          <div className="sf-metric">{metrics.places}</div>
          <Pill neutral>Places API</Pill>
        </div>
      </div>

      <div className="sf-box sf-gap">
        <h3>Top pages · Search Console</h3>
        {pageRows.length ? (
          <div className="sf-tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Clicks</th>
                  <th>Impr.</th>
                  <th>CTR / Pos</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.slice(0, 12).map((r, i) => (
                  <tr key={i}>
                    <td>{r[0]}</td>
                    <td>{r[1]}</td>
                    <td>{r[2]}</td>
                    <td>
                      {r[3]} · {r[4]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ fontSize: 13, marginTop: 10 }}>Sync Search Console to load top pages.</p>
        )}
      </div>

      <div className="sf-box sf-gap">
        <h3>Pages you’ve updated</h3>
        {history.length ? (
          <div className="sf-tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Changed</th>
                  <th>Observation</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>{changePath(h)}</td>
                    <td>{h.appliedAt ? new Date(h.appliedAt).toLocaleDateString() : "—"}</td>
                    <td>
                      {h.status === "undone"
                        ? "Change undone"
                        : h.monitoring?.note || (h.execution?.dryRun ? "Dry-run recorded" : "Collecting post-change data")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ fontSize: 13, marginTop: 10 }}>Publish an update to begin tracking it here.</p>
        )}
      </div>

      <div className="sf-note sf-gap">
        Changes in clicks can reflect seasonality, demand, competitors and Google updates. These comparisons do not establish causation.
      </div>
    </>
  );
}
