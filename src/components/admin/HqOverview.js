"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import HqPanel, { useFirstLoad } from "@/components/admin/HqPanel";
import { getHqOverview } from "@/lib/hqApi";
import { buildHqOverviewModel } from "@/lib/hqOverviewModel";

export default function HqOverview() {
  const [loading, firstLoad] = useFirstLoad();
  const [range, setRange] = useState("30");
  const [api, setApi] = useState(null);

  useEffect(() => {
    let cancelled = false;
    firstLoad(getHqOverview(range)).then((res) => {
      if (!cancelled && res.ok) setApi(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const d = useMemo(() => buildHqOverviewModel(api || {}, range), [api, range]);

  const rangeControl = (
    <div
      role="group"
      aria-label="Time range"
      style={{
        display: "inline-flex",
        padding: 4,
        borderRadius: 12,
        background: "#131519",
        border: "1px solid #262A31",
      }}
    >
      {[
        ["30", "30 days"],
        ["90", "90 days"],
        ["365", "12 months"],
      ].map(([id, label]) => {
        const on = range === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            onClick={() => setRange(id)}
            style={{
              minHeight: 36,
              padding: "0 14px",
              borderRadius: 9,
              border: 0,
              background: on ? "#262A31" : "transparent",
              color: on ? "#F2F4F5" : "#9AA1AB",
              fontSize: 13,
              fontWeight: on ? 600 : undefined,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  return (
    <HqPanel loading={loading} headerExtra={rangeControl} shellGap={24} showSample={!d.live} problemsCount={d.problemsCount}>
      <div style={{ maxWidth: 1240, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 6 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
            fontSize: "clamp(30px, 3.6vw, 44px)",
            lineHeight: 1.04,
            letterSpacing: "-1.2px",
            fontWeight: 700,
          }}
        >
          {d.headline}
        </h1>
        <span style={{ fontSize: 15, color: "#9AA1AB" }}>
          Internal only · how the business is doing, updated hourly
          {api ? "" : " · loading…"}
        </span>
      </div>

      <section
        aria-label="Key numbers"
        style={{
          maxWidth: 1240,
          width: "100%",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12,
        }}
      >
        {d.kpis.map((k) => (
          <div
            key={k.label}
            style={{
              borderRadius: 18,
              padding: "16px 18px",
              background: "#101215",
              border: "1px solid #1A1D22",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 13, color: "#9AA1AB" }}>{k.label}</span>
            <span
              style={{
                fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: "-1px",
                lineHeight: 1,
              }}
            >
              {k.value}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: k.color }}>{k.sub}</span>
          </div>
        ))}
      </section>

      <div
        style={{
          maxWidth: 1240,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          alignItems: "stretch",
        }}
      >
        <section
          aria-labelledby="mrr-h"
          style={{
            flex: "999 1 560px",
            minWidth: 0,
            borderRadius: 22,
            background: "#101215",
            border: "1px solid #1A1D22",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <h2 id="mrr-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
              Monthly recurring revenue by plan
            </h2>
            <span style={{ display: "inline-flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "#9AA1AB" }}>
              {d.legend.map((l) => (
                <span key={l.name} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
                  {l.name}
                </span>
              ))}
            </span>
          </div>
          <svg viewBox="0 0 720 280" role="img" aria-label={d.mrrAria} style={{ width: "100%", height: "auto", display: "block" }}>
            {d.mgrid.map((g) => (
              <g key={g.label}>
                <line x1="58" x2="712" y1={g.y} y2={g.y} stroke="#1A1D22" />
                <text x="50" y={g.ty} textAnchor="end" fontSize="12" fill="#7D848E" fontFamily="Geist Mono, monospace">
                  {g.label}
                </text>
              </g>
            ))}
            {d.bars.map((b) => (
              <g key={b.label}>
                <g
                  style={{
                    transformOrigin: "0 250px",
                    transformBox: "view-box",
                    animation: "sfy-grow .8s cubic-bezier(.2,.8,.2,1) both",
                  }}
                >
                  <rect x={b.x} y={b.y4} width={b.w} height={b.h4} fill="#9FE7F5" />
                  <rect x={b.x} y={b.y3} width={b.w} height={b.h3} fill="#D5F879" />
                  <rect x={b.x} y={b.y2} width={b.w} height={b.h2} fill="#8A93A3" />
                  <rect x={b.x} y={b.y1} width={b.w} height={b.h1} rx="3" fill="#4A5160" />
                </g>
                <text x={b.cx} y="270" textAnchor="middle" fontSize="12" fill="#7D848E" fontFamily="Geist Mono, monospace">
                  {b.label}
                </text>
              </g>
            ))}
            <text x={d.last.cx} y={d.last.ty} textAnchor="middle" fontSize="13" fontWeight="600" fill="#F2F4F5" fontFamily="Geist, sans-serif">
              {d.last.value}
            </text>
            <line x1="58" x2="712" y1="250" y2="250" stroke="#262A31" />
          </svg>
        </section>

        <section
          aria-labelledby="fun-h"
          style={{
            flex: "1 1 340px",
            minWidth: 0,
            borderRadius: 22,
            background: "#101215",
            border: "1px solid #1A1D22",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <h2 id="fun-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            Sign-up funnel · {d.rangeLabel}
          </h2>
          {d.funnel.map((f) => (
            <div key={f.name} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
                <span>{f.name}</span>
                <span style={{ fontFamily: "'Geist Mono', monospace", color: "#D7DADE" }}>{f.value}</span>
              </div>
              <div style={{ height: 14, borderRadius: 7, background: "#1A1D22", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: f.pct,
                    borderRadius: 7,
                    background: f.color,
                    boxShadow: `0 0 10px ${f.color}`,
                    transition: "width .5s ease",
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: "#7D848E" }}>{f.step}</span>
            </div>
          ))}
        </section>
      </div>

      <div
        style={{
          maxWidth: 1240,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          alignItems: "stretch",
        }}
      >
        <section
          aria-labelledby="ph-h"
          style={{
            flex: "1 1 340px",
            minWidth: 0,
            borderRadius: 22,
            background: "#101215",
            border: "1px solid #1A1D22",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <h2 id="ph-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            Product health · {d.rangeLabel}
          </h2>
          {d.health.map((h) => (
            <div
              key={h.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 14,
                background: "#0A0B0D",
                border: "1px solid #1A1D22",
              }}
            >
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 14 }}>{h.label}</span>
                <span style={{ fontSize: 12, color: "#7D848E" }}>{h.sub}</span>
              </span>
              <span
                style={{
                  fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: h.color,
                }}
              >
                {h.value}
              </span>
            </div>
          ))}
        </section>

        <section
          aria-labelledby="mix-h"
          style={{
            flex: "1 1 340px",
            minWidth: 0,
            borderRadius: 22,
            background: "#101215",
            border: "1px solid #1A1D22",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <h2 id="mix-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            Plan mix · this month
          </h2>
          <div
            aria-hidden="true"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 80px 100px 60px",
              gap: 8,
              fontFamily: "'Geist Mono', monospace",
              fontSize: 11,
              color: "#7D848E",
              padding: "0 4px",
            }}
          >
            <span>PLAN</span>
            <span style={{ textAlign: "right" }}>CUSTOMERS</span>
            <span style={{ textAlign: "right" }}>MRR</span>
            <span style={{ textAlign: "right" }}>SHARE</span>
          </div>
          {d.mix.map((m) => (
            <div
              key={m.name}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 80px 100px 60px",
                gap: 8,
                alignItems: "center",
                padding: "10px 4px",
                borderTop: "1px solid #16181C",
                fontSize: 14,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: m.color }} />
                {m.name}
              </span>
              <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace" }}>{m.count}</span>
              <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace" }}>{m.mrr}</span>
              <span style={{ textAlign: "right", color: "#9AA1AB" }}>{m.share}</span>
            </div>
          ))}
          <span style={{ fontSize: 12, color: "#7D848E" }}>Enterprise shown at an average of $1,250 / month per contract.</span>
        </section>

        <section
          aria-labelledby="aff-h"
          style={{
            flex: "1 1 340px",
            minWidth: 0,
            borderRadius: 22,
            background: "#101215",
            border: "1px solid #1A1D22",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <h2 id="aff-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            Top affiliates
          </h2>
          {d.affiliates.map((a) => (
            <div
              key={a.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 4px",
                borderTop: "1px solid #16181C",
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  flex: "none",
                  borderRadius: "50%",
                  background: "#262A31",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {a.initials}
              </span>
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 14 }}>{a.name}</span>
                <span style={{ fontSize: 12, color: "#7D848E" }}>{a.sub}</span>
              </span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 13, color: "#D5F879" }}>{a.owed}</span>
            </div>
          ))}
          <span style={{ fontSize: 12, color: "#7D848E" }}>
            Commission owed this month, paid on the 15th.{" "}
            <Link href="/admin/hq/partners" style={{ color: "#D5F879", textDecoration: "none" }}>
              Review the payout run
            </Link>
          </span>
        </section>
      </div>
    </HqPanel>
  );
}
