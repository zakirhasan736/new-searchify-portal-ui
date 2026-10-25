"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import HqPanel from "@/components/admin/HqPanel";
import { getHqProblems, hqProblemAction } from "@/lib/hqApi";

const SEV = {
  URGENT: ["#FF8A80", "rgba(255,90,78,.16)"],
  HIGH: ["#FFC53D", "rgba(255,197,61,.14)"],
  MEDIUM: ["#4DA3FF", "rgba(77,163,255,.14)"],
  LOW: ["#9AA1AB", "rgba(154,161,171,.12)"],
};

const CAT = [
  ["all", "All open"],
  ["payment", "Failed payments"],
  ["chargeback", "Chargebacks"],
  ["connection", "Broken connections"],
  ["job", "Stuck jobs"],
  ["rollback", "Rolled back"],
];

export default function HqProblems() {
  const [cat, setCat] = useState("all");
  const [done, setDone] = useState({});
  const [emailed, setEmailed] = useState({});
  const [notes, setNotes] = useState({});
  const [itemsSrc, setItemsSrc] = useState([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getHqProblems().then((res) => {
      if (cancelled || !res.ok) return;
      if (Array.isArray(res.data?.items)) setItemsSrc(res.data.items);
      setDone(res.data?.done || {});
      setEmailed(res.data?.emailed || {});
      setLive(Boolean(res.data?.live));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const act = async (id, action) => {
    const res = await hqProblemAction(id, action);
    if (!res.ok) {
      setNotes((n) => ({ ...n, [id]: typeof res.data?.detail === "string" ? res.data.detail : "That did not work." }));
      return;
    }
    if (res.data?.done) setDone(res.data.done);
    // Only what the server confirms: an email counts as sent only when the mail server accepted it.
    if (res.data?.emailed) setEmailed(res.data.emailed);
    if (res.data?.message) setNotes((n) => ({ ...n, [id]: res.data.message }));
    setLive(true);
  };

  const open = useMemo(() => itemsSrc.filter((i) => !done[i.id]), [done, itemsSrc]);
  const openCount = String(open.length);

  const cats = CAT.map(([id, label]) => {
    const n = id === "all" ? open.length : open.filter((i) => i.cat === id).length;
    const on = cat === id;
    return {
      id,
      label,
      count: String(n),
      color: n === 0 ? "#3DDC84" : id === "chargeback" || id === "payment" ? "#FF8A80" : "#F2F4F5",
      on,
    };
  });

  const shown = itemsSrc.filter((i) => (cat === "all" ? true : i.cat === cat)).filter((i) => (cat === "all" ? !done[i.id] : true));

  const items = shown.map((i) => {
    const d = !!done[i.id];
    const em = !!emailed[i.id];
    return {
      ...i,
      sevColor: SEV[i.sev][0],
      sevBg: SEV[i.sev][1],
      isOpen: !d,
      isDone: d || em || !!notes[i.id],
      doneText: notes[i.id] || (d ? "Resolved." : em ? "Email sent to the customer." : ""),
      canEmail: !!i.email,
    };
  });

  const headline = open.length
    ? `${open.length} problem${open.length === 1 ? "" : "s"} open. ${(() => {
        const urgent = open.filter((i) => i.sev === "URGENT" || i.sev === "HIGH").length;
        return urgent ? `${urgent} high priority.` : "Nothing urgent.";
      })()}`
    : "All clear.";

  const nDone = Object.keys(done).length;
  const resolvedLine = nDone ? `${nDone} resolved so far today.` : "Nothing resolved yet today.";

  const dunning = [
    { day: "Day 0", what: "Charge fails. Customer gets a friendly email with a one-click card update." },
    { day: "Day 3", what: "Automatic retry and second email." },
    { day: "Day 7", what: "Retry, plus a banner inside their dashboard." },
    { day: "Day 14", what: "Final retry. If it fails, new moves pause. Nothing already shipped is touched." },
  ];

  return (
    <HqPanel problemsCount={openCount} showSample={!live}>
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
          {headline}
        </h1>
        <span style={{ fontSize: 15, color: "#9AA1AB" }}>
          Billing, connections and automation problems, worst first. Customers see a friendly version of each one in their own dashboard.
        </span>
      </div>

      <section
        aria-label="Problem types"
        style={{
          maxWidth: 1240,
          width: "100%",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 10,
        }}
      >
        {cats.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setCat(k.id)}
            aria-pressed={k.on}
            style={{
              textAlign: "left",
              font: "inherit",
              color: "#F2F4F5",
              borderRadius: 16,
              padding: "14px 16px",
              background: k.on ? "rgba(213,248,121,.06)" : "#101215",
              border: `1px solid ${k.on ? "#D5F879" : "#1A1D22"}`,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <span style={{ fontSize: 13, color: "#9AA1AB" }}>{k.label}</span>
            <span
              style={{
                fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                fontSize: 28,
                fontWeight: 800,
                lineHeight: 1,
                color: k.color,
              }}
            >
              {k.count}
            </span>
          </button>
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
          alignItems: "flex-start",
        }}
      >
        <section aria-label="Queue" style={{ flex: "999 1 640px", minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((i) => (
            <article
              key={i.id}
              style={{
                borderRadius: 18,
                background: "#101215",
                border: "1px solid #1A1D22",
                padding: "16px 18px",
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
                flexWrap: "wrap",
                animation: "sfy-rise .25s ease both",
              }}
            >
              <span
                style={{
                  flex: "none",
                  marginTop: 2,
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "4px 8px",
                  borderRadius: 6,
                  color: i.sevColor,
                  background: i.sevBg,
                }}
              >
                {i.sev}
              </span>
              <div style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{i.title}</span>
                <span style={{ fontSize: 13, color: "#9AA1AB" }}>
                  {i.who} · {i.since}
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.5, color: "#D7DADE" }}>{i.detail}</span>
                {i.isDone ? (
                  <span role="status" style={{ fontSize: 13, color: "#3DDC84" }}>
                    {i.doneText}
                  </span>
                ) : null}
              </div>
              {i.isOpen ? (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => act(i.id, "resolve")}
                    style={{
                      minHeight: 40,
                      padding: "0 14px",
                      borderRadius: 11,
                      border: 0,
                      background: "#D5F879",
                      color: "#0A0B0D",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Mark resolved
                  </button>
                  {i.canEmail ? (
                  <button
                    type="button"
                    onClick={() => act(i.id, "email")}
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
                    {i.primaryLabel || "Email customer"}
                  </button>
                  ) : null}
                  <Link
                    href="/admin/hq/customers"
                    style={{
                      minHeight: 40,
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "0 12px",
                      fontSize: 13,
                      color: "#9AA1AB",
                      textDecoration: "none",
                    }}
                  >
                    Open account
                  </Link>
                </div>
              ) : null}
            </article>
          ))}
          {items.length === 0 ? (
            <p
              style={{
                margin: 0,
                padding: 24,
                borderRadius: 18,
                background: "#101215",
                border: "1px solid #1A1D22",
                fontSize: 15,
                color: "#3DDC84",
              }}
            >
              Nothing open here.
            </p>
          ) : null}
        </section>

        <aside aria-label="Rules" style={{ flex: "1 1 300px", minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              borderRadius: 20,
              background: "#101215",
              border: "1px solid #1A1D22",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>When a card is declined</h2>
            <span style={{ fontSize: 12, color: "#7D848E" }}>
              The plan once a payment provider is connected. Until then, retries and emails are done by hand from this page.
            </span>
            {dunning.map((d) => (
              <div key={d.day} style={{ display: "flex", gap: 12, fontSize: 13, lineHeight: 1.45 }}>
                <span style={{ width: 54, flex: "none", fontFamily: "'Geist Mono', monospace", color: "#D5F879" }}>{d.day}</span>
                <span style={{ color: "#D7DADE" }}>{d.what}</span>
              </div>
            ))}
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
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Today</h2>
            <span style={{ fontSize: 14, color: "#D7DADE" }}>{resolvedLine}</span>
            <span style={{ fontSize: 13, color: "#7D848E" }}>
              Every action here is saved to the customer&apos;s account log with your name.
            </span>
          </div>
        </aside>
      </div>
    </HqPanel>
  );
}
