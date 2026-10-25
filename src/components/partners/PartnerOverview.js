'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PartnerShell, { usePartnerCtx } from "@/components/partners/PartnerShell";
import { getPartnerOverview } from "@/lib/partnerApi";
import { buildPartnerOverviewModel } from "@/lib/partnerOverviewModel";

function PartnerOverviewBody() {
  const { profile } = usePartnerCtx();
  const [range, setRange] = useState("all");
  const [metric, setMetric] = useState("signups");
  const [dest, setDest] = useState("home");
  const [tag, setTag] = useState("");
  const [copied, setCopied] = useState(false);
  const [api, setApi] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPartnerOverview().then((res) => {
      if (!cancelled && res.ok) setApi(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const state = useMemo(() => ({ range, metric, dest, tag }), [range, metric, dest, tag]);
  const data = useMemo(() => {
    const payload = api || {
      tier: profile?.tier || "standard",
      rate: profile?.rate || 0.3,
      handle: profile?.handle || "partner",
      since: profile?.since || "this year",
      qualified: profile?.qualified || 0,
      clicks: [],
      signups: [],
      payingSeries: [],
      mix: { Solo: 0, Pro: 0, Premium: 0 },
      payouts: [],
      hold: 0,
      refs: [],
      refSummary: "0 sign-ups · 0 paying",
      methodNote: "paypal",
    };
    const model = buildPartnerOverviewModel(payload, state);
    const method = payload.methodNote || "paypal";
    return {
      ...model,
      chartTitle: ({ clicks: "Link clicks", signups: "Sign-ups", paying: "Became paying" }[metric]) + " per week",
      payMethodLine:
        method === "paypal" ? "Paid by PayPal" : method === "wise" ? "Paid by Wise" : "Payout method on file",
    };
  }, [api, state, profile, metric]);

  const copy = () => {
    try {
      navigator.clipboard.writeText(data.link);
    } catch {
      /* ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const ranges = [
    ["30", "Last 30 days"],
    ["90", "Last 90 days"],
    ["all", "All time"],
  ];
  const dests = [
    ["home", "Home page"],
    ["pricing", "Pricing"],
    ["agencies", "For agencies"],
  ];

  return (
    <>
      <div
        style={{
          maxWidth: 1180,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
              fontSize: "clamp(30px, 3.8vw, 48px)",
              lineHeight: 1.02,
              letterSpacing: "-1.4px",
              fontWeight: 700,
            }}
          >
            Your next payout is <span style={{ color: "#D5F879" }}>{data.nextPayout}</span> on {data.payoutOn}.
          </h1>
          <span style={{ fontSize: 15, color: "#9AA1AB" }}>{data.earnedLine}</span>
        </div>
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
          {ranges.map(([id, label]) =>
            range === id ? (
              <button
                key={id}
                type="button"
                aria-pressed
                onClick={() => setRange(id)}
                style={{
                  minHeight: 36,
                  padding: "0 14px",
                  borderRadius: 9,
                  border: 0,
                  background: "#262A31",
                  color: "#F2F4F5",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {label}
              </button>
            ) : (
              <button
                key={id}
                type="button"
                aria-pressed={false}
                onClick={() => setRange(id)}
                style={{
                  minHeight: 36,
                  padding: "0 14px",
                  borderRadius: 9,
                  border: 0,
                  background: "transparent",
                  color: "#9AA1AB",
                  fontSize: 13,
                }}
              >
                {label}
              </button>
            ),
          )}
        </div>
      </div>

      <div
        style={{
          maxWidth: 1180,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        <section
          aria-labelledby="rate-h"
          style={{
            flex: "999 1 520px",
            minWidth: 0,
            borderRadius: 22,
            background: "#101215",
            border: `1px solid ${data.rate.border}`,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h2 id="rate-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
                {data.rate.title}
              </h2>
              <span style={{ fontSize: 13, color: "#9AA1AB" }}>{data.rate.sub}</span>
            </span>
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: 8 }}>
              <span
                style={{
                  fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                  fontSize: 40,
                  fontWeight: 800,
                  letterSpacing: "-1px",
                  color: "#D5F879",
                  lineHeight: 1,
                }}
              >
                {data.rate.now}
              </span>
              {data.rate.hasNext ? <span style={{ fontSize: 15, color: "#9AA1AB" }}>→ {data.rate.next}</span> : null}
            </span>
          </div>
          {data.rate.hasNext ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                role="img"
                aria-label={data.rate.aria}
                style={{ display: "grid", gridTemplateColumns: "repeat(10, minmax(0, 1fr))", gap: 5 }}
              >
                {data.rate.dots.map((d, i) => (
                  <span
                    key={i}
                    style={{ height: 14, borderRadius: 4, background: d.bg, boxShadow: d.glow }}
                  />
                ))}
              </div>
              <span style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", fontSize: 14 }}>
                <span>
                  <b style={{ fontWeight: 600 }}>{data.rate.count}</b> qualified referrals in your current 6-month window
                </span>
                <span style={{ color: "#9AA1AB" }}>{data.rate.window}</span>
              </span>
              <span style={{ fontSize: 14, color: "#D5F879" }}>{data.rate.toGo}</span>
            </div>
          ) : null}
          <span style={{ fontSize: 12, color: "#7D848E", lineHeight: 1.5 }}>
            A qualified referral is a new customer who signed up through your link, paid for at least one month and passed the 30-day hold without a refund. Your own businesses and family{" "}
            {"don't"} count.
          </span>
        </section>

        <section
          aria-labelledby="bal-h"
          style={{
            flex: "1 1 320px",
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
          <h2 id="bal-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            Where your money is
          </h2>
          {data.balances.map((b) => (
            <div
              key={b.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderTop: "1px solid #16181C",
              }}
            >
              <span style={{ width: 9, height: 9, flex: "none", borderRadius: "50%", background: b.color }} />
              <span style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 14 }}>{b.label}</span>
                <span style={{ fontSize: 12, color: "#7D848E" }}>{b.sub}</span>
              </span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 14, color: b.valueColor }}>{b.value}</span>
            </div>
          ))}
          <Link href="/partners/earnings" style={{ fontSize: 13 }}>
            See every commission
          </Link>
        </section>
      </div>

      <section
        aria-label="Your numbers"
        style={{
          maxWidth: 1180,
          width: "100%",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        {data.kpis.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => {
              if (k.cursor === "pointer") setMetric(k.key);
            }}
            aria-pressed={k.pressed}
            style={{
              textAlign: "left",
              font: "inherit",
              color: "#F2F4F5",
              borderRadius: 18,
              padding: "16px 18px",
              background: k.bg,
              border: `1px solid ${k.border}`,
              boxShadow: k.glow,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              cursor: k.cursor,
            }}
          >
            <span style={{ fontSize: 13, color: "#9AA1AB" }}>{k.label}</span>
            <span
              style={{
                fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                fontSize: 32,
                fontWeight: 800,
                letterSpacing: "-1px",
                lineHeight: 1,
                color: k.valueColor,
              }}
            >
              {k.value}
            </span>
            <span style={{ fontSize: 12, color: "#7D848E" }}>{k.sub}</span>
          </button>
        ))}
      </section>

      <div
        style={{
          maxWidth: 1180,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          alignItems: "stretch",
        }}
      >
        <section
          aria-labelledby="chart-h"
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
          <h2 id="chart-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            {data.chartTitle}
          </h2>
          <svg viewBox="0 0 720 260" role="img" aria-label={data.chartTitle} style={{ width: "100%", height: "auto", display: "block" }}>
            {data.grid.map((g, i) => (
              <g key={i}>
                <line x1="44" x2="712" y1={g.y} y2={g.y} stroke="#1A1D22" />
                <text x="36" y={g.ty} textAnchor="end" fontSize="12" fill="#7D848E" fontFamily="Geist Mono, monospace">
                  {g.label}
                </text>
              </g>
            ))}
            {data.bars.map((b, i) => (
              <rect
                key={i}
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx="3"
                fill={b.color}
                style={{
                  transformOrigin: "0 230px",
                  transformBox: "view-box",
                  animation: "sfy-grow .6s cubic-bezier(.2,.8,.2,1) both",
                }}
              />
            ))}
            <line x1="44" x2="712" y1="230" y2="230" stroke="#262A31" />
            {data.xl.map((x, i) => (
              <text key={i} x={x.x} y="250" textAnchor="middle" fontSize="12" fill="#7D848E" fontFamily="Geist Mono, monospace">
                {x.label}
              </text>
            ))}
          </svg>
          <span style={{ fontSize: 12, color: "#7D848E" }}>Per week. Tap Link clicks, Sign-ups or Became paying above to switch.</span>
        </section>

        <section
          aria-labelledby="link-h"
          style={{
            flex: "1 1 340px",
            minWidth: 0,
            borderRadius: 22,
            background: "#101215",
            border: "1px solid rgba(213,248,121,.35)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <h2 id="link-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            Your referral link
          </h2>
          <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
            <span
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                minHeight: 46,
                borderRadius: 12,
                background: "#0A0B0D",
                border: "1px solid #262A31",
                fontFamily: "'Geist Mono', monospace",
                fontSize: 13,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {data.link}
            </span>
            <button
              type="button"
              onClick={copy}
              style={{
                flex: "none",
                minHeight: 46,
                padding: "0 16px",
                borderRadius: 12,
                border: 0,
                background: copied ? "#3DDC84" : "#D5F879",
                color: "#0A0B0D",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <span style={{ fontSize: 13, color: "#9AA1AB" }}>Send people to</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {dests.map(([id, label]) =>
              dest === id ? (
                <button
                  key={id}
                  type="button"
                  aria-pressed
                  onClick={() => {
                    setDest(id);
                    setCopied(false);
                  }}
                  style={{
                    minHeight: 34,
                    padding: "0 12px",
                    borderRadius: 999,
                    border: "1px solid #D5F879",
                    background: "rgba(213,248,121,.1)",
                    color: "#F2F4F5",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {label}
                </button>
              ) : (
                <button
                  key={id}
                  type="button"
                  aria-pressed={false}
                  onClick={() => {
                    setDest(id);
                    setCopied(false);
                  }}
                  style={{
                    minHeight: 34,
                    padding: "0 12px",
                    borderRadius: 999,
                    border: "1px solid #262A31",
                    background: "transparent",
                    color: "#D7DADE",
                    fontSize: 13,
                  }}
                >
                  {label}
                </button>
              ),
            )}
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
            Campaign tag (optional, to see which post worked)
            <input
              type="text"
              placeholder="e.g. youtube-october"
              value={tag}
              onChange={(e) => {
                setTag(e.target.value);
                setCopied(false);
              }}
              style={{
                minHeight: 44,
                padding: "0 12px",
                borderRadius: 12,
                border: "1px solid #262A31",
                background: "#0A0B0D",
                color: "#F2F4F5",
                font: "inherit",
                fontSize: 14,
              }}
            />
          </label>
          <div
            style={{
              borderRadius: 14,
              background: "#0A0B0D",
              border: "1px solid #1A1D22",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontSize: 13,
              color: "#9AA1AB",
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: "#F2F4F5", fontWeight: 600 }}>Remember to say you earn a commission</span>
            <span>
              A short line like {'"I earn a commission if you sign up"'} is enough.{" "}
              <Link href="/partners/terms">Ready-made wording</Link>
            </span>
          </div>
        </section>
      </div>

      <div
        style={{
          maxWidth: 1180,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        <section aria-labelledby="ref-h" style={{ flex: "999 1 560px", minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <h2 id="ref-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
              People you referred
            </h2>
            <span style={{ fontSize: 13, color: "#9AA1AB" }}>{data.refSummary}</span>
          </div>
          <div style={{ borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", overflowX: "auto" }}>
            <div style={{ minWidth: 600 }}>
              <div
                aria-hidden
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px minmax(0, 1.6fr) 100px 110px 110px",
                  gap: 10,
                  padding: "12px 18px",
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 11,
                  color: "#7D848E",
                  borderBottom: "1px solid #1A1D22",
                }}
              >
                <span>JOINED</span>
                <span>CUSTOMER</span>
                <span>PLAN</span>
                <span>STATUS</span>
                <span style={{ textAlign: "right" }}>YOU EARN / MO</span>
              </div>
              {data.refs.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "90px minmax(0, 1.6fr) 100px 110px 110px",
                    gap: 10,
                    alignItems: "center",
                    padding: "12px 18px",
                    borderBottom: "1px solid #16181C",
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontSize: 13, color: "#9AA1AB" }}>{r.date}</span>
                  <span style={{ minWidth: 0 }}>{r.who}</span>
                  <span style={{ fontSize: 13 }}>{r.plan}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: r.color }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.color }} />
                    {r.status}
                  </span>
                  <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace", fontSize: 13, color: r.earnColor }}>{r.earn}</span>
                </div>
              ))}
            </div>
          </div>
          <span style={{ fontSize: 12, color: "#7D848E" }}>Customer names stay private; you see their business type and city only.</span>
        </section>

        <section aria-labelledby="pay-h" style={{ flex: "1 1 340px", minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 id="pay-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            Payouts
          </h2>
          <div style={{ borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", padding: "6px 4px" }}>
            {data.payouts.map((p, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderBottom: "1px solid #16181C",
                }}
              >
                <span style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 14 }}>{p.date}</span>
                  <span style={{ fontSize: 12, color: "#7D848E" }}>{p.method}</span>
                </span>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 14 }}>{p.amount}</span>
                <span
                  style={{
                    minWidth: 76,
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "4px 8px",
                    borderRadius: 999,
                    color: p.color,
                    background: p.bg,
                  }}
                >
                  {p.status}
                </span>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "12px 14px",
                fontSize: 13,
                color: "#9AA1AB",
              }}
            >
              <span>{data.payMethodLine}</span>
              <Link href="/partners/payout" style={{ fontSize: 13 }}>
                Change
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default function PartnerOverview() {
  return (
    <PartnerShell active="overview" minHeight={1500} showSignOut>
      <PartnerOverviewBody />
    </PartnerShell>
  );
}
