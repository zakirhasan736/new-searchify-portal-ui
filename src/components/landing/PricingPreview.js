"use client";

import SearchifyMark from "@/components/landing/SearchifyMark";
import "@/styles/v8-pricing-preview.css";

const KIND_COLOR = {
  dire: "#FF5A4E",
  medium: "#FFC53D",
  passes: "#3DDC84",
  locked: "#4DA3FF",
};

const PREVIEWS = {
  solo: {
    header: "1 WEBSITE",
    sitesLabel: "YOUR SITE",
    sites: [{ name: "Your website", kind: "medium" }],
    boardLabel: "YOUR WEBSITE · 32 PAGES",
    board: { dire: 4, medium: 8, passes: 17, locked: 3 },
    moves: [
      { kind: "dire", label: "META", title: "Add meta descriptions to 12 pages", why: "Pages show blank snippets in Google" },
      { kind: "dire", label: "TITLE", title: "Rewrite the title on your main service page", why: "It hides the words people search for" },
      { kind: "medium", label: "LINKS", title: "Fix 3 broken internal links", why: "Visitors hit dead ends" },
    ],
    widgets: [
      { label: "Pages passing", value: "17 → 20", bar: 62, color: "#3DDC84" },
      { label: "Tracked keywords", value: "10", bar: 40, color: "#4DA3FF" },
      { label: "Monthly PDF report", value: "Ready", bar: 100, color: "#2CC7C0" },
    ],
  },
  pro: {
    header: "5 WEBSITES · AUTOPILOT ON FOR LOW-RISK FIXES",
    sitesLabel: "YOUR SITES",
    sites: [
      { name: "Main site", kind: "dire" },
      { name: "Online shop", kind: "medium" },
      { name: "Booking site", kind: "passes" },
      { name: "Second location", kind: "medium" },
      { name: "Careers", kind: "passes" },
    ],
    boardLabel: "MAIN SITE · 32 PAGES",
    board: { dire: 5, medium: 9, passes: 14, locked: 4 },
    moves: [
      { kind: "dire", label: "TITLE", title: "Rewrite the title on your top service page", why: "Ranks 11th, one spot off page one" },
      { kind: "medium", label: "AI ANSWERS", title: "Add FAQ schema to 4 booking pages", why: "Helps you show up in AI answers" },
      {
        kind: "passes",
        label: "AUTOPILOT",
        title: "Added alt text to 6 images automatically",
        why: "Low-risk fix handled by autopilot, still undoable",
        doneText: "Shipped by autopilot · live check passed · undo available",
      },
    ],
    widgets: [
      { label: "Calls and leads from Analytics", value: "+14 this month", bar: 70, color: "#3DDC84" },
      { label: "Mentioned in AI answers", value: "3 of 10 questions", bar: 30, color: "#4DA3FF" },
      { label: "Client report sent", value: "Mon 9:00", bar: 100, color: "#2CC7C0" },
    ],
  },
  agency: {
    header: "ALL CLIENTS · 18 OF 25 WEBSITES",
    sitesLabel: "CLIENTS",
    sites: [
      { name: "Northgate Roofing", kind: "dire" },
      { name: "Harbour Physio", kind: "passes" },
      { name: "Bloom Florists", kind: "passes" },
      { name: "Peak Accounting", kind: "medium" },
      { name: "+ 14 more", kind: "locked" },
    ],
    boardLabel: "NORTHGATE ROOFING · 32 PAGES",
    board: { dire: 6, medium: 7, passes: 15, locked: 4 },
    moves: [
      { kind: "dire", label: "ALERT", title: "Northgate Roofing: 5 pages dropped overnight", why: "Flagged first so you see it before the client does" },
      {
        kind: "medium",
        label: "BATCH",
        title: "Approve 9 fixes across 4 clients",
        why: "Batched into one review",
        doneText: "9 approved · live checks passed · undo available",
      },
      {
        kind: "passes",
        label: "WHITE-LABEL",
        title: "Monthly reports sent under your logo",
        why: "No Searchify name anywhere",
        doneText: "18 client reports delivered",
      },
    ],
    widgets: [
      { label: "Reports with your branding", value: "18 sent", bar: 100, color: "#2CC7C0" },
      { label: "Client logins active", value: "41", bar: 65, color: "#4DA3FF" },
      { label: "Team seats", value: "4 teammates", bar: 45, color: "#3DDC84" },
    ],
  },
};

function boardDots(board) {
  const dots = [];
  const push = (kind, n, lit = false) => {
    for (let i = 0; i < n; i += 1) dots.push({ kind, lit: lit && i < Math.min(2, n) });
  };
  push("dire", board.dire || 0, true);
  push("medium", board.medium || 0, true);
  push("passes", board.passes || 0, false);
  push("locked", board.locked || 0, false);
  while (dots.length < 32) dots.push({ kind: "passes", lit: false });
  return dots.slice(0, 32);
}

export default function PricingPreview({ planId = "pro", planName = "Pro", onPickPlan, plans = [] }) {
  const id = planId === "premium" ? "agency" : planId;
  const data = PREVIEWS[id] || PREVIEWS.pro;
  const tabs = plans.length
    ? plans
    : [
        { id: "solo", name: "Solo" },
        { id: "pro", name: "Pro" },
        { id: "agency", name: "Agency" },
      ];
  const lead = id === "agency" ? "Your Monday on" : "Your first week on";
  const dots = boardDots(data.board);
  const direCount = data.board.dire || 0;

  return (
    <section className="v8-pricing-preview" aria-label="Plan preview">
      <div className="v8-pricing-preview-inner">
        <div className="v8-pricing-preview-intro">
          <p className="v8-pricing-preview-kicker">SEE IT BEFORE YOU PICK</p>
          <h2>
            {lead} <span>{planName}</span>
          </h2>
          <p>Watch Searchify suggest each move, wait for your approval, and turn red pages green.</p>
          <div className="v8-pricing-preview-tabs" role="group" aria-label="Preview a plan">
            {tabs.map((t) => {
              const on = t.id === id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  className={on ? "is-on" : ""}
                  onClick={() => onPickPlan?.(t.id)}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="v8-pricing-preview-frame">
          <div className="v8-pricing-preview-top">
            <div className="v8-pricing-preview-brand">
              <SearchifyMark size={36} />
              <span>searchify</span>
            </div>
            <span className="v8-pricing-preview-header">{data.header}</span>
          </div>

          <div className="v8-pricing-preview-body">
            <div className="v8-pricing-preview-board">
              <p className="v8-pricing-preview-mono">{data.sitesLabel}</p>
              <div className="v8-pricing-preview-sites">
                {data.sites.map((s) => (
                  <span key={s.name}>
                    <i style={{ background: KIND_COLOR[s.kind] || KIND_COLOR.medium }} />
                    {s.name}
                  </span>
                ))}
              </div>
              <div className="v8-pricing-preview-board-meta">
                <span>{data.boardLabel}</span>
                <span style={{ color: "#FF5A4E" }}>SHOWING {direCount} DIRE</span>
              </div>
              <div className="v8-pricing-preview-dots" aria-hidden="true">
                {dots.map((d, i) => (
                  <span
                    key={`${d.kind}-${i}`}
                    className={d.lit ? "is-lit" : ""}
                    style={{
                      background: KIND_COLOR[d.kind] || KIND_COLOR.passes,
                      opacity: d.lit ? 1 : 0.18,
                      boxShadow: d.lit ? `0 0 12px ${KIND_COLOR[d.kind]}` : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="v8-pricing-preview-side">
              <p className="v8-pricing-preview-mono">TODAY&apos;S MOVES</p>
              <ul className="v8-pricing-preview-moves">
                {data.moves.map((m) => (
                  <li key={m.title}>
                    <span className="v8-pricing-preview-move-tag" style={{ color: KIND_COLOR[m.kind] }}>
                      {m.label}
                    </span>
                    <strong>{m.title}</strong>
                    <span>{m.doneText || m.why}</span>
                  </li>
                ))}
              </ul>
              <div className="v8-pricing-preview-widgets">
                {data.widgets.map((w) => (
                  <div key={w.label}>
                    <span>{w.label}</span>
                    <strong style={{ color: w.color }}>{w.value}</strong>
                    <i>
                      <b style={{ width: `${w.bar}%`, background: w.color }} />
                    </i>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="v8-pricing-preview-note">EXAMPLE PREVIEW · YOUR NUMBERS WILL DIFFER</p>
      </div>
    </section>
  );
}
