"use client";

import { useEffect, useState } from "react";
import InvestorShell from "@/components/investors/InvestorShell";
import { getInvestorEarnings } from "@/lib/investorApi";

export default function InvestorEarnings() {
  const [d, setD] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getInvestorEarnings().then((res) => {
      if (!cancelled && res.ok) setD(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const data = d || {};
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(data.link || "");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <InvestorShell showSample={!data.live} minHeight={1400}>
      <div style={{ maxWidth: 1120, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 6 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
            fontSize: "clamp(30px, 3.6vw, 44px)",
            lineHeight: 1.04,
            letterSpacing: "-1.2px",
            fontWeight: 700,
          }}
          dangerouslySetInnerHTML={{ __html: data.headlineHtml || "Referral earnings" }}
        />
        <span style={{ fontSize: 15, color: "#9AA1AB" }}>{data.sub}</span>
      </div>

      <section aria-label="Totals" style={{ maxWidth: 1120, width: "100%", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
        {(data.kpis || []).map((k) => (
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
                color: k.color || "#F2F4F5",
              }}
            >
              {k.value}
            </span>
            <span style={{ fontSize: 12, color: "#7D848E" }}>{k.sub}</span>
          </div>
        ))}
      </section>

      <div style={{ maxWidth: 1120, width: "100%", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "stretch" }}>
        <section
          aria-labelledby="rate-h"
          style={{
            flex: "1 1 340px",
            minWidth: 0,
            borderRadius: 22,
            background: "#101215",
            border: "1px solid rgba(159,231,245,.35)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <h2 id="rate-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            Commission rate
          </h2>
          <span style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 52, fontWeight: 800, letterSpacing: "-2px", color: "#9FE7F5" }}>
              {data.rate ?? 35}%
            </span>
            <span style={{ fontSize: 14, color: "#9AA1AB" }}>{data.rateBlurb}</span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: "#0A0B0D", border: "1px solid #1A1D22" }}>
            <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-1px" }}>{data.managedRate ?? 30}%</span>
            <span style={{ fontSize: 13, color: "#D7DADE", lineHeight: 1.45 }}>{data.managedBlurb}</span>
          </div>
          <span style={{ fontSize: 13, color: "#D7DADE" }}>{data.rateNote}</span>
        </section>

        <section
          aria-labelledby="link-h"
          style={{
            flex: "999 1 520px",
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
          <h2 id="link-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            Your referral link
          </h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                flex: "1 1 260px",
                minHeight: 48,
                display: "flex",
                alignItems: "center",
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid #262A31",
                background: "#0A0B0D",
                fontFamily: "'Geist Mono', monospace",
                fontSize: 14,
              }}
            >
              {data.link || "…"}
            </span>
            <button
              type="button"
              onClick={copy}
              style={{ minHeight: 48, padding: "0 18px", borderRadius: 12, border: 0, background: "#9FE7F5", color: "#0A0B0D", fontSize: 14, fontWeight: 600 }}
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
            {(data.linkStats || []).map((s) => (
              <div key={s.label} style={{ borderRadius: 14, background: "#0A0B0D", border: "1px solid #1A1D22", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 12, color: "#9AA1AB" }}>{s.label}</span>
                <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 24, fontWeight: 800 }}>{s.value}</span>
                <span style={{ fontSize: 11, color: "#7D848E" }}>{s.sub}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div style={{ maxWidth: 1120, width: "100%", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
        <section aria-labelledby="led-h" style={{ flex: "999 1 600px", minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 id="led-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            Every commission
          </h2>
          <div style={{ borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", overflowX: "auto" }}>
            <div style={{ minWidth: 640 }}>
              <div
                aria-hidden="true"
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px minmax(0, 1.5fr) 70px 80px 90px 140px",
                  gap: 10,
                  padding: "12px 18px",
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 11,
                  color: "#7D848E",
                  borderBottom: "1px solid #1A1D22",
                }}
              >
                <span>DATE</span>
                <span>CUSTOMER</span>
                <span>PLAN</span>
                <span style={{ textAlign: "right" }}>PAYMENT</span>
                <span style={{ textAlign: "right" }}>YOU EARN</span>
                <span>STATUS</span>
              </div>
              {(data.ledger || []).length === 0 ? (
                <p style={{ margin: 0, padding: 18, fontSize: 14, color: "#9AA1AB" }}>No commissions yet. Share your referral link to get started.</p>
              ) : (
                data.ledger.map((row, i) => (
                  <div
                    key={`${row.date}-${row.customer}-${i}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "70px minmax(0, 1.5fr) 70px 80px 90px 140px",
                      gap: 10,
                      alignItems: "center",
                      padding: "11px 18px",
                      borderBottom: "1px solid #16181C",
                      fontSize: 14,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "#9AA1AB" }}>{row.date}</span>
                    <span>{row.customer}</span>
                    <span style={{ fontSize: 13 }}>{row.plan}</span>
                    <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace", fontSize: 13, color: "#9AA1AB" }}>{row.payment}</span>
                    <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace", fontSize: 13, color: row.earnColor || "#9FE7F5" }}>{row.earn}</span>
                    <span style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: row.statusColor }}>{row.status}</span>
                      <span style={{ fontSize: 11, color: "#7D848E" }}>{row.statusMeta}</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          <span style={{ fontSize: 12, color: "#7D848E", lineHeight: 1.5 }}>{data.ledgerNote}</span>
        </section>
      </div>
    </InvestorShell>
  );
}
