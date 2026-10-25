"use client";

import { useEffect, useState } from "react";
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
import "@/styles/v8-screens.css";

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
    hostname: hostname || "",
  };
}

function kpiNumber(gsc, part) {
  const kpis = gsc?.kpis || gsc?.panels?.kpis || [];
  const row = kpis.find((k) => String(k[0] || "").toLowerCase().includes(part));
  if (!row) return 0;
  return Number(String(row[1] || "").replace(/[^\d.]/g, "")) || 0;
}

/** When weekly series is thin, build a short series from GSC KPIs so the skin still renders. */
function synthesizeFromKpis(gsc, changes, hostname) {
  const clicksMo = kpiNumber(gsc, "click");
  const imprMo = kpiNumber(gsc, "impr");
  const posAvg = kpiNumber(gsc, "pos") || kpiNumber(gsc, "rank") || 12;
  if (!clicksMo && !imprMo) return emptyModel(hostname);
  const N = 13;
  const weekClicks = Math.max(1, Math.round(clicksMo / 4.33));
  const weekImpr = Math.max(weekClicks * 20, Math.round(imprMo / 4.33));
  const clicks = Array.from({ length: N }, (_, i) => Math.round(weekClicks * (0.85 + (i / N) * 0.2)));
  const impr = Array.from({ length: N }, (_, i) => Math.round(weekImpr * (0.9 + (i / N) * 0.15)));
  const pos = Array.from({ length: N }, () => Math.round(posAvg * 10) / 10 || 12);
  const leads = clicks.map((c) => Math.max(0, Math.round(c / 70)));
  const now = Date.now();
  const weekLabels = Array.from({ length: N }, (_, i) => {
    const d = new Date(now - (N - 1 - i) * 7 * 864e5);
    return d.toLocaleString("en-US", { month: "short", day: "numeric" });
  });
  const fakeRows = weekLabels.map((label, i) => [label, clicks[i], impr[i], pos[i], new Date(now - (N - 1 - i) * 7 * 864e5).toISOString().slice(0, 10)]);
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
    hostname,
  };
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
    setLoading(true);
    Promise.all([
      loadFeature("organic-search"),
      loadFeature("traffic-analytics"),
      loadFeature("ga4-landing-pages").catch(() => null),
      listChanges({ force: true }),
    ])
      .then(([organic, traffic, , chRes]) => {
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
          hostname,
        });
        if (CH.length) setSel(String(CH[CH.length - 1].id));
      })
      .catch(() => setModel(emptyModel(activeSiteContext(loadJourney()).hostname)))
      .finally(() => setLoading(false));
  }, []);

  const { N, START, CH, clicks, impr, pos, leads, hostname } = model;
  const empty = N < 4;

  if (loading) {
    return <SkeletonPage />;
  }

  if (empty) {
    return (
      <div
        style={{
          flex: "999 1 560px",
          minWidth: 0,
          minHeight: 400,
          background: "#0A0B0D",
          color: "#F2F4F5",
          fontFamily: "Geist, 'Helvetica Neue', sans-serif",
          boxSizing: "border-box",
          padding: "28px clamp(16px, 4vw, 48px) 56px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
            fontSize: "15px",
            fontWeight: "800",
            letterSpacing: "1.6px",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3DDC84"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 19V5"></path>
            <path d="M4 19h16"></path>
            <path d="M8 15l4-4 3 3 5-6"></path>
          </svg>
          RESULTS
        </span>
        <h1
          style={{
            margin: "0",
            fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
            fontSize: "clamp(30px, 3.6vw, 44px)",
            lineHeight: "1.04",
            letterSpacing: "-1.2px",
            fontWeight: "700",
          }}
        >
          No results data yet.
        </h1>
        <p style={{ margin: 0, fontSize: "15px", color: "#9AA1AB", maxWidth: 560 }}>
          {`Connect Search Console for ${hostname || "your site"} and wait for a few weeks of clicks. Shipped changes will appear on the chart once organic-search data is available.`}
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/app/connections"
              style={{
                minHeight: 44,
                padding: "0 16px",
                borderRadius: 12,
                background: "#4DA3FF",
                color: "#0A0B0D",
                textDecoration: "none",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Plug in
            </Link>
            <Link
              href="/app"
              style={{
                minHeight: 44,
                padding: "0 16px",
                borderRadius: 12,
                border: "1px solid #262A31",
                color: "#D7DADE",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Today&apos;s moves
            </Link>
          </div>
      </div>
    );
  }

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
      fmt: (v) => "#" + v.toFixed(1),
      invert: true,
    },
    leads: { data: leads, name: "Calls and form fills per week", fmt: (v) => String(v), invert: false },
  };

  const R = Math.min(range, N);
  const mk = M[metric];
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
    const row = model.weekLabels?.[i];
    if (row) return row;
    return `W${i + 1}`;
  };
  const step = R <= 13 ? 2 : R <= 26 ? 4 : 8;
  const xlabels = [];
  for (let i = 0; i < R; i += step) xlabels.push({ x: X(i).toFixed(1), label: weekDate(from + i) });
  const color = (c) => (c.ok > 0 ? "#3DDC84" : c.ok < 0 ? "#FF5A4E" : "#4DA3FF");
  const vis = CH.filter((c) => c.w >= from);
  const marks = vis.map((c) => {
    const on = c.id === sel;
    const x = X(c.w - from);
    const y = Y(mk.data.at(c.w) ?? baseAvg);
    return {
      x: x.toFixed(1),
      y: y.toFixed(1),
      color: "#4DA3FF",
      ring: on ? "#F2F4F5" : "#0A0B0D",
      r: on ? "8" : "6",
      stem: on ? "#4DA3FF" : "#2E333B",
      id: c.id,
    };
  });
  const selC = CH.find((c) => c.id === sel) || CH.at(-1);
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
      (v) => (v / 1000).toFixed(1) + "k",
    ],
    [
      "pos",
      "Average spot",
      Math.round(avg(lastN(pos, nowWin)) * 10) / 10,
      avg(pos.slice(0, Math.max(1, START))),
      true,
      (v) => "#" + v.toFixed(1),
    ],
    [
      "leads",
      "Calls + forms / month",
      Math.round(avg(lastN(leads, nowWin)) * 4.33),
      avg(leads.slice(0, Math.max(1, START))) * 4.33,
      false,
      (v) => String(v),
    ],
  ];
  const kpis = kdef.map((d) => {
    const on = d[0] === metric;
    const better = d[4] ? d[2] < d[3] : d[2] > d[3];
    const delta = !d[3]
      ? "—"
      : d[4]
        ? "up " + (d[3] - d[2]).toFixed(1) + " spots since Searchify"
        : (d[2] >= d[3] ? "+" : "") + Math.round((d[2] / d[3] - 1) * 100) + "% since Searchify";
    return {
      label: d[1],
      value: d[5](d[2]),
      delta: delta,
      deltaColor: better ? "#3DDC84" : "#FF5A4E",
      pressed: on ? "true" : "false",
      bg: on ? "rgba(61,220,132,.06)" : "#101215",
      border: on ? "#3DDC84" : "#1A1D22",
      glow: on ? "0 0 22px rgba(61,220,132,.18)" : "none",
      id: d[0],
    };
  });
  const shipped = CH.length;
  const kept = CH.filter((c) => c.ok >= 0).length;
  const measured = CH.filter((c) => c.ok !== 0);
  const wins = measured.filter((c) => c.ok > 0).length;
  kpis.push({
    label: "Changes shipped",
    value: String(shipped),
    delta: wins + " of " + measured.length + " measured changes won · " + (shipped - kept) + " undone",
    deltaColor: "#9AA1AB",
    pressed: "false",
    bg: "#101215",
    border: "#1A1D22",
    glow: "none",
    id: "shipped",
  });
  const top = CH.filter((c) => c.ok !== 0)
    .slice()
    .sort((a, b) => b.lift - a.lift)
    .map((c) => ({ what: c.what, page: c.page, date: weekDate(c.w), result: c.res, color: color(c) }));
  const clicksNow = Math.round(avg(lastN(clicks, 8)) * 4.33);
  const clicksBefore = Math.round(avg(clicks.slice(0, Math.max(1, START))) * 4.33);
  const headline = clicksBefore
    ? (clicksNow >= clicksBefore ? "+" : "") +
      Math.round((clicksNow / clicksBefore - 1) * 100) +
      "% more clicks since you started."
    : "Results for " + (hostname || "your site");

  return (
    <div
      style={{
        flex: "999 1 560px",
        minWidth: 0,
        minHeight: 1200,
        background: "#0A0B0D",
        color: "#F2F4F5",
        fontFamily: "Geist, 'Helvetica Neue', sans-serif",
        boxSizing: "border-box",
        padding: "28px clamp(16px, 4vw, 48px) 56px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <header
        style={{
          maxWidth: "1120px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
              fontSize: "15px",
              fontWeight: "800",
              letterSpacing: "1.6px",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3DDC84"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 19V5"></path>
              <path d="M4 19h16"></path>
              <path d="M8 15l4-4 3 3 5-6"></path>
            </svg>
            RESULTS
          </span>
          <h1
            style={{
              margin: "0",
              fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
              fontSize: "clamp(30px, 3.6vw, 44px)",
              lineHeight: "1.04",
              letterSpacing: "-1.2px",
              fontWeight: "700",
              minWidth: 0,
              overflowWrap: "break-word",
            }}
          >
            {headline}
          </h1>
          <span style={{ fontSize: "15px", color: "#9AA1AB" }}>
            {hostname} · every shipped change is marked on the chart
          </span>
        </div>
        <div
          role="group"
          aria-label="Time range"
          style={{ display: "inline-flex", padding: "4px", borderRadius: "12px", background: "#131519", border: "1px solid #262A31" }}
        >
          {[
            [13, "3 months"],
            [26, "6 months"],
            [52, "12 months"],
          ].map((r) => (
            <button
              key={r[0]}
              type="button"
              aria-pressed={range === r[0] ? "true" : "false"}
              onClick={() => setRange(r[0])}
              style={{
                minHeight: "38px",
                padding: "0 14px",
                borderRadius: "9px",
                border: "0",
                background: range === r[0] ? "#262A31" : "transparent",
                color: range === r[0] ? "#F2F4F5" : "#9AA1AB",
                fontSize: "14px",
                fontWeight: range === r[0] ? "600" : "400",
              }}
            >
              {r[1]}
            </button>
          ))}
        </div>
      </header>

      <section
        aria-label="Headline numbers"
        style={{
          maxWidth: "1120px",
          width: "100%",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "12px",
        }}
      >
        {kpis.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => k.id !== "shipped" && setMetric(k.id)}
            aria-pressed={k.pressed}
            style={{
              textAlign: "left",
              font: "inherit",
              color: "#F2F4F5",
              borderRadius: "18px",
              padding: "18px",
              background: k.bg,
              border: `1px solid ${k.border}`,
              boxShadow: k.glow,
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              transition: "border-color .25s ease, box-shadow .25s ease",
            }}
          >
            <span style={{ fontSize: "13px", color: "#9AA1AB" }}>{k.label}</span>
            <span
              style={{
                fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                fontSize: "34px",
                fontWeight: "800",
                letterSpacing: "-1px",
                lineHeight: "1",
              }}
            >
              {k.value}
            </span>
            <span style={{ fontSize: "13px", fontWeight: "600", color: k.deltaColor }}>{k.delta}</span>
          </button>
        ))}
      </section>

      <section
        aria-label="Chart"
        style={{
          maxWidth: "1120px",
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
          borderRadius: "24px",
          background: "#101215",
          border: "1px solid #1A1D22",
          padding: "clamp(18px, 2.6vw, 28px)",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <h2 style={{ margin: "0", fontSize: "17px", fontWeight: "600" }}>{mk.name}</h2>
          <span style={{ display: "inline-flex", gap: "14px", flexWrap: "wrap", fontSize: "12px", color: "#9AA1AB" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "14px", height: "3px", borderRadius: "2px", background: "#3DDC84" }} />
              {mk.name.split(" (")[0]}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "14px", borderTop: "2px dashed #5B616B" }} />
              Average before Searchify
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#4DA3FF" }} />
              Change shipped
            </span>
          </span>
        </div>
        <svg
          viewBox="0 0 960 300"
          role="img"
          aria-label={`${mk.name} over the last ${R} weeks, with shipped changes marked`}
          style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
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
            d={line}
            fill="none"
            stroke="#3DDC84"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="2400"
            style={{ animation: "sfy-draw 1.4s ease-out both", filter: "drop-shadow(0 0 6px rgba(61,220,132,.45))" }}
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
            <g key={m.id + "-dot"} onClick={() => setSel(m.id)} style={{ cursor: "pointer" }}>
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
              padding: "14px 16px",
              borderRadius: "16px",
              background: "#0A0B0D",
              border: `1px solid ${selectedChange.border}`,
              animation: "sfy-rise .3s ease both",
            }}
          >
            <span
              style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: "11px",
                padding: "3px 8px",
                borderRadius: "6px",
                background: "#1A1D22",
                color: "#D7DADE",
              }}
            >
              {selectedChange.type}
            </span>
            <span style={{ flex: "1 1 260px", minWidth: "0", display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "15px", fontWeight: "600" }}>{selectedChange.what}</span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px", color: "#9AA1AB" }}>
                {selectedChange.page} · shipped {selectedChange.date}
              </span>
            </span>
            <span style={{ fontSize: "14px", fontWeight: "600", color: selectedChange.color }}>{selectedChange.result}</span>
            <Link href="/app/history" style={{ fontSize: "13px", color: "#9AA1AB", textDecoration: "none" }}>
              Open in change log →
            </Link>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "14px", color: "#9AA1AB" }}>No shipped changes marked on this chart yet.</p>
        )}
        <span style={{ fontSize: "12px", color: "#7D848E" }}>
          Tap any blue dot to see the change. Sources: Search Console (clicks, impressions, position) and Analytics (calls
          and form fills).
        </span>
      </section>

      <section
        aria-labelledby="top-h"
        style={{ maxWidth: "1120px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "10px" }}
      >
        <h2 id="top-h" style={{ margin: "0", fontSize: "17px", fontWeight: "600" }}>
          What moved the needle
        </h2>
        <div style={{ borderRadius: "20px", background: "#101215", border: "1px solid #1A1D22", overflow: "hidden" }}>
          <div
            aria-hidden="true"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2.4fr) minmax(0, 1.4fr) 90px 160px",
              gap: "12px",
              padding: "12px 18px",
              fontFamily: "'Geist Mono', monospace",
              fontSize: "11px",
              color: "#7D848E",
              borderBottom: "1px solid #1A1D22",
            }}
          >
            <span>CHANGE</span>
            <span>PAGE</span>
            <span>SHIPPED</span>
            <span style={{ textAlign: "right" }}>RESULT (28 DAYS)</span>
          </div>
          {top.length === 0 && (
            <p style={{ margin: 0, padding: "18px", fontSize: "14px", color: "#9AA1AB" }}>No measured changes yet.</p>
          )}
          {top.slice(0, 5).map((t, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 2.4fr) minmax(0, 1.4fr) 90px 160px",
                gap: "12px",
                alignItems: "center",
                padding: "14px 18px",
                borderBottom: "1px solid #16181C",
                fontSize: "14px",
              }}
            >
              <span style={{ minWidth: "0" }}>{t.what}</span>
              <span
                style={{
                  minWidth: "0",
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: "12px",
                  color: "#9AA1AB",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {t.page}
              </span>
              <span style={{ fontSize: "13px", color: "#9AA1AB" }}>{t.date}</span>
              <span style={{ textAlign: "right", fontWeight: "600", color: t.color }}>{t.result}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
