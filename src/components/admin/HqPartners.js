"use client";

import { useEffect, useMemo, useState } from "react";
import HqPanel from "@/components/admin/HqPanel";
import {
  approvePartnerApplication,
  declinePartnerApplication,
  getHqPartners,
  resendPartnerInvite,
  runPartnerPayout,
  saveHqPartners,
} from "@/lib/hqApi";

const money = (v) => (v < 0 ? "−$" : "$") + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STEPS = [2500, 5000, 10000, 20000, 40000];

// Payouts go out on the 15th: the next 15th from today, and the month after it for carried balances.
const PAY_DATE = (() => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + (now.getDate() > 15 ? 1 : 0), 15);
  return d;
})();
const PAY_DAY = PAY_DATE.toLocaleDateString("en-US", { month: "short", day: "numeric" });
const NEXT_MONTH = new Date(PAY_DATE.getFullYear(), PAY_DATE.getMonth() + 1, 1).toLocaleDateString("en-US", { month: "long" });
function ini(n) {
  return n
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

export default function HqPartners() {
  const [tab, setTab] = useState("payout");
  const [run, setRun] = useState({});
  const [paid, setPaid] = useState(false);
  const [apps, setApps] = useState({});
  const [rates, setRates] = useState({});
  const [cleared, setCleared] = useState({});
  const [grants, setGrants] = useState({});
  const [runRowsSrc, setRunRowsSrc] = useState([]);
  const [payMsg, setPayMsg] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  // Real applications from the partner apply form only (no sample rows).
  const [appsSrc, setAppsSrc] = useState([]);
  const [appResult, setAppResult] = useState({});
  const [appBusy, setAppBusy] = useState("");
  const [copiedLink, setCopiedLink] = useState("");
  const [partnersSrc, setPartnersSrc] = useState([]);
  const [foundersSrc, setFoundersSrc] = useState([]);
  const [stepsSrc, setStepsSrc] = useState(STEPS);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getHqPartners().then((res) => {
      if (cancelled || !res.ok) return;
      const d = res.data || {};
      if (Array.isArray(d.run)) setRunRowsSrc(d.run);
      if (Array.isArray(d.applications)) setAppsSrc(d.applications);
      if (Array.isArray(d.partners)) setPartnersSrc(d.partners);
      if (Array.isArray(d.founders)) setFoundersSrc(d.founders);
      if (Array.isArray(d.steps)) setStepsSrc(d.steps);
      const st = d.state || {};
      setRun(st.run || {});
      setPaid(Boolean(st.paid));
      setApps(st.apps || {});
      setRates(st.rates || {});
      setCleared(st.cleared || {});
      setGrants(st.grants || {});
      setLive(Boolean(d.live));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = (partial) => {
    saveHqPartners(partial).then((res) => {
      if (!res.ok) return;
      const st = res.data?.state || {};
      if (partial.run) setRun(st.run || {});
      if (partial.paid != null) setPaid(Boolean(st.paid));
      if (partial.apps) setApps(st.apps || {});
      if (partial.rates) setRates(st.rates || {});
      if (partial.cleared) setCleared(st.cleared || {});
      if (partial.grants) setGrants(st.grants || {});
      setLive(Boolean(res.data?.live));
    });
  };

  const payoutData = useMemo(() => {
    const rows = runRowsSrc.map((r) => {
      const net = r.cleared + r.rev;
      let check = "Passes all checks";
      let cc = "#3DDC84";
      let lock = "";
      if (!r.tax) {
        check = "No tax details yet: held automatically";
        cc = "#FFC53D";
        lock = "Held";
      } else if (net < 50) {
        check = "Under $50: carries to Dec 15";
        cc = "#9AA1AB";
        lock = "Carried over";
      } else if (r.flag && !run[r.id]) {
        check = `${r.flag}: review first`;
        cc = "#FF8A80";
      }
      const s = lock ? "locked" : run[r.id] || (r.flag ? "held" : "ready");
      return { ...r, net, s, check, cc, lock };
    });
    const approved = rows.filter((r) => r.s === "approved");
    const sumA = approved.reduce((a, r) => a + r.net, 0);
    const held = rows.filter((r) => r.s === "held" || r.lock === "Held").reduce((a, r) => a + r.net, 0);
    const carried = rows.filter((r) => r.lock === "Carried over").reduce((a, r) => a + r.net, 0);
    const reversed = rows.reduce((a, r) => a + r.rev, 0);
    return { rows, approved, sumA, held, carried, reversed };
  }, [run, runRowsSrc]);

  const setRunId = (id, v) => {
    setRun({ ...run, [id]: v });
    persist({ run: { [id]: v } });
  };

  const runRows = payoutData.rows.map((r) => {
    const isPaid = paid && r.s === "approved";
    return {
      ...r,
      cleared: money(r.cleared),
      reversed: r.rev ? money(r.rev) : "—",
      net: money(r.net),
      checkColor: r.cc,
      canAct: !r.lock && !paid,
      locked: !!r.lock || paid,
      lockLabel: isPaid ? `Paid ${PAY_DAY}` : r.lock || (r.s === "held" ? "Held" : "Not in this run"),
      lockColor: isPaid ? "#3DDC84" : r.lock === "Held" || r.s === "held" ? "#FFC53D" : "#9AA1AB",
      lockBg: isPaid
        ? "rgba(61,220,132,.12)"
        : r.lock === "Held" || r.s === "held"
          ? "rgba(255,197,61,.12)"
          : "rgba(154,161,171,.12)",
      holdLabel: r.s === "held" ? "Held" : "Hold",
      holdBg: r.s === "held" ? "rgba(255,197,61,.16)" : "transparent",
      approveLabel: r.s === "approved" ? "Approved" : "Approve",
      approveBg: r.s === "approved" ? "#3DDC84" : "#D5F879",
    };
  });

  const totals = [
    {
      label: `Approved to pay ${PAY_DAY}`,
      value: money(payoutData.sumA),
      sub: `${payoutData.approved.length} partner${payoutData.approved.length === 1 ? "" : "s"}`,
      color: "#D5F879",
    },
    { label: "On hold", value: money(payoutData.held), sub: "missing tax details or under review", color: "#FFC53D" },
    { label: `Carried to ${NEXT_MONTH}`, value: money(payoutData.carried), sub: "balances under $50", color: "#F2F4F5" },
    { label: "Reversed this month", value: money(payoutData.reversed), sub: "refunds and chargebacks", color: "#F2F4F5" },
  ];

  const appRows = appsSrc.map((a) => {
    const s = apps[a.id];
    const result = appResult[a.id] || {};
    const emailed = result.emailed ?? a.emailed;
    // Say exactly what happened: an email is only claimed when the mail server accepted it.
    const doneLabel =
      s === "ok"
        ? emailed
          ? "Approved. Welcome email with the set-password link was sent."
          : "Approved. Email isn't set up, so send the set-password link yourself."
        : emailed
          ? "Declined. A polite email was sent."
          : "Declined. No email was sent (email isn't set up).";
    return {
      ...a,
      initials: ini(a.name),
      open: !s,
      closed: !!s,
      border: s === "ok" ? "rgba(61,220,132,.4)" : "#1A1D22",
      doneLabel,
      doneColor: s === "ok" ? "#3DDC84" : "#9AA1AB",
      setupUrl: result.setupUrl || "",
      needsLink: s === "ok" && !emailed,
      error: result.error || "",
    };
  });

  const decide = async (a, action) => {
    setAppBusy(a.id);
    const res = action === "approve" ? await approvePartnerApplication(a.id, { rate: 30 }) : await declinePartnerApplication(a.id);
    setAppBusy("");
    if (!res.ok) {
      const detail = res.data?.detail;
      setAppResult({ ...appResult, [a.id]: { error: typeof detail === "string" ? detail : "That did not work. Try again." } });
      return;
    }
    setAppResult({ ...appResult, [a.id]: { emailed: Boolean(res.data?.emailed), setupUrl: res.data?.setupUrl || "" } });
    setApps({ ...apps, [a.id]: action === "approve" ? "ok" : "no" });
  };

  const newLink = async (a) => {
    if (!a.partnerId) return;
    setAppBusy(a.id);
    const res = await resendPartnerInvite(a.partnerId);
    setAppBusy("");
    if (res.ok) setAppResult({ ...appResult, [a.id]: { emailed: Boolean(res.data?.emailed), setupUrl: res.data?.setupUrl || "" } });
  };

  const copyLink = (a) => {
    try {
      navigator.clipboard.writeText(a.setupUrl);
      setCopiedLink(a.id);
    } catch {
      /* ignore */
    }
  };
  const openApps = appRows.filter((a) => a.open).length;

  const partnerRows = partnersSrc.map((p) => {
    const rate = rates[p.id] || p.rate;
    const base = p.founding ? p.rate : 30;
    const opts = [30, 35, 40].filter((v) => v >= base);
    const flagCleared = cleared[p.id];
    const flag = flagCleared ? "Reviewed" : p.flag || "None";
    return {
      ...p,
      rate,
      opts,
      flag,
      hasFlag: !!p.flag && !flagCleared && p.flag !== "Tax details missing",
      flagColor: p.flag && !flagCleared ? "#FFC53D" : "#7D848E",
      lifeStr: money(p.life),
    };
  });

  const founderRows = foundersSrc.map((f) => {
    const rate = (rates[f.id] || 35) >= 40 || f.qual >= 10 ? 40 : 35;
    const reached = stepsSrc.filter((s) => f.mrr >= s).length;
    const granted = grants[f.id] || 0;
    const earned = f.held >= 3 ? reached : 0;
    const steps = stepsSrc.map((s, i) => {
      const done = i < granted;
      const ok = i < earned;
      const near = i < reached;
      return {
        at: `$${s / 1000}k`,
        label: done ? "Granted" : ok ? "Earned" : near ? "Holding" : "0.5%",
        color: done ? "#0A0B0D" : ok ? "#D5F879" : near ? "#4DA3FF" : "#7D848E",
        bg: done ? "#D5F879" : ok ? "rgba(213,248,121,.1)" : "#0A0B0D",
        border: ok || done ? "#D5F879" : near ? "#4DA3FF" : "#1A1D22",
      };
    });
    return {
      ...f,
      rate,
      qualPct: `${Math.min(100, f.qual * 10)}%`,
      qualNote:
        rate >= 40
          ? "Unlocked: 40% for good."
          : `${10 - f.qual} more qualified referrals within 6 months unlocks 40% for good.`,
      mrrStr: `$${f.mrr.toLocaleString("en-US")} / mo`,
      steps,
      canGrant: earned > granted,
      nextGrant: granted + 1,
      granted: granted > 0,
      grantedNote: `Step ${granted} prepared for board approval: 0.5% as options under the partner plan. Lawyer to confirm the paperwork.`,
    };
  });

  const HEAD = {
    payout: [
      paid
        ? `Paid ${money(payoutData.sumA)} to ${payoutData.approved.length} partners.`
        : `November payout run: ${money(payoutData.rows.filter((r) => !r.lock).reduce((a, r) => a + r.net, 0))} to review.`,
      "Runs on the 15th. Approve each partner, or hold anyone who needs a look.",
    ],
    apps: [`${openApps} application${openApps === 1 ? "" : "s"} waiting.`, "Approved partners start at the public rate of 30%."],
    all: [`${partnersSrc.length} active partners.`, "Rates, results and anything that needs a second look."],
    founding: ["Founding partners.", "35% now, 40% for good after 10 qualified referrals in any 6 months, plus performance shares."],
  }[tab];

  const payDisabled = paid || payoutData.approved.length === 0;
  const payNote = paid
    ? "Sent through PayPal, Wise and bank transfer. Partners get an email and see it in their centre."
    : payoutData.approved.length
      ? "Nothing is sent until you press Pay."
      : "Approve partners to build the run.";
  const payNoteColor = paid ? "#3DDC84" : "#9AA1AB";

  const tabs = [
    ["payout", "Payout run"],
    ["apps", `Applications (${openApps})`],
    ["all", "All partners"],
    ["founding", "Founding partners"],
  ];

  return (
    <HqPanel showSample={!live}>
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
            {HEAD[0]}
          </h1>
          <span style={{ fontSize: 15, color: "#9AA1AB" }}>{HEAD[1]}</span>
        </div>
        <div
          role="tablist"
          aria-label="Partner tools"
          style={{
            display: "inline-flex",
            flexWrap: "wrap",
            padding: 4,
            borderRadius: 12,
            background: "#131519",
            border: "1px solid #262A31",
          }}
        >
          {tabs.map(([id, label]) => {
            const on = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(id)}
                style={{
                  minHeight: 38,
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

      {tab === "payout" ? (
        <div
          style={{
            maxWidth: 1240,
            width: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            animation: "sfy-rise .3s ease both",
          }}
        >
          <section
            aria-label="Payout totals"
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}
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
                <span style={{ fontSize: 13, color: "#9AA1AB" }}>{k.label}</span>
                <span
                  style={{
                    fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                    fontSize: 28,
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
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12 }}>
            {[
              "Only commissions past the 30-day hold",
              "$50 minimum, smaller balances carry over",
              "Refunds reverse commission automatically",
              "Tax details on file before any payout",
            ].map((t) => (
              <span
                key={t}
                style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid #262A31", color: "#D7DADE" }}
              >
                {t}
              </span>
            ))}
          </div>
          <div style={{ borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", overflowX: "auto" }}>
            <div style={{ minWidth: 900 }}>
              <div
                aria-hidden="true"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.5fr) 100px 100px 110px 120px minmax(0, 1.3fr) 190px",
                  gap: 10,
                  padding: "12px 18px",
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 11,
                  color: "#7D848E",
                  borderBottom: "1px solid #1A1D22",
                }}
              >
                <span>PARTNER</span>
                <span style={{ textAlign: "right" }}>CLEARED</span>
                <span style={{ textAlign: "right" }}>REVERSED</span>
                <span style={{ textAlign: "right" }}>TO PAY</span>
                <span>METHOD</span>
                <span>CHECK</span>
                <span style={{ textAlign: "right" }}>ACTION</span>
              </div>
              {runRows.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1.5fr) 100px 100px 110px 120px minmax(0, 1.3fr) 190px",
                    gap: 10,
                    alignItems: "center",
                    padding: "12px 18px",
                    borderBottom: "1px solid #16181C",
                    fontSize: 14,
                  }}
                >
                  <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{r.name}</span>
                    <span style={{ fontSize: 12, color: "#7D848E" }}>{r.type}</span>
                  </span>
                  <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace", fontSize: 13 }}>{r.cleared}</span>
                  <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace", fontSize: 13, color: "#FFC53D" }}>
                    {r.reversed}
                  </span>
                  <span
                    style={{
                      textAlign: "right",
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#D5F879",
                    }}
                  >
                    {r.net}
                  </span>
                  <span style={{ fontSize: 13, color: "#9AA1AB" }}>{r.method}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: r.checkColor }}>
                    <span style={{ width: 7, height: 7, flex: "none", borderRadius: "50%", background: r.checkColor }} />
                    {r.check}
                  </span>
                  <span style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                    {r.canAct ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setRunId(r.id, r.s === "held" ? "ready" : "held")}
                          aria-pressed={r.s === "held"}
                          style={{
                            minHeight: 34,
                            padding: "0 12px",
                            borderRadius: 10,
                            border: "1px solid #262A31",
                            background: r.holdBg,
                            color: "#F2F4F5",
                            fontSize: 13,
                          }}
                        >
                          {r.holdLabel}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRunId(r.id, r.s === "approved" ? "ready" : "approved")}
                          aria-pressed={r.s === "approved"}
                          style={{
                            minHeight: 34,
                            padding: "0 12px",
                            borderRadius: 10,
                            border: 0,
                            background: r.approveBg,
                            color: "#0A0B0D",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {r.approveLabel}
                        </button>
                      </>
                    ) : (
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "6px 10px",
                          borderRadius: 999,
                          color: r.lockColor,
                          background: r.lockBg,
                        }}
                      >
                        {r.lockLabel}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={paid}
              onClick={() => {
                const n = { ...run };
                payoutData.rows.forEach((r) => {
                  if (!r.lock && r.s === "ready") n[r.id] = "approved";
                });
                setRun(n);
              }}
              style={{
                minHeight: 46,
                padding: "0 18px",
                borderRadius: 12,
                border: "1px solid #262A31",
                background: "transparent",
                color: "#F2F4F5",
                fontSize: 14,
                opacity: paid ? 0.45 : 1,
                cursor: paid ? "not-allowed" : "pointer",
              }}
            >
              Approve everything that passes the checks
            </button>
            <button
              type="button"
              disabled={payDisabled || payBusy}
              onClick={async () => {
                // Records each approved partner's cleared balance as paid; the partner centre shows it.
                setPayBusy(true);
                const res = await runPartnerPayout();
                setPayBusy(false);
                if (!res.ok) {
                  setPayMsg(typeof res.data?.detail === "string" ? res.data.detail : "The payout could not be recorded.");
                  return;
                }
                const d = res.data || {};
                if (Array.isArray(d.run)) setRunRowsSrc(d.run);
                if (Array.isArray(d.partners)) setPartnersSrc(d.partners);
                setRun(d.state?.run || {});
                setPaid(Boolean(d.state?.paid));
                setPayMsg(d.message || "");
              }}
              style={{
                minHeight: 46,
                padding: "0 20px",
                borderRadius: 12,
                border: 0,
                background: "#D5F879",
                color: "#0A0B0D",
                fontSize: 15,
                fontWeight: 600,
                boxShadow: "0 0 22px rgba(213,248,121,.3)",
                opacity: payDisabled ? 0.45 : 1,
                cursor: payDisabled ? "not-allowed" : "pointer",
              }}
            >
              {payBusy ? "Recording…" : paid ? "Payout recorded" : `Pay ${payoutData.approved.length} approved · ${money(payoutData.sumA)}`}
            </button>
            <span role="status" style={{ fontSize: 14, color: payMsg ? "#D7DADE" : payNoteColor }}>
              {payMsg || payNote}
            </span>
          </div>
        </div>
      ) : null}

      {tab === "apps" ? (
        <section
          aria-label="Applications"
          style={{
            maxWidth: 1240,
            width: "100%",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 14,
            animation: "sfy-rise .3s ease both",
          }}
        >
          {appRows.length === 0 ? (
            <p style={{ margin: 0, fontSize: 14, color: "#9AA1AB" }}>
              No applications yet. They appear here when someone applies on the partner sign-in page.
            </p>
          ) : null}
          {appRows.map((a) => (
            <div
              key={a.id}
              style={{
                borderRadius: 20,
                background: "#101215",
                border: `1px solid ${a.border}`,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    width: 36,
                    height: 36,
                    flex: "none",
                    borderRadius: "50%",
                    background: "#262A31",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {a.initials}
                </span>
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{a.name}</span>
                  <span style={{ fontSize: 12, color: "#7D848E" }}>
                    {a.email} · {a.country} · applied {a.when}
                  </span>
                </span>
              </div>
              <span style={{ fontSize: 13, color: "#9AA1AB" }}>Will share Searchify on</span>
              <span style={{ fontSize: 14, lineHeight: 1.5 }}>{a.where}</span>
              <span style={{ fontSize: 13, color: a.noteColor }}>{a.note}</span>
              {a.open ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    disabled={appBusy === a.id}
                    onClick={() => decide(a, "approve")}
                    style={{
                      minHeight: 42,
                      padding: "0 16px",
                      borderRadius: 12,
                      border: 0,
                      background: "#D5F879",
                      color: "#0A0B0D",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Approve at 30%
                  </button>
                  <button
                    type="button"
                    disabled={appBusy === a.id}
                    onClick={() => decide(a, "decline")}
                    style={{
                      minHeight: 42,
                      padding: "0 16px",
                      borderRadius: 12,
                      border: "1px solid #262A31",
                      background: "transparent",
                      color: "#F2F4F5",
                      fontSize: 14,
                    }}
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: 14, fontWeight: 600, color: a.doneColor }}>{a.doneLabel}</span>
              )}
              {a.error ? <span style={{ fontSize: 13, color: "#FF5A4E" }}>{a.error}</span> : null}
              {a.needsLink && a.setupUrl ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
                  <span style={{ flex: 1, minWidth: 0, fontFamily: "'Geist Mono', monospace", fontSize: 12, color: "#D7DADE", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.setupUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyLink(a)}
                    style={{ minHeight: 36, padding: "0 12px", borderRadius: 10, border: 0, background: "#4DA3FF", color: "#0A0B0D", fontSize: 13, fontWeight: 600 }}
                  >
                    {copiedLink === a.id ? "Copied" : "Copy link"}
                  </button>
                </div>
              ) : null}
              {a.needsLink && !a.setupUrl && a.partnerId ? (
                <button
                  type="button"
                  disabled={appBusy === a.id}
                  onClick={() => newLink(a)}
                  style={{ alignSelf: "flex-start", minHeight: 36, padding: "0 12px", borderRadius: 10, border: "1px solid #262A31", background: "transparent", color: "#F2F4F5", fontSize: 13 }}
                >
                  Get a new set-password link
                </button>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      {tab === "all" ? (
        <section
          aria-label="All partners"
          style={{
            maxWidth: 1240,
            width: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            animation: "sfy-rise .3s ease both",
          }}
        >
          <div style={{ borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", overflowX: "auto" }}>
            <div style={{ minWidth: 880 }}>
              <div
                aria-hidden="true"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.5fr) 120px 130px 100px 120px minmax(0, 1.4fr)",
                  gap: 10,
                  padding: "12px 18px",
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 11,
                  color: "#7D848E",
                  borderBottom: "1px solid #1A1D22",
                }}
              >
                <span>PARTNER</span>
                <span>RATE</span>
                <span style={{ textAlign: "right" }}>QUALIFIED · 6 MO</span>
                <span style={{ textAlign: "right" }}>PAYING</span>
                <span style={{ textAlign: "right" }}>LIFETIME</span>
                <span>FLAGS</span>
              </div>
              {partnerRows.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1.5fr) 120px 130px 100px 120px minmax(0, 1.4fr)",
                    gap: 10,
                    alignItems: "center",
                    padding: "12px 18px",
                    borderBottom: "1px solid #16181C",
                    fontSize: 14,
                  }}
                >
                  <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: "#7D848E" }}>{p.type}</span>
                  </span>
                  <label style={{ display: "flex", flexDirection: "column", fontSize: 11, color: "#7D848E" }}>
                    <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                      Commission rate for {p.name}
                    </span>
                    <select
                      value={String(p.rate)}
                      onChange={(e) => (() => { const nv = Number(e.target.value); setRates({ ...rates, [p.id]: nv }); persist({ rates: { [p.id]: nv } }); })()}
                      style={{
                        minHeight: 36,
                        padding: "0 8px",
                        borderRadius: 10,
                        border: "1px solid #262A31",
                        background: "#0A0B0D",
                        color: "#F2F4F5",
                        font: "inherit",
                        fontSize: 14,
                      }}
                    >
                      {p.opts.map((v) => (
                        <option key={v} value={v}>
                          {v}%
                        </option>
                      ))}
                    </select>
                  </label>
                  <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace", fontSize: 13 }}>{p.qual}</span>
                  <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace", fontSize: 13 }}>{p.paying}</span>
                  <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace", fontSize: 13 }}>{p.lifeStr}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12, color: p.flagColor }}>
                    {p.flag}
                    {p.hasFlag ? (
                      <button
                        type="button"
                        onClick={() => (() => { setCleared({ ...cleared, [p.id]: true }); persist({ cleared: { [p.id]: true } }); })()}
                        style={{
                          minHeight: 30,
                          padding: "0 10px",
                          borderRadius: 8,
                          border: "1px solid #262A31",
                          background: "transparent",
                          color: "#F2F4F5",
                          fontSize: 12,
                        }}
                      >
                        Reviewed, clear it
                      </button>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <span style={{ fontSize: 12, color: "#7D848E" }}>
            Founding partners can only be moved up. Their agreement says the rate can&apos;t be lowered without their written consent.
          </span>
        </section>
      ) : null}

      {tab === "founding" ? (
        <section
          aria-label="Founding partners"
          style={{
            maxWidth: 1240,
            width: "100%",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: 14,
            animation: "sfy-rise .3s ease both",
          }}
        >
          {founderRows.map((f) => (
            <div
              key={f.id}
              style={{
                borderRadius: 22,
                background: "#101215",
                border: "1px solid #1A1D22",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 17, fontWeight: 600 }}>{f.name}</span>
                  <span style={{ fontSize: 12, color: "#7D848E" }}>Founding Partner Agreement · signed at closing</span>
                </span>
                <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 30, fontWeight: 800, color: "#D5F879" }}>
                  {f.rate}%
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span>Qualified referrals, last 6 months</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace" }}>
                    {f.qual} / 10
                  </span>
                </span>
                <div style={{ height: 10, borderRadius: 5, background: "#1A1D22", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: f.qualPct, borderRadius: 5, background: "#4DA3FF" }} />
                </div>
                <span style={{ fontSize: 12, color: "#7D848E" }}>{f.qualNote}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span>Monthly revenue from their referrals</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace" }}>{f.mrrStr}</span>
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6 }}>
                  {f.steps.map((s) => (
                    <div
                      key={s.at}
                      style={{
                        borderRadius: 10,
                        padding: "8px 6px",
                        textAlign: "center",
                        background: s.bg,
                        border: `1px solid ${s.border}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: "#9AA1AB" }}>{s.at}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: "#7D848E" }}>
                  Each step is 0.5% of the company once that level holds for 3 months in a row. Window ends Feb 26, 2030.
                </span>
              </div>
              {f.canGrant ? (
                <button
                  type="button"
                  onClick={() => {
                    const n = (grants[f.id] || 0) + 1;
                    setGrants({ ...grants, [f.id]: n });
                    persist({ grants: { [f.id]: n } });
                  }}
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
                  Prepare board approval for step {f.nextGrant}
                </button>
              ) : null}
              {f.granted ? <span style={{ fontSize: 13, color: "#3DDC84" }}>{f.grantedNote}</span> : null}
            </div>
          ))}
        </section>
      ) : null}
    </HqPanel>
  );
}
