"use client";

import { useEffect, useState } from "react";
import InvestorShell from "@/components/investors/InvestorShell";
import { getInvestorStake, sendInvestorMessage } from "@/lib/investorApi";

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9FE7F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </svg>
  );
}

export default function InvestorStake() {
  const [d, setD] = useState(null);
  const [toast, setToast] = useState("");
  const [msgOpen, setMsgOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getInvestorStake().then((res) => {
      if (!cancelled && res.ok) setD(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const send = async () => {
    setBusy(true);
    const res = await sendInvestorMessage(note);
    setBusy(false);
    if (res.ok) {
      setToast(res.data?.message || "Sent.");
      setMsgOpen(false);
      setNote("");
    } else {
      setToast(typeof res.data?.detail === "string" ? res.data.detail : "Could not send.");
    }
  };

  const data = d || {};

  return (
    <InvestorShell showSample={!data.live} minHeight={1300}>
      {toast ? (
        <div style={{ maxWidth: 1120, width: "100%", margin: "0 auto", fontSize: 13, color: "#3DDC84" }} role="status">
          {toast}
        </div>
      ) : null}

      <section style={{ maxWidth: 1120, width: "100%", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "stretch" }}>
        <div style={{ flex: "999 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: 10, justifyContent: "center" }}>
          <span style={{ fontSize: 15, color: "#9AA1AB" }}>{data.greeting || "Hi."}</span>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
              fontSize: "clamp(32px, 3.8vw, 48px)",
              lineHeight: 1.04,
              letterSpacing: "-1.4px",
              fontWeight: 700,
            }}
          >
            {data.headline || "Your stake"}
          </h1>
          <span style={{ fontSize: 15, color: "#D7DADE", lineHeight: 1.5 }}>{data.sharesNote}</span>
        </div>
        <div
          style={{
            flex: "1 1 300px",
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
          <span style={{ fontSize: 13, color: "#9AA1AB" }}>Dividend status</span>
          <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 26, fontWeight: 700, color: data.dividendColor || "#3DDC84" }}>
            {data.dividendStatus}
          </span>
          <span style={{ fontSize: 14, color: "#D7DADE", lineHeight: 1.5 }}>
            {(data.dividendDetail || "").split(/(\$\d[\d,]*(?:\.\d+)?)/).map((part, i) =>
              part.startsWith("$") ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>,
            )}
          </span>
        </div>
      </section>

      <section
        aria-labelledby="rules-h"
        style={{
          maxWidth: 1120,
          width: "100%",
          boxSizing: "border-box",
          margin: "0 auto",
          borderRadius: 22,
          background: "#101215",
          border: "1px solid #1A1D22",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <h2 id="rules-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
          The dividend rules in your agreement
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {(data.rules || []).map((r) => (
            <div
              key={r.title}
              style={{
                borderRadius: 16,
                background: "#0A0B0D",
                border: "1px solid #1A1D22",
                padding: 16,
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <span style={{ flex: "none", width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(61,220,132,.12)" }}>
                <Check />
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{r.title}</span>
                <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.45 }}>{r.detail}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: 1120, width: "100%", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
        <section aria-labelledby="co-h" style={{ flex: "999 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ borderRadius: 22, background: "#101215", border: "1px solid #1A1D22", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <h2 id="co-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
                {data.quarter?.label || "How the company did"}
              </h2>
              <span style={{ fontSize: 13, color: "#9AA1AB" }}>{data.quarter?.from}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
              {(data.quarter?.kpis || []).map((k) => (
                <div key={k.label} style={{ borderRadius: 14, background: "#0A0B0D", border: "1px solid #1A1D22", padding: 14, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 12, color: "#9AA1AB" }}>{k.label}</span>
                  <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: "-0.6px" }}>{k.value}</span>
                  <span style={{ fontSize: 12, color: k.tone || "#9AA1AB" }}>{k.sub}</span>
                </div>
              ))}
            </div>
            <div style={{ borderRadius: 14, background: "#0A0B0D", border: "1px solid #1A1D22", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 12, color: "#9AA1AB" }}>{data.quarter?.noteTitle}</span>
              <span style={{ fontSize: 15, lineHeight: 1.5 }}>{data.quarter?.note}</span>
            </div>
          </div>

          <div style={{ borderRadius: 22, background: "#101215", border: "1px solid #1A1D22", padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 600 }}>Your dividends</h2>
            <div
              aria-hidden="true"
              style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 100px 120px 100px", gap: 10, fontFamily: "'Geist Mono', monospace", fontSize: 11, color: "#7D848E" }}
            >
              <span>QUARTER</span>
              <span style={{ textAlign: "right" }}>YOUR SHARE</span>
              <span style={{ textAlign: "right" }}>TAX WITHHELD</span>
              <span style={{ textAlign: "right" }}>YOU RECEIVE</span>
            </div>
            {(data.dividends || []).map((row) => (
              <div
                key={row.quarter}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) 100px 120px 100px",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px 0",
                  borderTop: "1px solid #16181C",
                  fontSize: 14,
                }}
              >
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span>{row.quarter}</span>
                  <span style={{ fontSize: 12, color: "#9AA1AB" }}>{row.meta}</span>
                </span>
                <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace" }}>{row.share}</span>
                <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace", color: "#FFC53D" }}>{row.withheld}</span>
                <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace", color: "#3DDC84" }}>{row.receive}</span>
              </div>
            ))}
            <span style={{ fontSize: 12, color: "#7D848E", lineHeight: 1.5 }}>{data.dividendsNote}</span>
          </div>
        </section>

        <aside style={{ flex: "1 1 300px", minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", padding: 18, display: "flex", flexDirection: "column", gap: 4 }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600 }}>Your documents</h2>
            {(data.documents || []).map((doc) => (
              <a
                key={doc.title}
                href={doc.href || "#"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  minHeight: 44,
                  borderTop: "1px solid #16181C",
                  color: "#F2F4F5",
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span>{doc.title}</span>
                  <span style={{ fontSize: 12, color: "#7D848E" }}>{doc.meta}</span>
                </span>
                <DownloadIcon />
              </a>
            ))}
          </div>
          <div style={{ borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Tax details</h2>
            <span style={{ fontSize: 14, color: "#D7DADE", lineHeight: 1.5 }}>{data.taxNote}</span>
          </div>
          <div style={{ borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{data.contact?.title || "Questions?"}</h2>
            <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>{data.contact?.body}</span>
            {!msgOpen ? (
              <button
                type="button"
                onClick={() => setMsgOpen(true)}
                style={{
                  alignSelf: "flex-start",
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 44,
                  padding: "0 16px",
                  borderRadius: 12,
                  border: "1px solid #262A31",
                  color: "#F2F4F5",
                  background: "transparent",
                  fontSize: 14,
                }}
              >
                {data.contact?.cta || "Send a message"}
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder="Write to Aadle…"
                  style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, border: "1px solid #262A31", background: "#0A0B0D", color: "#F2F4F5", font: "inherit", fontSize: 14, padding: 12 }}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={send}
                  style={{ minHeight: 44, borderRadius: 12, border: 0, background: "#9FE7F5", color: "#0A0B0D", fontWeight: 600, fontSize: 14 }}
                >
                  {busy ? "Sending…" : "Send"}
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </InvestorShell>
  );
}
