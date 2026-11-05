"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import HqPanel from "@/components/admin/HqPanel";
import { getHqCancellations, hqCancellationAction } from "@/lib/hqApi";

const FILTERS = [
  ["needs", "Needs a reply"],
  ["left", "Left"],
  ["stayed", "Stayed or paused"],
  ["all", "All"],
];

export default function HqCancellations() {
  const [api, setApi] = useState(null);
  const [filter, setFilter] = useState("needs");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState("");
  const [desk, setDesk] = useState({ done: {}, product: {}, replied: {} });

  const load = () =>
    getHqCancellations().then((res) => {
      if (res.ok) setApi(res.data);
    });

  useEffect(() => {
    let cancelled = false;
    getHqCancellations().then((res) => {
      if (!cancelled && res.ok) setApi(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const d = api || {};
  const comments = useMemo(() => {
    const rows = d.comments || [];
    return rows.filter((c) => {
      if (desk.done?.[c.id]) return filter === "all";
      if (filter === "all") return true;
      if (filter === "needs") return c.needsReply && !desk.replied?.[c.id];
      if (filter === "left") return c.outcome === "left";
      if (filter === "stayed") return c.outcome === "stayed";
      return true;
    });
  }, [d.comments, filter, desk]);

  const act = async (id, action, extra = {}) => {
    setBusy(id + action);
    const res = await hqCancellationAction(id, { action, ...extra });
    setBusy("");
    if (res.ok) {
      setDesk({
        done: res.data?.done || desk.done,
        product: res.data?.product || desk.product,
        replied: res.data?.replied || desk.replied,
      });
      setToast(res.data?.message || "Saved.");
      load();
    } else {
      setToast(typeof res.data?.detail === "string" ? res.data.detail : "Could not save.");
    }
  };

  const maxReason = Math.max(1, ...(d.reasons || []).map((r) => r.total || 0));

  return (
    <HqPanel
      shellGap={22}
      minHeight={1300}
      showSample={!d.live}
      problemsCount={d.problemsCount || "9"}
      cancellationsCount={String(d.openCount ?? ((d.comments || []).filter((c) => c.needsReply).length || 4))}
      headerExtra={
        toast ? (
          <span role="status" style={{ fontSize: 13, color: "#3DDC84" }}>
            {toast}
          </span>
        ) : null
      }
    >
      <div style={{ maxWidth: 1240, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 6 }}>
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
          {d.headline || "Cancellations and why"}
        </h1>
        <span style={{ fontSize: 15, color: "#9AA1AB" }}>
          {d.sub || "Every reason and comment from the customer cancel flow."}
        </span>
      </div>

      <section
        aria-label="This month"
        style={{
          maxWidth: 1240,
          width: "100%",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12,
        }}
      >
        {(d.kpis || []).map((k) => (
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

      <div style={{ maxWidth: 1240, width: "100%", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "stretch" }}>
        <section
          aria-labelledby="why-h"
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
            <h2 id="why-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
              Why they wanted to leave · last 90 days
            </h2>
            <span style={{ display: "inline-flex", gap: 14, fontSize: 12, color: "#9AA1AB" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "#3DDC84" }} />
                Stayed
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: "#5B616B" }} />
                Left
              </span>
            </span>
          </div>
          {(d.reasons || []).map((r) => {
            const stayedPct = maxReason ? (100 * (r.stayed || 0)) / maxReason : 0;
            const leftPct = maxReason ? (100 * (r.left || 0)) / maxReason : 0;
            return (
              <div
                key={r.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(150px, 220px) minmax(0, 1fr) 92px",
                  gap: 12,
                  alignItems: "center",
                  fontSize: 14,
                }}
              >
                <span>{r.label}</span>
                <span style={{ display: "flex", height: 14, borderRadius: 7, background: "#16181C", overflow: "hidden" }}>
                  <span style={{ height: "100%", width: `${stayedPct}%`, background: "#3DDC84" }} />
                  <span style={{ height: "100%", width: `${leftPct}%`, background: "#5B616B" }} />
                </span>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: "#D7DADE", textAlign: "right" }}>
                  {r.total} · {r.keptPct}% kept
                </span>
              </div>
            );
          })}
          {d.reasonsNote ? <span style={{ fontSize: 12, color: "#7D848E", paddingTop: 4 }}>{d.reasonsNote}</span> : null}
        </section>

        <section
          aria-labelledby="off-h"
          style={{
            flex: "1 1 360px",
            minWidth: 0,
            borderRadius: 22,
            background: "#101215",
            border: "1px solid #1A1D22",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <h2 id="off-h" style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 600 }}>
            Which offers work
          </h2>
          <div
            aria-hidden="true"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 54px 54px 54px",
              gap: 8,
              fontFamily: "'Geist Mono', monospace",
              fontSize: 11,
              color: "#7D848E",
            }}
          >
            <span>OFFER</span>
            <span style={{ textAlign: "right" }}>SHOWN</span>
            <span style={{ textAlign: "right" }}>TAKEN</span>
            <span style={{ textAlign: "right" }}>RATE</span>
          </div>
          {(d.offers || []).map((o) => {
            const rateColor = o.rate >= 50 ? "#3DDC84" : o.rate >= 30 ? "#FFC53D" : "#FF8A80";
            return (
              <div
                key={o.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) 54px 54px 54px",
                  gap: 8,
                  alignItems: "center",
                  padding: "9px 0",
                  borderTop: "1px solid #16181C",
                  fontSize: 14,
                }}
              >
                <span>{o.label}</span>
                <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace", color: "#9AA1AB" }}>{o.shown}</span>
                <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace" }}>{o.taken}</span>
                <span style={{ textAlign: "right", fontFamily: "'Geist Mono', monospace", color: rateColor }}>{o.rate}%</span>
              </div>
            );
          })}
        </section>
      </div>

      <div style={{ maxWidth: 1240, width: "100%", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
        <section aria-labelledby="said-h" style={{ flex: "999 1 640px", minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <h2 id="said-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
              What they said
            </h2>
            <div
              role="group"
              aria-label="Filter comments"
              style={{
                display: "inline-flex",
                padding: 4,
                borderRadius: 12,
                background: "#131519",
                border: "1px solid #262A31",
                flexWrap: "wrap",
              }}
            >
              {FILTERS.map(([id, label]) => {
                const on = filter === id;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFilter(id)}
                    style={{
                      minHeight: 36,
                      padding: "0 12px",
                      borderRadius: 9,
                      border: 0,
                      background: on ? "#262A31" : "transparent",
                      color: on ? "#F2F4F5" : "#9AA1AB",
                      fontSize: 13,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {comments.length === 0 ? (
            <p style={{ margin: 0, fontSize: 14, color: "#9AA1AB" }}>No comments in this filter.</p>
          ) : (
            comments.map((c) => {
              const left = c.outcome === "left";
              return (
                <article
                  key={c.id}
                  style={{
                    borderRadius: 18,
                    background: "#101215",
                    border: "1px solid #1A1D22",
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily: "'Geist Mono', monospace",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "4px 8px",
                        borderRadius: 6,
                        color: left ? "#FF8A80" : "#3DDC84",
                        background: left ? "rgba(255,90,78,.14)" : "rgba(61,220,132,.12)",
                      }}
                    >
                      {left ? "LEFT" : "STAYED"}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</span>
                    <span style={{ fontSize: 13, color: "#9AA1AB" }}>{c.meta}</span>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "#7D848E" }}>{c.when}</span>
                  </div>
                  <span style={{ fontSize: 13, color: "#D7DADE" }}>
                    <span style={{ color: "#7D848E" }}>Reason:</span> {c.reason}
                  </span>
                  <span style={{ fontSize: 15, lineHeight: 1.5, color: "#F2F4F5" }}>“{c.quote}”</span>
                  <span style={{ fontSize: 13, color: "#9AA1AB" }}>{c.note}</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", paddingTop: 2 }}>
                    <button
                      type="button"
                      disabled={busy === c.id + "reply"}
                      onClick={() => act(c.id, "reply", { email: c.email, note: `Hi — thanks for the note about Searchify. We're looking into it.\n\n— Searchify` })}
                      style={{
                        minHeight: 40,
                        padding: "0 14px",
                        borderRadius: 11,
                        border: 0,
                        background: "#4DA3FF",
                        color: "#0A0B0D",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {desk.replied?.[c.id] ? "Replied" : "Reply personally"}
                    </button>
                    {c.toProduct ? (
                      <button
                        type="button"
                        disabled={busy === c.id + "product"}
                        onClick={() => act(c.id, "product")}
                        style={{
                          minHeight: 40,
                          padding: "0 14px",
                          borderRadius: 11,
                          border: "1px solid #262A31",
                          background: "transparent",
                          color: "#F2F4F5",
                          fontSize: 13,
                        }}
                      >
                        {desk.product?.[c.id] ? "On product list" : "Send to product"}
                      </button>
                    ) : null}
                    <Link
                      href={c.customerId ? `/admin/hq/customers?q=${encodeURIComponent(c.name)}` : "/admin/hq/customers"}
                      style={{ minHeight: 40, display: "inline-flex", alignItems: "center", padding: "0 12px", fontSize: 13, color: "#9AA1AB" }}
                    >
                      Open account
                    </Link>
                    <button
                      type="button"
                      disabled={busy === c.id + "done" || desk.done?.[c.id]}
                      onClick={() => act(c.id, "done")}
                      style={{
                        minHeight: 40,
                        padding: "0 12px",
                        borderRadius: 11,
                        border: 0,
                        background: "transparent",
                        color: "#7D848E",
                        fontSize: 13,
                      }}
                    >
                      {desk.done?.[c.id] ? "Done" : "Mark done"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <aside aria-label="Requests and follow-ups" style={{ flex: "1 1 300px", minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Asked for on the way out</h2>
            {(d.requests || []).map((r) => (
              <div
                key={r.label}
                style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 14, padding: "6px 0", borderTop: "1px solid #16181C" }}
              >
                <span>{r.label}</span>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: "#4DA3FF" }}>{r.count}</span>
              </div>
            ))}
            <span style={{ fontSize: 12, color: "#7D848E" }}>
              When one ships, everyone who asked for it gets an email and a free month to come back.
            </span>
          </div>
          <div style={{ borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>After someone cancels</h2>
            {(d.followUps || []).map((f) => (
              <div key={f.when} style={{ display: "flex", gap: 12, fontSize: 13, lineHeight: 1.45 }}>
                <span style={{ width: 66, flex: "none", fontFamily: "'Geist Mono', monospace", color: "#4DA3FF" }}>{f.when}</span>
                <span style={{ color: "#D7DADE" }}>{f.text}</span>
              </div>
            ))}
          </div>
          <div style={{ borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", padding: 18, display: "flex", flexDirection: "column", gap: 6 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>House rules for the cancel flow</h2>
            <span style={{ fontSize: 13, color: "#D7DADE", lineHeight: 1.5 }}>
              {d.houseRule ||
                "One reason screen, at most two offers, and “continue cancelling” always one tap away."}
            </span>
          </div>
        </aside>
      </div>
    </HqPanel>
  );
}
