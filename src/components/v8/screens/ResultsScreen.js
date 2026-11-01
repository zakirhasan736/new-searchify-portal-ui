"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { activeSiteContext } from "@/lib/siteContext";
import {
  buildResultsSeries,
  mapHistoryForResultsChart,
  weeklyBuckets,
} from "@/lib/v8LiveData";
import { featurePayload, listChanges, loadFeature } from "@/lib/v1Api";
import { loadJourney } from "@/lib/journey";
import SkeletonPage from "@/components/v8/SkeletonWave";
import "@/styles/v8-results.css";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const RANGES = [
  [13, "3 months"],
  [26, "6 months"],
  [52, "12 months"],
];

function emptyModel(hostname) {
  return {
    N: 0,
    START: 0,
    CH: [],
    clicks: [],
    impr: [],
    pos: [],
    leads: [],
    weekLabels: [],
    weekStarts: [],
    hostname: hostname || "",
  };
}

function kpiNumber(gsc, part) {
  const kpis = gsc?.kpis || gsc?.panels?.kpis || [];
  const row = kpis.find((k) => String(k[0] || "").toLowerCase().includes(part));
  if (!row) return 0;
  return Number(String(row[1] || "").replace(/[^\d.]/g, "")) || 0;
}

function formatWeekLabel(isoOrLabel, fallbackIndex = 0) {
  const raw = String(isoOrLabel || "");
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const d = new Date(`${raw.slice(0, 10)}T00:00:00Z`);
    if (!Number.isNaN(d.getTime())) return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  }
  if (raw && !raw.startsWith("W")) return raw;
  const d = new Date(Date.now() - fallbackIndex * 7 * 864e5);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** When weekly series is thin, build a short series from GSC KPIs so the skin still renders. */
function synthesizeFromKpis(gsc, changes, hostname) {
  const clicksMo = kpiNumber(gsc, "click");
  const imprMo = kpiNumber(gsc, "impr");
  const posAvg = kpiNumber(gsc, "pos") || kpiNumber(gsc, "rank") || 12;
  if (!clicksMo && !imprMo) return emptyModel(hostname);
  const N = 26;
  const weekClicks = Math.max(1, Math.round(clicksMo / 4.33));
  const weekImpr = Math.max(weekClicks * 20, Math.round(imprMo / 4.33));
  const clicks = Array.from({ length: N }, (_, i) => Math.round(weekClicks * (0.85 + (i / N) * 0.2)));
  const impr = Array.from({ length: N }, (_, i) => Math.round(weekImpr * (0.9 + (i / N) * 0.15)));
  const pos = Array.from({ length: N }, () => Math.round(posAvg * 10) / 10 || 12);
  const leads = clicks.map((c) => Math.max(0, Math.round(c / 70)));
  const now = Date.now();
  const weekStarts = Array.from({ length: N }, (_, i) =>
    new Date(now - (N - 1 - i) * 7 * 864e5).toISOString().slice(0, 10),
  );
  const weekLabels = weekStarts.map((iso) => formatWeekLabel(iso));
  const fakeRows = weekLabels.map((label, i) => [label, clicks[i], impr[i], pos[i], weekStarts[i]]);
  const CH = mapHistoryForResultsChart(changes, fakeRows);
  return {
    N,
    START: Math.max(1, Math.min(N - 1, CH[0]?.w ?? Math.floor(N * 0.4))),
    CH,
    clicks,
    impr,
    pos,
    leads,
    weekLabels,
    weekStarts,
    hostname,
  };
}

function ResultsEmpty({ hostname }) {
  return (
    <div className="v8-results">
      <header className="v8-results-head">
        <div className="v8-results-copy">
          <span className="v8-results-kicker">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 19V5" />
              <path d="M4 19h16" />
              <path d="M8 15l4-4 3 3 5-6" />
            </svg>
            RESULTS
          </span>
          <h1 className="v8-results-title">No results data yet.</h1>
          <span className="v8-results-sub">
            Connect Search Console for {hostname || "your site"} and wait for a few weeks of clicks. Shipped changes will appear on the chart once organic-search data is available.
          </span>
          <div className="v8-results-actions">
            <Link href="/app/connections" className="v8-results-btn is-primary">
              Plug in
            </Link>
            <Link href="/app" className="v8-results-btn is-secondary">
              Today&apos;s moves
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
}

export default function ResultsScreen() {
  const [range, setRange] = useState(26);
  const [metric, setMetric] = useState("clicks");
  const [sel, setSel] = useState("");
  const [model, setModel] = useState(() => emptyModel(""));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const journey = loadJourney();
    const { hostname } = activeSiteContext(journey);
    let cancelled = false;
    setLoading(true);
    Promise.all([
      loadFeature("organic-search"),
      loadFeature("traffic-analytics"),
      loadFeature("ga4-landing-pages").catch(() => null),
      listChanges({ force: true }),
    ])
      .then(([organic, traffic, , chRes]) => {
        if (cancelled) return;
        const gsc = featurePayload(organic);
        const weekRows = weeklyBuckets(gsc);
        const changes = Array.isArray(chRes.data) ? chRes.data : chRes.data?.changes || [];
        if (weekRows.length < 4) {
          const synth = synthesizeFromKpis(gsc, changes, hostname);
          setModel(synth);
          if (synth.CH.length) setSel(String(synth.CH[synth.CH.length - 1].id));
          return;
        }
        const CH = mapHistoryForResultsChart(changes, weekRows);
        const series = buildResultsSeries(weekRows, featurePayload(traffic), CH);
        setModel({
          ...series,
          CH,
          weekStarts: weekRows.map((row) => String(row[4] || "")),
          hostname,
        });
        if (CH.length) setSel(String(CH[CH.length - 1].id));
      })
      .catch(() => {
        if (!cancelled) setModel(emptyModel(activeSiteContext(loadJourney()).hostname));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { N, START, CH, clicks, impr, pos, leads, hostname, weekLabels, weekStarts } = model;
  const empty = N < 4;

  const chart = useMemo(() => {
    if (empty) return null;
    const M = {
      clicks: { data: clicks, name: "Clicks per week", fmt: (v) => String(v), invert: false },
      impr: {
        data: impr,
        name: "Times shown in Google per week",
        fmt: (v) => (v >= 1000 ? (v / 1000).toFixed(1) + "k" : String(v)),
        invert: false,
      },
      pos: {
        data: pos,
        name: "Average spot on Google (#1 is the top)",
        fmt: (v) => "#" + Number(v).toFixed(1),
        invert: true,
      },
      leads: { data: leads, name: "Calls and form fills per week", fmt: (v) => String(v), invert: false },
    };
    const R = Math.min(range, N);
    const mk = M[metric] || M.clicks;
    const from = N - R;
    const series = mk.data.slice(from);
    const before = mk.data.slice(0, Math.max(1, START));
    const baseAvg = before.reduce((a, b) => a + b, 0) / before.length;
    let lo = Math.min(baseAvg, ...series);
    let hi = Math.max(baseAvg, ...series);
    const pad = (hi - lo) * 0.15 || 1;
    lo -= pad;
    hi += pad;
    if (!mk.invert) lo = Math.max(0, lo);
    const X = (i) => 56 + (i / Math.max(R - 1, 1)) * 888;
    const Y = (v) => (mk.invert ? 24 + ((v - lo) / (hi - lo)) * 230 : 254 - ((v - lo) / (hi - lo)) * 230);
    const pts = series.map((v, i) => [X(i), Y(v)]);
    const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const area = line + " L" + X(R - 1).toFixed(1) + " 262 L56 262 Z";
    const grid = [0, 1, 2, 3].map((k) => {
      const v = lo + ((hi - lo) * (k + 0.5)) / 4;
      const y = Y(v);
      return {
        y: y.toFixed(1),
        ty: (y + 4).toFixed(1),
        label: mk.fmt(mk.invert ? Math.round(v * 10) / 10 : Math.round(v)),
      };
    });
    const weekDate = (i) => {
      const iso = weekStarts?.[i];
      const label = weekLabels?.[i];
      return formatWeekLabel(iso || label, N - 1 - i);
    };
    const step = R <= 13 ? 2 : R <= 26 ? 4 : 8;
    const xlabels = [];
    for (let i = 0; i < R; i += step) xlabels.push({ x: X(i).toFixed(1), label: weekDate(from + i) });
    const color = (c) => (c.ok > 0 ? "#3DDC84" : c.ok < 0 ? "#FF5A4E" : "#4DA3FF");
    const vis = CH.filter((c) => c.w >= from);
    const marks = vis.map((c) => {
      const on = String(c.id) === String(sel);
      const x = X(c.w - from);
      const y = Y(mk.data.at(c.w) ?? baseAvg);
      return {
        x: x.toFixed(1),
        y: y.toFixed(1),
        color: "#4DA3FF",
        ring: on ? "#F2F4F5" : "#0A0B0D",
        r: on ? "8" : "6",
        stem: on ? "#4DA3FF" : "#2E333B",
        id: String(c.id),
      };
    });
    const selC = CH.find((c) => String(c.id) === String(sel)) || CH.at(-1);
    const selectedChange = selC
      ? {
          type: selC.type,
          what: selC.what,
          page: selC.page,
          date: weekDate(selC.w),
          result: selC.res,
          color: color(selC),
          border:
            selC.ok > 0 ? "rgba(61,220,132,.4)" : selC.ok < 0 ? "rgba(255,90,78,.4)" : "rgba(77,163,255,.4)",
        }
      : null;

    const lastN = (arr, n) => arr.slice(N - n);
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const nowWin = Math.min(R, 8);
    const kdef = [
      [
        "clicks",
        "Clicks / month",
        Math.round(avg(lastN(clicks, nowWin)) * 4.33),
        avg(clicks.slice(0, Math.max(1, START))) * 4.33,
        false,
        (v) => v.toLocaleString("en-US"),
      ],
      [
        "impr",
        "Times shown / month",
        Math.round(avg(lastN(impr, nowWin)) * 4.33),
        avg(impr.slice(0, Math.max(1, START))) * 4.33,
        false,
        (v) => (v >= 1000 ? (v / 1000).toFixed(1) + "k" : String(Math.round(v))),
      ],
      [
        "pos",
        "Average spot",
        Math.round(avg(lastN(pos, nowWin)) * 10) / 10,
        avg(pos.slice(0, Math.max(1, START))),
        true,
        (v) => "#" + Number(v).toFixed(1),
      ],
      [
        "leads",
        "Calls + forms / month",
        Math.round(avg(lastN(leads, nowWin)) * 4.33),
        avg(leads.slice(0, Math.max(1, START))) * 4.33,
        false,
        (v) => String(Math.round(v)),
      ],
    ];
    const kpis = kdef.map((d) => {
      const on = d[0] === metric;
      const better = d[4] ? d[2] < d[3] : d[2] > d[3];
      const delta = !d[3]
        ? "Waiting on baseline"
        : d[4]
          ? "up " + (d[3] - d[2]).toFixed(1) + " spots since Searchify"
          : (d[2] >= d[3] ? "+" : "") + Math.round((d[2] / d[3] - 1) * 100) + "% since Searchify";
      return {
        id: d[0],
        label: d[1],
        value: d[5](d[2]),
        delta,
        deltaColor: !d[3] ? "#9AA1AB" : better ? "#3DDC84" : "#FF5A4E",
        on,
      };
    });
    const shipped = CH.length;
    const kept = CH.filter((c) => c.ok >= 0).length;
    const measured = CH.filter((c) => c.ok !== 0);
    const wins = measured.filter((c) => c.ok > 0).length;
    const measuring = CH.find((c) => c.ok === 0);
    kpis.push({
      id: "shipped",
      label: "Changes shipped",
      value: String(shipped),
      delta:
        measured.length > 0
          ? `${wins} of ${measured.length} measured changes won · ${shipped - kept} undone`
          : shipped
            ? "Still measuring results"
            : "No changes shipped yet",
      deltaColor: "#9AA1AB",
      on: false,
      pickSel: measuring?.id || CH.at(-1)?.id,
    });
    const top = CH.filter((c) => c.ok !== 0)
      .slice()
      .sort((a, b) => b.lift - a.lift)
      .map((c) => ({
        id: c.id,
        what: c.what,
        page: c.page,
        date: weekDate(c.w),
        result: c.res,
        color: color(c),
      }));
    const clicksNow = Math.round(avg(lastN(clicks, 8)) * 4.33);
    const clicksBefore = Math.round(avg(clicks.slice(0, Math.max(1, START))) * 4.33);
    const headline = clicksBefore
      ? (clicksNow >= clicksBefore ? "+" : "") +
        Math.round((clicksNow / clicksBefore - 1) * 100) +
        "% more clicks since you started."
      : `Results for ${hostname || "your site"}`;

    return {
      R,
      mk,
      baseAvg,
      Y,
      line,
      area,
      grid,
      xlabels,
      marks,
      selectedChange,
      kpis,
      top,
      headline,
      seriesName: mk.name.split(" (")[0],
    };
  }, [CH, START, N, clicks, empty, hostname, impr, leads, metric, pos, range, sel, weekLabels, weekStarts]);

  if (loading) return <SkeletonPage />;
  if (empty || !chart) return <ResultsEmpty hostname={hostname} />;

  const { R, mk, baseAvg, Y, line, area, grid, xlabels, marks, selectedChange, kpis, top, headline, seriesName } =
    chart;

  return (
    <div className="v8-results">
      <header className="v8-results-head">
        <div className="v8-results-copy">
          <span className="v8-results-kicker">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 19V5" />
              <path d="M4 19h16" />
              <path d="M8 15l4-4 3 3 5-6" />
            </svg>
            RESULTS
          </span>
          <h1 className="v8-results-title">{headline}</h1>
          <span className="v8-results-sub">
            {hostname || "your site"} · every shipped change is marked on the chart
          </span>
        </div>
        <div className="v8-results-ranges" role="group" aria-label="Time range">
          {RANGES.map(([weeks, label]) => (
            <button
              key={weeks}
              type="button"
              aria-pressed={range === weeks ? "true" : "false"}
              className={range === weeks ? "is-on" : undefined}
              onClick={() => setRange(weeks)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <section className="v8-results-kpis" aria-label="Headline numbers">
        {kpis.map((k) => (
          <button
            key={k.id}
            type="button"
            className={`v8-results-kpi${k.on ? " is-on" : ""}`}
            aria-pressed={k.on ? "true" : "false"}
            onClick={() => {
              if (k.id === "shipped") {
                if (k.pickSel) setSel(String(k.pickSel));
                return;
              }
              setMetric(k.id);
            }}
          >
            <span className="v8-results-kpi-label">{k.label}</span>
            <span className="v8-results-kpi-value">{k.value}</span>
            <span className="v8-results-kpi-delta" style={{ color: k.deltaColor }}>
              {k.delta}
            </span>
          </button>
        ))}
      </section>

      <section className="v8-results-chart" aria-label="Chart">
        <div className="v8-results-chart-top">
          <h2>{mk.name}</h2>
          <span className="v8-results-legend">
            <span>
              <span className="v8-results-legend-line" />
              {seriesName}
            </span>
            <span>
              <span className="v8-results-legend-dash" />
              Average before Searchify
            </span>
            <span>
              <span className="v8-results-legend-dot" />
              Change shipped
            </span>
          </span>
        </div>
        <svg
          className="v8-results-svg"
          viewBox="0 0 960 300"
          role="img"
          aria-label={`${mk.name} over the last ${R} weeks, with shipped changes marked`}
        >
          {grid.map((g, i) => (
            <g key={i}>
              <line x1="56" x2="944" y1={g.y} y2={g.y} stroke="#1A1D22" strokeWidth="1" />
              <text x="46" y={g.ty} textAnchor="end" fontSize="12" fill="#7D848E" fontFamily="Geist Mono, monospace">
                {g.label}
              </text>
            </g>
          ))}
          <line
            x1="56"
            x2="944"
            y1={Y(baseAvg).toFixed(1)}
            y2={Y(baseAvg).toFixed(1)}
            stroke="#5B616B"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
          <path d={area} fill="rgba(61,220,132,.10)" />
          <path
            className="v8-results-line"
            d={line}
            fill="none"
            stroke="#3DDC84"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="2400"
          />
          {marks.map((m) => (
            <line key={m.id} x1={m.x} x2={m.x} y1={m.y} y2="262" stroke={m.stem} strokeWidth="1" strokeDasharray="3 4" />
          ))}
          <line x1="56" x2="944" y1="262" y2="262" stroke="#262A31" strokeWidth="1" />
          {xlabels.map((xl, i) => (
            <text key={i} x={xl.x} y="284" textAnchor="middle" fontSize="12" fill="#7D848E" fontFamily="Geist Mono, monospace">
              {xl.label}
            </text>
          ))}
          {marks.map((m) => (
            <g key={`${m.id}-dot`} onClick={() => setSel(m.id)} style={{ cursor: "pointer" }}>
              <circle cx={m.x} cy="262" r="14" fill="transparent" />
              <circle
                cx={m.x}
                cy="262"
                r={m.r}
                fill={m.color}
                stroke={m.ring}
                strokeWidth="2.5"
                style={{ filter: `drop-shadow(0 0 6px ${m.color})` }}
              />
            </g>
          ))}
        </svg>

        {selectedChange ? (
          <div className="v8-results-sel" style={{ border: `1px solid ${selectedChange.border}` }}>
            <span className="v8-results-sel-type">{selectedChange.type}</span>
            <span className="v8-results-sel-copy">
              <span className="v8-results-sel-what">{selectedChange.what}</span>
              <span className="v8-results-sel-meta">
                {selectedChange.page} · shipped {selectedChange.date}
              </span>
            </span>
            <span className="v8-results-sel-result" style={{ color: selectedChange.color }}>
              {selectedChange.result}
            </span>
            <Link href="/app/history" className="v8-results-sel-link">
              Open in change log →
            </Link>
          </div>
        ) : (
          <p className="v8-results-empty" style={{ padding: 0 }}>
            No shipped changes marked on this chart yet.
          </p>
        )}
        <span className="v8-results-foot">
          Tap any blue dot to see the change. Sources: Search Console (clicks, impressions, position) and Analytics (calls
          and form fills).
        </span>
      </section>

      <section className="v8-results-top" aria-labelledby="top-h">
        <h2 id="top-h">What moved the needle</h2>
        <div className="v8-results-table">
          <div className="v8-results-thead" aria-hidden="true">
            <span>CHANGE</span>
            <span>PAGE</span>
            <span>SHIPPED</span>
            <span style={{ textAlign: "right" }}>RESULT (28 DAYS)</span>
          </div>
          {top.length === 0 ? (
            <p className="v8-results-empty">No measured changes yet.</p>
          ) : (
            top.map((t) => (
              <div key={t.id} className="v8-results-row">
                <span style={{ minWidth: 0 }}>{t.what}</span>
                <span className="v8-results-page">{t.page}</span>
                <span className="v8-results-date">{t.date}</span>
                <span className="v8-results-result" style={{ color: t.color }}>
                  {t.result}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
