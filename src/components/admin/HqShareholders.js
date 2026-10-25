"use client";

import { useEffect, useMemo, useState } from "react";
import HqPanel, { useFirstLoad } from "@/components/admin/HqPanel";
import { getHqShareholders, saveHqShareholders } from "@/lib/hqApi";
import Modal from "@/components/account/Modal";

// Cap table colours by position (the owners themselves are stored in HQ, not in the code).
const HOLDER_COLORS = ["#D5F879", "#4DA3FF", "#3DDC84", "#FFC53D", "#B48CFF", "#FF8A80"];

const money = (v) => (v < 0 ? "−$" : "$") + Math.abs(Math.round(v)).toLocaleString("en-US");
const cents = (v) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function HqShareholders() {
  const [loading, firstLoad] = useFirstLoad();
  const [sc, setSc] = useState("actual");
  const [amount, setAmount] = useState(6000);
  const [solvent, setSolvent] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [qu, setQu] = useState("none");
  const [hw, setHw] = useState([]);
  const [hwInput, setHwInput] = useState("1000");
  const [holders, setHolders] = useState([]);
  const [report, setReport] = useState(null);
  const [scenarios, setScenarios] = useState(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    firstLoad(getHqShareholders()).then((res) => {
      if (cancelled || !res.ok) return;
      const d = res.data || {};
      if (Array.isArray(d.holders)) setHolders(d.holders);
      if (Array.isArray(d.report)) setReport(d.report);
      if (d.scenarios) setScenarios(d.scenarios);
      const st = d.state || {};
      if (st.scenario) setSc(st.scenario);
      if (st.amount != null) setAmount(Number(st.amount));
      if (st.solvent != null) setSolvent(Boolean(st.solvent));
      if (st.prepared != null) setPrepared(Boolean(st.prepared));
      if (st.quarterly) setQu(st.quarterly);
      if (Array.isArray(st.howard)) setHw(st.howard);
      setLive(Boolean(d.live));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = (partial) => {
    saveHqShareholders(partial).then((res) => {
      if (res.ok) setLive(Boolean(res.data?.live));
    });
  };

  // Edit owners popup
  const [ownersOpen, setOwnersOpen] = useState(false);
  const [draft, setDraft] = useState([]);
  const [ownersMsg, setOwnersMsg] = useState("");
  const [ownersBusy, setOwnersBusy] = useState(false);
  const openOwners = () => {
    setDraft(
      (holders.length ? holders : [{ name: "", pct: 1, shares: "", where: "", wh: 0, note: "" }]).map((h) => ({
        ...h,
        pctText: String(Math.round(Number(h.pct || 0) * 10000) / 100),
        whText: String(Math.round(Number(h.wh || 0) * 10000) / 100),
      })),
    );
    setOwnersMsg("");
    setOwnersOpen(true);
  };
  const saveOwners = async () => {
    const rows = draft
      .filter((d) => d.name.trim())
      .map((d) => ({ name: d.name, pct: Number(d.pctText) / 100, shares: d.shares, where: d.where, wh: Number(d.whText || 0) / 100, note: d.note }));
    const total = rows.reduce((a, r) => a + (Number.isFinite(r.pct) ? r.pct : 0), 0);
    if (total > 1.0001) return setOwnersMsg(`Ownership adds up to ${Math.round(total * 10000) / 100}%. It can't be more than 100%.`);
    setOwnersBusy(true);
    const res = await saveHqShareholders({ holders: rows });
    setOwnersBusy(false);
    if (!res.ok) return setOwnersMsg(typeof res.data?.detail === "string" ? res.data.detail : "Could not save the owners.");
    setHolders(Array.isArray(res.data?.holders) ? res.data.holders : rows);
    setOwnersOpen(false);
  };
  const setDraftRow = (i, patch) => setDraft(draft.map((d, k) => (k === i ? { ...d, ...patch } : d)));

  const data = useMemo(() => {
    const fallback =
      sc === "actual"
        ? { m: [["", 0], ["", 0], ["", 0], ["", 0], ["", 0], ["", 0]], cash: 0, exp: 0 }
        : sc === "sample"
        ? {
            m: [
              ["Apr", 1840],
              ["May", 2310],
              ["Jun", 2950],
              ["Jul", 3420],
              ["Aug", 4180],
              ["Sep", 4960],
            ],
            cash: 58400,
            exp: 14200,
          }
        : {
            m: [
              ["Apr", -2350],
              ["May", -1980],
              ["Jun", -2600],
              ["Jul", -2140],
              ["Aug", -2410],
              ["Sep", -2200],
            ],
            cash: 3200,
            exp: 2250,
          };
    const D = scenarios?.[sc] || fallback;
    const allProfit = D.m.every((x) => x[1] > 0);
    const reserve = D.exp * 3;
    const spare = D.cash - reserve;
    const lastQ = D.m.slice(3).reduce((a, x) => a + x[1], 0);
    const cap = Math.max(0, Math.floor(Math.min(spare, lastQ * 0.5) / 100) * 100);
    const t1ok = allProfit;
    const t2ok = spare > 0;
    const t3ok = solvent;
    const can = t1ok && t2ok;
    const amt = Math.min(amount, cap);
    return { D, allProfit, reserve, spare, lastQ, cap, t1ok, t2ok, t3ok, can, amt };
  }, [sc, amount, solvent, scenarios]);

  const split = holders.map((h) => {
    const g = data.amt * h.pct;
    const w = g * h.wh;
    return {
      name: h.name,
      note: h.note,
      noteColor: h.noteColor,
      pct: `${Math.round(h.pct * 100)}%`,
      gross: cents(g),
      wh: w ? `${cents(w)} · ${Math.round(h.wh * 100)}%` : "—",
      net: cents(g - w),
    };
  });

  const whyParts = [];
  if (!data.t1ok) whyParts.push(`${data.D.m.filter((x) => x[1] > 0).length} of the last 6 months were profitable (all 6 must be)`);
  if (!data.t2ok) whyParts.push(`cash is ${money(data.D.cash)} against a ${money(data.reserve)} reserve`);

  const hwPaid = hw.reduce((a, h) => a + h.amount, 0);
  const left = Math.max(0, 7500 - hwPaid);
  const prepDisabled = !data.t3ok || data.amt <= 0 || prepared;

  const QD = report || (
    sc === "sample"
      ? [
          ["Revenue", "$71,240"],
          ["Expenses (incl. your pay)", "$58,680"],
          ["Profit after tax provision", money(data.lastQ)],
          ["Cash at Sep 30", money(data.D.cash)],
          ["Paying customers", "131 (+19)"],
          ["Dealings with your other businesses", "None"],
          ["Change in ownership", "None"],
        ]
      : [
          ["Revenue", "$0 (pre-launch)"],
          ["Expenses (incl. your pay)", money(-data.lastQ)],
          ["Loss", money(data.lastQ)],
          ["Cash at Sep 30", money(data.D.cash)],
          ["Paying customers", "0 · launch planned Feb 2027"],
          ["Dealings with your other businesses", "None"],
          ["Change in ownership", "None"],
        ]
  );

  const hwPays = [
    ...hw
      .slice()
      .reverse()
      .map((h) => ({ date: `${h.date} · e-transfer`, amount: `CA${money(h.amount)}` })),
    { date: "Already repaid (earlier payments)", amount: "CA$7,500" },
  ];

  const headline = data.can
    ? `A dividend of up to ${money(data.cap)} is allowed this quarter.`
    : "No dividend yet. Here's what's missing.";

  return (
    <HqPanel loading={loading} minHeight={1500} showSample={!live}>
      <Modal open={ownersOpen} title="Who owns the company" onClose={() => setOwnersOpen(false)} width={760}>
        <p style={{ margin: 0, fontSize: 13, color: "#9AA1AB" }}>
          Ownership and withholding drive the dividend split. Withholding: 0% Canada, 15% US with NR301, 25% US without.
        </p>
        {draft.map((d, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 0.8fr 1.1fr 1fr 0.8fr auto", gap: 8, alignItems: "end" }}>
            {[
              ["Name", "name", "text"],
              ["Own %", "pctText", "number"],
              ["Shares", "shares", "text"],
              ["Country", "where", "text"],
              ["Withhold %", "whText", "number"],
            ].map(([label, key, type]) => (
              <label key={key} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#9AA1AB", minWidth: 0 }}>
                {label}
                <input
                  type={type}
                  value={d[key] ?? ""}
                  onChange={(e) => setDraftRow(i, { [key]: e.target.value })}
                  style={{ minHeight: 40, padding: "0 10px", borderRadius: 10, border: "1px solid #262A31", background: "#0A0B0D", color: "#F2F4F5", font: "inherit", fontSize: 14, minWidth: 0 }}
                />
              </label>
            ))}
            <button type="button" aria-label={`Remove ${d.name || "row"}`} onClick={() => setDraft(draft.filter((_, k) => k !== i))} style={{ minHeight: 40, padding: "0 10px", borderRadius: 10, border: "1px solid #262A31", background: "transparent", color: "#FF8A80", fontSize: 13 }}>
              Remove
            </button>
            <label style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#9AA1AB" }}>
              Note (tax slip, forms on file)
              <input type="text" value={d.note || ""} onChange={(e) => setDraftRow(i, { note: e.target.value })} style={{ minHeight: 38, padding: "0 10px", borderRadius: 10, border: "1px solid #262A31", background: "#0A0B0D", color: "#F2F4F5", font: "inherit", fontSize: 13 }} />
            </label>
          </div>
        ))}
        {ownersMsg ? <p role="alert" style={{ margin: 0, fontSize: 14, color: "#FF5A4E" }}>{ownersMsg}</p> : null}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={() => setDraft([...draft, { name: "", pctText: "", shares: "", where: "", whText: "0", note: "" }])} style={{ minHeight: 44, padding: "0 16px", borderRadius: 12, border: "1px solid #262A31", background: "transparent", color: "#F2F4F5", fontSize: 14 }}>
            Add owner
          </button>
          <button type="button" disabled={ownersBusy} onClick={saveOwners} style={{ minHeight: 44, padding: "0 18px", borderRadius: 12, border: 0, background: "#4DA3FF", color: "#0A0B0D", fontSize: 14, fontWeight: 600 }}>
            {ownersBusy ? "Saving…" : "Save owners"}
          </button>
        </div>
      </Modal>
      <>
        <div
          style={{
            maxWidth: 1240,
            width: "100%",
            margin: "0 auto",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                fontSize: "clamp(30px, 3.4vw, 42px)",
                lineHeight: 1.04,
                letterSpacing: "-1.2px",
                fontWeight: 700,
              }}
            >
              {headline}
            </h1>
            <span style={{ fontSize: 15, color: "#9AA1AB" }}>
              The dividend rules from the shareholder agreements, checked against the books.
            </span>
          </div>
          <div
            role="group"
            aria-label="Which numbers to show"
            style={{
              display: "inline-flex",
              padding: 4,
              borderRadius: 12,
              background: "#131519",
              border: "1px solid #262A31",
            }}
          >
            {[
              ["sample", "Sample: a profitable year"],
              ["today", "Today: pre-launch"],
            ].map(([id, label]) => {
              const on = sc === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setSc(id);
                    setPrepared(false);
                    persist({ scenario: id, prepared: false });
                  }}
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
        </div>

        <section
          aria-labelledby="test-h"
          style={{
            maxWidth: 1240,
            width: "100%",
            boxSizing: "border-box",
            margin: "0 auto",
            borderRadius: 22,
            background: "#101215",
            border: `1px solid ${data.can && data.t3ok ? "rgba(61,220,132,.4)" : "#1A1D22"}`,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h2 id="test-h" style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
              Can we pay a dividend?
            </h2>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: 999,
                color: data.can ? (data.t3ok ? "#3DDC84" : "#FFC53D") : "#FF8A80",
                background: data.can
                  ? data.t3ok
                    ? "rgba(61,220,132,.12)"
                    : "rgba(255,197,61,.12)"
                  : "rgba(255,90,78,.14)",
              }}
            >
              {data.can ? (data.t3ok ? "Yes, all three rules pass" : "Rules 1 and 2 pass · confirm rule 3") : "Not yet"}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
            <div
              style={{
                borderRadius: 16,
                background: "#0A0B0D",
                border: "1px solid #1A1D22",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 14, fontWeight: 600 }}>
                <span>1 · Six profitable months in a row</span>
                <span style={{ color: data.t1ok ? "#3DDC84" : "#FF8A80" }}>{data.t1ok ? "Pass" : "Not yet"}</span>
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 6 }}>
                {data.D.m.map(([label, val], ix) => (
                  <div
                    key={`${label}-${ix}`}
                    style={{
                      borderRadius: 10,
                      padding: "8px 4px",
                      textAlign: "center",
                      background: val > 0 ? "rgba(61,220,132,.08)" : "rgba(255,90,78,.08)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#9AA1AB" }}>{label}</span>
                    <span
                      style={{
                        fontFamily: "'Geist Mono', monospace",
                        fontSize: 12,
                        fontWeight: 600,
                        color: val > 0 ? "#3DDC84" : "#FF8A80",
                      }}
                    >
                      {money(val)}
                    </span>
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, color: "#7D848E" }}>Profit after all expenses, your pay and a provision for income tax.</span>
            </div>
            <div
              style={{
                borderRadius: 16,
                background: "#0A0B0D",
                border: "1px solid #1A1D22",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 14, fontWeight: 600 }}>
                <span>2 · Three months of expenses kept in the bank</span>
                <span style={{ color: data.t2ok ? "#3DDC84" : "#FF8A80" }}>{data.t2ok ? "Pass" : "Not yet"}</span>
              </span>
              <span style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#9AA1AB" }}>Cash in the bank</span>
                <span style={{ fontFamily: "'Geist Mono', monospace" }}>{money(data.D.cash)}</span>
              </span>
              <span style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#9AA1AB" }}>Must keep (3 × {money(data.D.exp)} average)</span>
                <span style={{ fontFamily: "'Geist Mono', monospace" }}>{money(data.reserve)}</span>
              </span>
              <span
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  paddingTop: 8,
                  borderTop: "1px solid #1A1D22",
                }}
              >
                <span>Available above the reserve</span>
                <span style={{ fontFamily: "'Geist Mono', monospace", color: data.t2ok ? "#3DDC84" : "#FF8A80" }}>
                  {money(data.spare)}
                </span>
              </span>
            </div>
            <div
              style={{
                borderRadius: 16,
                background: "#0A0B0D",
                border: "1px solid #1A1D22",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 14, fontWeight: 600 }}>
                <span>3 · Legal solvency test</span>
                <span style={{ color: data.t3ok ? "#3DDC84" : "#FFC53D" }}>{data.t3ok ? "Confirmed" : "Needs the accountant"}</span>
              </span>
              <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.5 }}>
                Alberta law: after the dividend, the company must still be able to pay its debts as they come due, and its assets must be worth more than its debts.
              </span>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, minHeight: 40 }}>
                <input
                  type="checkbox"
                  checked={solvent}
                  onChange={() => {
                    (() => { const nv = !solvent; setSolvent(nv); persist({ solvent: nv }); })();
                    (() => { setPrepared(false); persist({ prepared: false }); })();
                  }}
                />
                The accountant confirmed this for the dividend below
              </label>
            </div>
          </div>
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
            aria-labelledby="calc-h"
            style={{
              flex: "999 1 560px",
              minWidth: 0,
              borderRadius: 22,
              background: "#101215",
              border: "1px solid #1A1D22",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <h2 id="calc-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
              Split a dividend
            </h2>
            {data.can ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "#9AA1AB" }}>
                  Total dividend to declare (up to {money(data.cap)}: half of last quarter&apos;s after-tax profit, and no more than the cash above the reserve)
                  <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <input
                      type="range"
                      min={0}
                      max={data.cap}
                      step={100}
                      value={data.amt}
                      onChange={(e) => {
                        setAmount(Number(e.target.value));
                        (() => { setPrepared(false); persist({ prepared: false }); })();
                      }}
                      style={{ flex: 1 }}
                    />
                    <span
                      style={{
                        fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                        fontSize: 28,
                        fontWeight: 800,
                        color: "#D5F879",
                        minWidth: 120,
                        textAlign: "right",
                      }}
                    >
                      {money(data.amt)}
                    </span>
                  </span>
                </label>
                <div style={{ borderRadius: 14, border: "1px solid #1A1D22", overflowX: "auto" }}>
                  <div style={{ minWidth: 620 }}>
                    <div
                      aria-hidden="true"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1.4fr) 70px 110px 150px 110px",
                        gap: 10,
                        padding: "10px 14px",
                        fontFamily: "'Geist Mono', monospace",
                        fontSize: 11,
                        color: "#7D848E",
                        borderBottom: "1px solid #1A1D22",
                      }}
                    >
                      <span>SHAREHOLDER</span>
                      <span style={{ textAlign: "right" }}>SHARE</span>
                      <span style={{ textAlign: "right" }}>DIVIDEND</span>
                      <span style={{ textAlign: "right" }}>CANADIAN TAX WITHHELD</span>
                      <span style={{ textAlign: "right" }}>THEY RECEIVE</span>
                    </div>
                    {split.map((s, ix) => (
                      <div
                        key={`${s.name}-${ix}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 1.4fr) 70px 110px 150px 110px",
                          gap: 10,
                          alignItems: "center",
                          padding: "10px 14px",
                          borderBottom: "1px solid #16181C",
                          fontSize: 14,
                        }}
                      >
                        <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                          <span>{s.name}</span>
                          <span style={{ fontSize: 12, color: s.noteColor }}>{s.note}</span>
                        </span>
                        <span style={{ textAlign: "right", color: "#9AA1AB" }}>{s.pct}</span>
                        <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace", fontSize: 13 }}>{s.gross}</span>
                        <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace", fontSize: 13, color: "#FFC53D" }}>
                          {s.wh}
                        </span>
                        <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace", fontSize: 13, color: "#D5F879" }}>
                          {s.net}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "#7D848E", lineHeight: 1.5 }}>
                  US shareholders: 15% is withheld when their NR301 form is on file, 25% without it, sent to CRA by the 15th of the next month. Slips: T5 for Canadian shareholders by the end of February, NR4 for US shareholders by March 31.
                </span>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    disabled={prepDisabled}
                    onClick={() => (() => { setPrepared(true); persist({ prepared: true, amount }); })()}
                    style={{
                      minHeight: 46,
                      padding: "0 18px",
                      borderRadius: 12,
                      border: 0,
                      background: "#D5F879",
                      color: "#0A0B0D",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Prepare board resolution
                  </button>
                  <span role="status" style={{ fontSize: 13, color: prepared ? "#3DDC84" : "#9AA1AB" }}>
                    {prepared
                      ? `Board resolution drafted for ${money(data.amt)}. Sign it, then pay within 30 days.`
                      : data.t3ok
                        ? "Ready to draft."
                        : "Tick rule 3 once the accountant has confirmed it."}
                  </span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  borderRadius: 14,
                  background: "#0A0B0D",
                  border: "1px solid #1A1D22",
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 600 }}>Not yet.</span>
                <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>
                  Right now {whyParts.join(", and ")}. The page turns green on its own when the books meet both rules.
                </span>
              </div>
            )}
          </section>

          <section
            aria-labelledby="cap-h"
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
            <h2 id="cap-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
              Who owns the company
            </h2>
            {holders.length === 0 ? (
              <p style={{ margin: 0, fontSize: 14, color: "#9AA1AB" }}>No owners recorded yet. Add them so dividends split correctly.</p>
            ) : null}
            {holders.map((h, idx) => ({ ...h, color: HOLDER_COLORS[idx % HOLDER_COLORS.length] })).map((c, ix) => (
              <div key={`${c.name}-${ix}`} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 0", borderTop: "1px solid #16181C" }}>
                <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 14 }}>
                  <span>{c.name}</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace" }}>{Math.round(c.pct * 100)}%</span>
                </span>
                <div style={{ height: 8, borderRadius: 4, background: "#1A1D22", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.round(c.pct * 100)}%`,
                      background: c.color,
                      borderRadius: 4,
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, color: "#7D848E" }}>
                  {c.shares} Class A shares · {c.where}
                </span>
              </div>
            ))}
            {holders.length ? (
              <span style={{ fontSize: 12, color: "#7D848E" }}>
                {Math.round(holders.reduce((a, h) => a + Number(h.pct || 0), 0) * 10000) / 100}% of the company recorded. One class: same vote and same dividend per share.
              </span>
            ) : null}
            <button
              type="button"
              onClick={openOwners}
              style={{ alignSelf: "flex-start", minHeight: 38, padding: "0 14px", borderRadius: 10, border: "1px solid #262A31", background: "transparent", color: "#F2F4F5", fontSize: 13 }}
            >
              Edit owners
            </button>
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
            aria-labelledby="qu-h"
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
              <h2 id="qu-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
                Quarterly shareholder update
              </h2>
              <span
                style={{
                  fontSize: 13,
                  color: qu === "sent" ? "#3DDC84" : qu === "draft" ? "#4DA3FF" : "#FFC53D",
                }}
              >
                {qu === "sent" ? "Sent Oct 20" : qu === "draft" ? "Draft ready" : "25 days left"}
              </span>
            </div>
            <span style={{ fontSize: 14, color: "#9AA1AB" }}>
              July to September. Due within 45 days of the quarter end: <span style={{ color: "#F2F4F5" }}>November 14</span>.
            </span>
            {qu === "none" ? (
              <button
                type="button"
                onClick={() => (() => { setQu("draft"); persist({ quarterly: "draft" }); })()}
                style={{
                  alignSelf: "flex-start",
                  minHeight: 44,
                  padding: "0 16px",
                  borderRadius: 12,
                  border: 0,
                  background: "#4DA3FF",
                  color: "#0A0B0D",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Build the draft from the books
              </button>
            ) : (
              <div
                style={{
                  borderRadius: 14,
                  background: "#0A0B0D",
                  border: "1px solid #1A1D22",
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  animation: "sfy-rise .25s ease both",
                }}
              >
                {QD.map(([label, value], ix) => (
                  <div
                    key={`${label}-${ix}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      fontSize: 14,
                      padding: "4px 0",
                      borderBottom: "1px solid #16181C",
                    }}
                  >
                    <span style={{ color: "#9AA1AB" }}>{label}</span>
                    <span style={{ textAlign: "right" }}>{value}</span>
                  </div>
                ))}
                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB", marginTop: 4 }}>
                  Your note to shareholders
                  <textarea
                    rows={3}
                    defaultValue="Strong quarter: Premium agencies are now a third of revenue. Next quarter we focus on lowering the undo rate below 3%."
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #262A31",
                      background: "#101215",
                      color: "#F2F4F5",
                      font: "inherit",
                      fontSize: 14,
                      resize: "vertical",
                    }}
                  />
                </label>
                {qu === "draft" ? (
                  <button
                    type="button"
                    onClick={() => (() => { setQu("sent"); persist({ quarterly: "sent" }); })()}
                    style={{
                      alignSelf: "flex-start",
                      minHeight: 44,
                      padding: "0 16px",
                      borderRadius: 12,
                      border: 0,
                      background: "#D5F879",
                      color: "#0A0B0D",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Send to Nicholas, Emin and Howard
                  </button>
                ) : null}
              </div>
            )}
          </section>

          <section
            aria-labelledby="hw-h"
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
            <h2 id="hw-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
              Your repayment to Howard
            </h2>
            <span style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "#9AA1AB" }}>Left to repay</span>
              <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 24, fontWeight: 800 }}>
                CA{money(left)}
              </span>
            </span>
            <div style={{ height: 10, borderRadius: 5, background: "#1A1D22", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.round(((7500 + hwPaid) / 15000) * 100)}%`,
                  background: "#3DDC84",
                  borderRadius: 5,
                }}
              />
            </div>
            <span style={{ fontSize: 13, color: "#9AA1AB" }}>
              {left === 0
                ? "Repaid in full. Nothing more is owed."
                : "CA$7,500 already repaid of CA$15,000. The rest is due by December 31, 2027, in one payment or in parts."}
            </span>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
              Record a payment (CA$)
              <span style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={hwInput}
                  onChange={(e) => setHwInput(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 44,
                    padding: "0 12px",
                    borderRadius: 12,
                    border: "1px solid #262A31",
                    background: "#0A0B0D",
                    color: "#F2F4F5",
                    font: "inherit",
                    fontSize: 15,
                  }}
                />
                <button
                  type="button"
                  disabled={left === 0}
                  onClick={() => {
                    const v = Math.min(left, Math.max(0, Math.round(Number(hwInput) || 0)));
                    if (v > 0) { const next = [...hw, { date: "Oct 20", amount: v }]; setHw(next); persist({ howard: next }); }
                  }}
                  style={{
                    minHeight: 44,
                    padding: "0 16px",
                    borderRadius: 12,
                    border: 0,
                    background: "#3DDC84",
                    color: "#0A0B0D",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Record
                </button>
              </span>
            </label>
            {hwPays.map((h, ix) => (
              <div
                key={`${h.date}-${ix}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  padding: "6px 0",
                  borderTop: "1px solid #16181C",
                }}
              >
                <span style={{ color: "#9AA1AB" }}>{h.date}</span>
                <span style={{ fontFamily: "'Geist Mono', monospace" }}>{h.amount}</span>
              </div>
            ))}
            <span style={{ fontSize: 12, color: "#7D848E", lineHeight: 1.5 }}>
              This is your personal debt, paid from your own account. It never holds up a dividend. No interest.
            </span>
          </section>
        </div>
      </>
    </HqPanel>
  );
}
