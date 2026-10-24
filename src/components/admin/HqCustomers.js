"use client";

import { useEffect, useMemo, useState } from "react";
import HqPanel from "@/components/admin/HqPanel";
import { getHqCustomers, hqCustomerAction } from "@/lib/hqApi";

const PLAN = { solo: ["Solo", 29], pro: ["Pro", 79], premium: ["Premium", 399] };
const ST = {
  paying: ["Paying", "#3DDC84", "rgba(61,220,132,.12)"],
  trial: ["Free trial", "#4DA3FF", "rgba(77,163,255,.12)"],
  failed: ["Payment failed", "#FF8A80", "rgba(255,90,78,.14)"],
  cancelled: ["Cancelled", "#9AA1AB", "rgba(154,161,171,.12)"],
};
const PSTYLE = {
  Paid: ["#3DDC84", "rgba(61,220,132,.12)"],
  Refunded: ["#FFC53D", "rgba(255,197,61,.12)"],
  Declined: ["#FF8A80", "rgba(255,90,78,.14)"],
};

const money = (v) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function ini(n) {
  return n
    .split(" ")
    .filter((w) => /[A-Za-z]/.test(w.charAt(0)))
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
}

function lk(n, ok) {
  return {
    label: n + (ok ? "" : " · broken"),
    color: ok ? "#3DDC84" : "#FF8A80",
    bg: ok ? "rgba(61,220,132,.12)" : "rgba(255,90,78,.14)",
  };
}

export default function HqCustomers() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [plan, setPlan] = useState("premium");
  const [reason, setReason] = useState("Customer asked");
  const [toast, setToast] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getHqCustomers().then((res) => {
      if (cancelled || !res.ok) return;
      const list = res.data?.items || [];
      setItems(list);
      setTotal(Number(res.data?.total) || list.length);
      setLive(Boolean(res.data?.live));
      setSel((prev) => prev || list[0]?.id || "");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const view = items;
  const empty = {
    id: "",
    name: "—",
    owner: "—",
    email: "",
    domain: "",
    plan: "solo",
    status: "paying",
    since: "",
    ref: "Direct",
    card: "",
    next: "",
    moves: "0",
    undo: "0 undone",
    ltv: 0,
    sites: [],
    log: [],
  };
  const selCustomer = view.find((c) => c.id === sel) || view[0] || empty;
  const price = (PLAN[selCustomer.plan] || PLAN.solo)[1];

  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return view.filter(
      (c) =>
        (filter === "all" || c.status === filter) &&
        (!qq || `${c.name} ${c.email} ${c.domain} ${c.owner}`.toLowerCase().includes(qq)),
    );
  }, [view, q, filter]);

  const rows = list.map((c) => ({
    ...c,
    initials: ini(c.name),
    planLabel: (PLAN[c.plan] || PLAN.solo)[0],
    statusLabel: (ST[c.status] || ST.paying)[0],
    color: (ST[c.status] || ST.paying)[1],
    selected: c.id === selCustomer.id,
  }));

  const pays =
    selCustomer.ltv === 0
      ? []
      : [
          ["Oct 3, 2026", price, "Paid"],
          ["Sep 3, 2026", price, "Paid"],
          ["Aug 3, 2026", price, "Paid"],
        ].slice(0, Math.max(1, Math.round(selCustomer.ltv / price)));

  let payments = pays.map((p) => ({ date: p[0], amount: money(p[1]), status: p[2] }));
  if (selCustomer.status === "failed") {
    payments = [{ date: "Oct 20, 2026", amount: money(price), status: "Declined" }, ...payments];
  }
  if (selCustomer.refunded) {
    payments = payments.map((p, i) => (i === 0 ? { ...p, status: "Refunded" } : p));
  }
  payments = payments.map((p) => ({
    ...p,
    color: (PSTYLE[p.status] || PSTYLE.Paid)[0],
    bg: (PSTYLE[p.status] || PSTYLE.Paid)[1],
  }));
  if (!payments.length) {
    payments = [{ date: "No payments yet", amount: "", status: "Trial", color: "#4DA3FF", bg: "rgba(77,163,255,.12)" }];
  }

  const c = {
    initials: ini(selCustomer.name),
    name: selCustomer.name,
    owner: selCustomer.owner,
    email: selCustomer.email,
    since: selCustomer.since,
    ref: selCustomer.ref,
    status: (ST[selCustomer.status] || ST.paying)[0],
    color: (ST[selCustomer.status] || ST.paying)[1],
    statusBg: (ST[selCustomer.status] || ST.paying)[2],
    plan: (PLAN[selCustomer.plan] || PLAN.solo)[0],
    price: `${money(price)} / month`,
    next: selCustomer.next,
    card: selCustomer.card,
    ltv: money(selCustomer.ltv),
    credit: selCustomer.freeMonths
      ? `${selCustomer.freeMonths} free month${selCustomer.freeMonths > 1 ? "s" : ""} credited`
      : "no credits",
    moves: selCustomer.moves,
    undo: selCustomer.undo,
    sites: (selCustomer.sites || []).map((s) => ({
      domain: s[0],
      links: [lk("Google Search Console", s[1]), lk("WordPress", s[2]), lk("Analytics", s[3])],
    })),
  };

  const baseLog = [
    { when: "Oct 18", text: "Approved 12 low-risk moves across 3 sites", who: selCustomer.owner },
    { when: "Oct 3", text: `Paid invoice ${money(price)}`, who: "Stripe" },
    {
      when: selCustomer.since,
      text: `Signed up on ${(PLAN[selCustomer.plan] || PLAN.solo)[0]}${String(selCustomer.ref || "").indexOf("Direct") === 0 ? "" : ` through ${selCustomer.ref}`}`,
      who: "System",
    },
  ];
  const log = [...(selCustomer.log || []), ...baseLog];

  const applyCustomer = (next) => {
    setItems((prev) => prev.map((c) => (c.id === next.id ? next : c)));
  };

  const runAction = async (action, extraBody = {}) => {
    if (!selCustomer.id || busy) return;
    setBusy(true);
    const res = await hqCustomerAction(selCustomer.id, { action, reason, ...extraBody });
    setBusy(false);
    setConfirm(null);
    if (!res.ok) {
      setToast(res.data?.detail || "Could not update this customer.");
      return;
    }
    if (res.data?.customer) applyCustomer(res.data.customer);
    setToast(res.data?.message || "Updated.");
  };

  const CF = {
    free: {
      title: `Give ${selCustomer.name} a free month?`,
      body: `Their next invoice (${money(price)}) is skipped and they get an email saying so. Affiliate commission is not paid on a free month.`,
      btn: "Give free month",
      btnBg: "#D5F879",
      border: "#3A404A",
      go: () => runAction("free_month"),
    },
    refund: {
      title: `Refund ${money(price)} to ${(selCustomer.card || "").split(" ·")[0]}?`,
      body: "The money goes back in 5 to 10 business days. Any partner commission on this payment is reversed automatically before payout.",
      btn: `Refund ${money(price)}`,
      btnBg: "#FFC53D",
      border: "rgba(255,197,61,.5)",
      go: () => runAction("refund"),
    },
    plan: {
      title: `Move ${selCustomer.name} to a different plan`,
      body: "The change starts today. We charge or credit the difference for the rest of this month.",
      btn: "Change plan",
      btnBg: "#4DA3FF",
      border: "#3A404A",
      go: () => runAction("change_plan", { plan }),
    },
    cancel: {
      title: `Cancel ${selCustomer.name}'s subscription?`,
      body: "They keep access until the end of the paid month, then billing stops. Their sites keep every change already shipped. Nothing is deleted.",
      btn: "Cancel subscription",
      btnBg: "#FF8A80",
      border: "rgba(255,90,78,.5)",
      go: () => runAction("cancel"),
    },
  };

  const cf = confirm ? CF[confirm] : null;

  const filters = [
    ["all", "All"],
    ["paying", "Paying"],
    ["trial", "Free trial"],
    ["failed", "Payment failed"],
    ["cancelled", "Cancelled"],
  ];

  return (
    <HqPanel showSample={!live}>
      <div
        style={{
          maxWidth: 1240,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        <section aria-labelledby="list-h" style={{ flex: "1 1 380px", minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <h1
            id="list-h"
            style={{
              margin: 0,
              fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
              fontSize: 34,
              letterSpacing: "-1px",
              fontWeight: 700,
            }}
          >
            Customers
          </h1>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
            Find a customer by name, email or website
            <input
              type="search"
              placeholder="e.g. rivera, dental, @gmail.com"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{
                minHeight: 46,
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid #262A31",
                background: "#101215",
                color: "#F2F4F5",
                font: "inherit",
                fontSize: 15,
              }}
            />
          </label>
          <div role="group" aria-label="Filter by status" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {filters.map(([id, label]) => {
              const on = filter === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilter(id)}
                  style={{
                    minHeight: 34,
                    padding: "0 12px",
                    borderRadius: 999,
                    border: `1px solid ${on ? "#D5F879" : "#262A31"}`,
                    background: on ? "rgba(213,248,121,.1)" : "transparent",
                    color: on ? "#F2F4F5" : "#D7DADE",
                    fontSize: 13,
                    fontWeight: on ? 600 : undefined,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div style={{ borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", padding: 6 }}>
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setSel(r.id);
                  setConfirm(null);
                  setToast("");
                }}
                aria-pressed={r.selected}
                style={{
                  width: "100%",
                  textAlign: "left",
                  font: "inherit",
                  color: "#F2F4F5",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 12,
                  borderRadius: 14,
                  border: `1px solid ${r.selected ? "#3A404A" : "transparent"}`,
                  background: r.selected ? "#1A1D22" : "transparent",
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    width: 34,
                    height: 34,
                    flex: "none",
                    borderRadius: 10,
                    background: "#262A31",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {r.initials}
                </span>
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{r.name}</span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#7D848E",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.domain} · {r.planLabel}
                  </span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: r.color }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.color }} />
                  {r.statusLabel}
                </span>
              </button>
            ))}
            {rows.length === 0 ? (
              <p style={{ margin: 0, padding: 18, fontSize: 14, color: "#9AA1AB" }}>
                No customers match. Try part of their website or email.
              </p>
            ) : null}
          </div>
          <span style={{ fontSize: 12, color: "#7D848E" }}>Showing {rows.length} of {total} customers{live ? "" : " · loading…"}.</span>
        </section>

        <section
          aria-labelledby="acct-h"
          style={{
            flex: "999 1 560px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            animation: "sfy-rise .3s ease both",
          }}
        >
          <div
            style={{
              borderRadius: 22,
              background: "#101215",
              border: "1px solid #1A1D22",
              padding: 22,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
              <span
                style={{
                  width: 52,
                  height: 52,
                  flex: "none",
                  borderRadius: 14,
                  background: "#262A31",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 17,
                  fontWeight: 600,
                }}
              >
                {c.initials}
              </span>
              <span style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 2 }}>
                <h2 id="acct-h" style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>
                  {c.name}
                </h2>
                <span style={{ fontSize: 14, color: "#9AA1AB" }}>
                  {c.owner} · {c.email}
                </span>
                <span style={{ fontSize: 13, color: "#7D848E" }}>
                  Customer since {c.since} · referred by {c.ref}
                </span>
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: 999,
                  color: c.color,
                  background: c.statusBg,
                }}
              >
                {c.status}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
              {[
                ["Plan", c.plan, c.price],
                ["Next invoice", c.next, c.card],
                ["Lifetime paid", c.ltv, c.credit],
                ["Moves shipped", c.moves, c.undo],
              ].map(([label, val, sub]) => (
                <div
                  key={label}
                  style={{
                    borderRadius: 14,
                    background: "#0A0B0D",
                    border: "1px solid #1A1D22",
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 12, color: "#7D848E" }}>{label}</span>
                  <span style={{ fontSize: 17, fontWeight: 600 }}>{val}</span>
                  <span style={{ fontSize: 12, color: "#9AA1AB" }}>{sub}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={busy || !selCustomer.id}
                onClick={() => runAction("impersonate")}
                style={{
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
                Log in as this customer
              </button>
              {[
                ["free", "Give a free month"],
                ["refund", "Refund last payment"],
                ["plan", "Change plan"],
              ].map(([act, label]) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => {
                    setConfirm(act);
                    if (act === "plan") setPlan(selCustomer.plan);
                    setToast("");
                  }}
                  style={{
                    minHeight: 44,
                    padding: "0 16px",
                    borderRadius: 12,
                    border: "1px solid #262A31",
                    background: "transparent",
                    color: "#F2F4F5",
                    fontSize: 14,
                  }}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setConfirm("cancel");
                  setToast("");
                }}
                style={{
                  minHeight: 44,
                  padding: "0 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,90,78,.45)",
                  background: "transparent",
                  color: "#FF8A80",
                  fontSize: 14,
                }}
              >
                Cancel subscription
              </button>
            </div>

            {cf ? (
              <div
                role="alertdialog"
                aria-labelledby="cf-h"
                style={{
                  borderRadius: 16,
                  background: "#131519",
                  border: `1px solid ${cf.border}`,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  animation: "sfy-rise .25s ease both",
                }}
              >
                <h3 id="cf-h" style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                  {cf.title}
                </h3>
                <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>{cf.body}</span>
                {confirm === "plan" ? (
                  <div role="group" aria-label="New plan" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {(["solo", "pro", "premium"]).map((p) => {
                      const on = plan === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setPlan(p)}
                          style={{
                            minHeight: 36,
                            padding: "0 12px",
                            borderRadius: 999,
                            border: `1px solid ${on ? "#D5F879" : "#262A31"}`,
                            background: on ? "rgba(213,248,121,.1)" : "transparent",
                            color: on ? "#F2F4F5" : "#D7DADE",
                            fontSize: 13,
                            fontWeight: on ? 600 : undefined,
                          }}
                        >
                          {PLAN[p][0]} · ${PLAN[p][1]}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                  Reason (saved to the account log)
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
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
                    <option>Customer asked</option>
                    <option>Service problem on our side</option>
                    <option>Goodwill</option>
                    <option>Duplicate or mistaken charge</option>
                  </select>
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={cf.go}
                    style={{
                      minHeight: 42,
                      padding: "0 16px",
                      borderRadius: 12,
                      border: 0,
                      background: cf.btnBg,
                      color: "#0A0B0D",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {cf.btn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirm(null)}
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
                    Keep as is
                  </button>
                </div>
              </div>
            ) : null}
            {toast ? (
              <p role="status" style={{ margin: 0, fontSize: 14, color: "#3DDC84" }}>
                {toast}
              </p>
            ) : null}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "stretch" }}>
            <div
              style={{
                flex: "1 1 300px",
                minWidth: 0,
                borderRadius: 22,
                background: "#101215",
                border: "1px solid #1A1D22",
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Sites and connections</h3>
              {c.sites.map((s) => (
                <div
                  key={s.domain}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "#0A0B0D",
                    border: "1px solid #1A1D22",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{s.domain}</span>
                  <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {s.links.map((l) => (
                      <span
                        key={l.label}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: 999,
                          color: l.color,
                          background: l.bg,
                        }}
                      >
                        {l.label}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
            <div
              style={{
                flex: "1 1 300px",
                minWidth: 0,
                borderRadius: 22,
                background: "#101215",
                border: "1px solid #1A1D22",
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Payments</h3>
              {payments.map((p, i) => (
                <div
                  key={`${p.date}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 2px",
                    borderTop: "1px solid #16181C",
                    fontSize: 13,
                  }}
                >
                  <span style={{ flex: 1, color: "#9AA1AB" }}>{p.date}</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace" }}>{p.amount}</span>
                  <span
                    style={{
                      minWidth: 78,
                      textAlign: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 999,
                      color: p.color,
                      background: p.bg,
                    }}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              borderRadius: 22,
              background: "#101215",
              border: "1px solid #1A1D22",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Account log</h3>
            {log.map((g, i) => (
              <div
                key={`${g.when}-${i}`}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "8px 2px",
                  borderTop: "1px solid #16181C",
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    width: 110,
                    flex: "none",
                    color: "#7D848E",
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: 12,
                  }}
                >
                  {g.when}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>{g.text}</span>
                <span style={{ color: "#7D848E" }}>{g.who}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </HqPanel>
  );
}
