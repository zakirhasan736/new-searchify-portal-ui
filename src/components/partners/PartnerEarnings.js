'use client';

import { useEffect, useMemo, useState } from "react";
import PartnerShell from "@/components/partners/PartnerShell";
import { getPartnerEarnings } from "@/lib/partnerApi";
import { buildPartnerEarningsModel } from "@/lib/partnerEarningsModel";

function PartnerEarningsBody() {
  const [filter, setFilter] = useState("all");
  const [stmt, setStmt] = useState("");
  const [api, setApi] = useState(null);
  const thisYear = new Date().getFullYear();

  // Real exports built from this partner's commission rows: [date, customer, plan, status, note, clears, amount].
  const exportRows = () =>
    (api?.rows || []).map((r) => ({
      date: r[0] || "",
      customer: r[1] || "",
      plan: r[2] || "",
      status: r[3] || "",
      note: r[4] || "",
      amount: r.length > 6 && r[6] != null ? Number(r[6]).toFixed(2) : "",
    }));

  const downloadCsv = () => {
    const rows = exportRows();
    if (!rows.length) {
      setStmt("No commissions yet, so there is nothing to download.");
      return;
    }
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [["Date", "Customer", "Plan", "Status", "Note", "Commission (USD)"], ...rows.map((r) => [r.date, r.customer, r.plan, r.status, r.note, r.amount])]
      .map((line) => line.map(esc).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `searchify-commissions-${thisYear}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    setStmt(`Downloaded ${rows.length} commission${rows.length === 1 ? "" : "s"} as CSV.`);
  };

  const printStatement = () => {
    const rows = exportRows();
    const t = api?.totals || {};
    const win = window.open("", "_blank");
    if (!win) {
      setStmt("Allow pop-ups for this site to open the statement.");
      return;
    }
    const cell = (v) => String(v).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Searchify partner statement ${thisYear}</title>
      <style>body{font-family:Arial,sans-serif;color:#111;margin:32px}h1{font-size:20px}table{border-collapse:collapse;width:100%;font-size:13px}
      th,td{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left}td.n{text-align:right}</style></head><body>
      <h1>Searchify partner earnings statement · ${thisYear}</h1>
      <p>Paid out: $${Number(t.paid || 0).toFixed(2)} · Cleared: $${Number(t.cleared || 0).toFixed(2)} · In hold: $${Number(t.hold || 0).toFixed(2)} · Reversed: $${Math.abs(Number(t.rev || 0)).toFixed(2)}</p>
      <table><thead><tr><th>Date</th><th>Customer</th><th>Plan</th><th>Status</th><th>Note</th><th>Commission</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td>${cell(r.date)}</td><td>${cell(r.customer)}</td><td>${cell(r.plan)}</td><td>${cell(r.status)}</td><td>${cell(r.note)}</td><td class="n">${r.amount ? `$${r.amount}` : ""}</td></tr>`).join("") || '<tr><td colspan="6">No commissions yet.</td></tr>'}
      </tbody></table></body></html>`);
    win.document.close();
    win.focus();
    win.print();
    setStmt("Statement opened. Choose Save as PDF in the print window.");
  };

  useEffect(() => {
    let cancelled = false;
    getPartnerEarnings().then((res) => {
      if (!cancelled && res.ok) setApi(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { cleared, hold, totals, minNote, rows, taxNote } = useMemo(
    () =>
      buildPartnerEarningsModel(
        api || { rate: 0.3, since: "this year", tier: "standard", rows: [], totals: { cleared: 0, hold: 0, rev: 0, paid: 0 } },
        filter,
      ),
    [api, filter],
  );

  const filters = [
    ["all", "All"],
    ["hold", "In hold"],
    ["cleared", "Cleared"],
    ["reversed", "Reversed"],
    ["paid", "Paid"],
  ];

  return (
    <>
      <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 6 }}>
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
          <span style={{ color: "#D5F879" }}>{cleared}</span> cleared. {hold} still in the 30-day hold.
        </h1>
        <span style={{ fontSize: 15, color: "#9AA1AB" }}>
          Each commission waits 30 days in case the customer asks for a refund, then it clears and goes into the next payout on the 15th.
        </span>
      </div>

      <section
        aria-label="Totals"
        style={{
          maxWidth: 1180,
          width: "100%",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {totals.map((k) => (
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
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#9AA1AB" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: k.dot }} />
              {k.label}
            </span>
            <span
              style={{
                fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: "-1px",
                lineHeight: 1,
                color: k.color,
              }}
            >
              {k.value}
            </span>
            <span style={{ fontSize: 12, color: "#7D848E" }}>{k.sub}</span>
          </div>
        ))}
      </section>

      <section
        aria-labelledby="min-h"
        style={{
          maxWidth: 1180,
          width: "100%",
          boxSizing: "border-box",
          margin: "0 auto",
          borderRadius: 18,
          background: "#101215",
          border: "1px solid #1A1D22",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <span style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", fontSize: 14 }}>
          <span id="min-h" style={{ fontWeight: 600 }}>
            $50 minimum payout
          </span>
          <span style={{ color: "#3DDC84" }}>{minNote}</span>
        </span>
        <div style={{ height: 10, borderRadius: 5, background: "#1A1D22", overflow: "hidden" }}>
          <div style={{ height: "100%", width: "100%", borderRadius: 5, background: "#3DDC84" }} />
        </div>
        <span style={{ fontSize: 12, color: "#7D848E" }}>If a month comes in under $50, it rolls into the next one. Nothing is lost.</span>
      </section>

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
        <section aria-labelledby="led-h" style={{ flex: "999 1 640px", minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <h2 id="led-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
              Every commission
            </h2>
            <div role="group" aria-label="Filter" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {filters.map(([id, label]) =>
                filter === id ? (
                  <button
                    key={id}
                    type="button"
                    aria-pressed
                    onClick={() => setFilter(id)}
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
                    onClick={() => setFilter(id)}
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
          </div>
          <div style={{ borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", overflowX: "auto" }}>
            <div style={{ minWidth: 720 }}>
              <div
                aria-hidden
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px minmax(0, 1.6fr) 80px 90px 60px 100px 150px",
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
                <span style={{ textAlign: "right" }}>RATE</span>
                <span style={{ textAlign: "right" }}>YOU EARN</span>
                <span>STATUS</span>
              </div>
              {rows.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px minmax(0, 1.6fr) 80px 90px 60px 100px 150px",
                    gap: 10,
                    alignItems: "center",
                    padding: "11px 18px",
                    borderBottom: "1px solid #16181C",
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontSize: 13, color: "#9AA1AB" }}>{r.date}</span>
                  <span style={{ minWidth: 0 }}>{r.who}</span>
                  <span style={{ fontSize: 13 }}>{r.plan}</span>
                  <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace", fontSize: 13, color: "#9AA1AB" }}>{r.pay}</span>
                  <span style={{ textAlign: "right", fontSize: 13, color: "#9AA1AB" }}>{r.rate}</span>
                  <span
                    style={{
                      textAlign: "right",
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: 13,
                      color: r.earnColor,
                      textDecoration: r.strike,
                    }}
                  >
                    {r.earn}
                  </span>
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: r.color }}>{r.status}</span>
                    <span style={{ fontSize: 11, color: "#7D848E" }}>{r.note}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside aria-label="Statements" style={{ flex: "1 1 300px", minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              borderRadius: 20,
              background: "#101215",
              border: "1px solid #1A1D22",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Earnings statement for your taxes</h2>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
              Year
              <select
                style={{
                  minHeight: 42,
                  padding: "0 10px",
                  borderRadius: 10,
                  border: "1px solid #262A31",
                  background: "#0A0B0D",
                  color: "#F2F4F5",
                  font: "inherit",
                  fontSize: 14,
                }}
              >
                <option value={String(thisYear)}>{thisYear} (so far)</option>
              </select>
            </label>
            <button
              type="button"
              onClick={printStatement}
              style={{
                minHeight: 44,
                borderRadius: 12,
                border: 0,
                background: "#D5F879",
                color: "#0A0B0D",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Download statement (PDF)
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              style={{
                minHeight: 44,
                borderRadius: 12,
                border: "1px solid #262A31",
                background: "transparent",
                color: "#F2F4F5",
                fontSize: 14,
              }}
            >
              Download every commission (CSV)
            </button>
            {stmt ? (
              <span role="status" style={{ fontSize: 13, color: "#3DDC84" }}>
                {stmt}
              </span>
            ) : null}
            <span style={{ fontSize: 12, color: "#7D848E", lineHeight: 1.5 }}>{taxNote}</span>
          </div>
          <div
            style={{
              borderRadius: 20,
              background: "#101215",
              border: "1px solid #1A1D22",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Why a commission was reversed</h2>
            <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.5 }}>
              When a customer gets a refund or their bank reverses a charge, the commission on that payment comes back out. If it was already paid, it{"'s"} taken from your next payout.
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function PartnerEarnings() {
  return (
    <PartnerShell active="earnings" minHeight={1250} showSignOut>
      <PartnerEarningsBody />
    </PartnerShell>
  );
}
