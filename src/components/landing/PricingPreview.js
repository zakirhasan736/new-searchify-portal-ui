"use client";

import { useEffect, useMemo, useState } from "react";
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
      { kind: "dire", label: "META", fixes: "dire", title: "Add meta descriptions to 12 pages", why: "Pages show blank snippets in Google" },
      { kind: "dire", label: "TITLE", fixes: "dire", title: "Rewrite the title on your main service page", why: "It hides the words people search for" },
      { kind: "medium", label: "LINKS", fixes: "medium", title: "Fix 3 broken internal links", why: "Visitors hit dead ends" },
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
      { kind: "dire", label: "TITLE", fixes: "dire", title: "Rewrite the title on your top service page", why: "Ranks 11th, one spot off page one" },
      { kind: "medium", label: "AI ANSWERS", fixes: "medium", title: "Add FAQ schema to 4 booking pages", why: "Helps you show up in AI answers" },
      {
        kind: "passes",
        label: "AUTOPILOT",
        fixes: "passes",
        title: "Added alt text to 6 images automatically",
        why: "Low-risk fix handled by autopilot, still undoable",
        doneText: "Shipped by autopilot · live check passed · undo available",
        autoDone: true,
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
      { kind: "dire", label: "ALERT", fixes: "dire", title: "Northgate Roofing: 5 pages dropped overnight", why: "Flagged first so you see it before the client does" },
      {
        kind: "medium",
        label: "BATCH",
        fixes: "medium",
        title: "Approve 9 fixes across 4 clients",
        why: "Batched into one review",
        doneText: "9 approved · live checks passed · undo available",
      },
      {
        kind: "passes",
        label: "WHITE-LABEL",
        fixes: "passes",
        title: "Monthly reports sent under your logo",
        why: "No Searchify name anywhere",
        doneText: "18 client reports delivered",
        autoDone: true,
      },
    ],
    widgets: [
      { label: "Reports with your branding", value: "18 sent", bar: 100, color: "#2CC7C0" },
      { label: "Client logins active", value: "41", bar: 65, color: "#4DA3FF" },
      { label: "Team seats", value: "4 teammates", bar: 45, color: "#3DDC84" },
    ],
  },
};

function shuffleKinds(board) {
  const kinds = [];
  ["dire", "medium", "passes", "locked"].forEach((k) => {
    for (let i = 0; i < (board[k] || 0); i += 1) kinds.push(k);
  });
  let seed = 7;
  for (let i = kinds.length - 1; i > 0; i -= 1) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    const tmp = kinds[i];
    kinds[i] = kinds[j];
    kinds[j] = tmp;
  }
  while (kinds.length < 32) kinds.push("passes");
  return kinds.slice(0, 32);
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4DA3FF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

/**
 * Exact PricingPreview.html / PricingPreview.dc.html product mock.
 * Tabs sync with Pricing plan selection; Approve demos the approve → green-dot flow.
 */
export default function PricingPreview({
  planId = "pro",
  planName = "Pro",
  onPickPlan,
  onChoosePlan,
  plans = [],
}) {
  const id = planId === "premium" ? "agency" : planId;
  const data = PREVIEWS[id] || PREVIEWS.pro;
  const tabs = plans.length
    ? plans.map((t) => ({
        id: t.id === "premium" ? "agency" : t.id,
        name: t.name,
        catalogId: t.id === "agency" ? "premium" : t.id === "premium" ? "premium" : t.id,
      }))
    : [
        { id: "solo", name: "Solo", catalogId: "solo" },
        { id: "pro", name: "Pro", catalogId: "pro" },
        { id: "agency", name: "Agency", catalogId: "premium" },
      ];

  const lead = id === "agency" ? "Your Monday on" : "Your first week on";
  const board = data.board || { dire: 0, medium: 0, passes: 0, locked: 0 };
  const kinds = useMemo(() => shuffleKinds(board), [id, board.dire, board.medium, board.passes, board.locked]);

  const [approved, setApproved] = useState(() => new Set());
  const [playKey, setPlayKey] = useState(0);

  useEffect(() => {
    // Restart the demo animation whenever the selected plan changes.
    const auto = new Set();
    (data.moves || []).forEach((m, i) => {
      if (m.autoDone) auto.add(i);
    });
    setApproved(auto);
    setPlayKey((k) => k + 1);
  }, [id]);

  const fixAt = useMemo(() => {
    const map = {};
    (data.moves || []).forEach((m, i) => {
      if (!m.fixes) return;
      if (!approved.has(i) && !m.autoDone) return;
      for (let k = 0; k < kinds.length; k += 1) {
        if (kinds[k] === m.fixes && map[k] === undefined) {
          map[k] = 0.35 + i * 0.25;
          break;
        }
      }
    });
    return map;
  }, [approved, data.moves, kinds]);

  const direLeft = kinds.filter((k, i) => k === "dire" && fixAt[i] === undefined).length;

  const pickTab = (tab) => {
    onPickPlan?.(tab.catalogId || (tab.id === "agency" ? "premium" : tab.id));
  };

  const approveMove = (index) => {
    setApproved((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  const chooseThisPlan = () => {
    const catalogId = id === "agency" ? "premium" : id;
    onPickPlan?.(catalogId);
    onChoosePlan?.(catalogId);
    if (typeof document !== "undefined") {
      document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="v8-pricing-preview" id="preview" aria-label="Plan preview">
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
                  onClick={() => pickTab(t)}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="v8-pricing-preview-frame" key={`${id}-${playKey}`}>
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
                {data.sites.map((s, i) => (
                  <span key={s.name} className="sf-in" style={{ animationDelay: `${0.05 + i * 0.08}s` }}>
                    <i style={{ background: KIND_COLOR[s.kind] || KIND_COLOR.medium }} />
                    {s.name}
                  </span>
                ))}
              </div>

              <div className="v8-pricing-preview-board-meta">
                <span>{data.boardLabel}</span>
                <span style={{ color: "#FF5A4E" }}>SHOWING {direLeft} DIRE</span>
              </div>

              <div className="v8-pricing-preview-dots" aria-hidden="true">
                {kinds.map((k, i) => {
                  const col = KIND_COLOR[k] || KIND_COLOR.passes;
                  const lit = k === "dire";
                  const fixed = fixAt[i] !== undefined;
                  return (
                    <span key={`${k}-${i}`} className="sf-in v8-pricing-preview-dot" style={{ animationDelay: `${0.05 + i * 0.02}s` }}>
                      <span
                        className="v8-pricing-preview-dot-base"
                        style={{
                          background: col,
                          opacity: lit ? 1 : 0.18,
                          boxShadow: lit ? `0 0 12px ${col}` : "none",
                        }}
                      />
                      {fixed ? (
                        <span
                          className="sf-pop v8-pricing-preview-dot-fix"
                          style={{
                            background: KIND_COLOR.passes,
                            boxShadow: `0 0 14px ${KIND_COLOR.passes}`,
                            animationDelay: `${fixAt[i]}s`,
                          }}
                        />
                      ) : null}
                    </span>
                  );
                })}
              </div>

              <div className="v8-pricing-preview-legend">
                {[
                  { label: `DIRE ${direLeft}`, color: KIND_COLOR.dire, lit: direLeft > 0 },
                  { label: `MEDIUM ${board.medium}`, color: KIND_COLOR.medium },
                  { label: `PASSES ${board.passes}`, color: KIND_COLOR.passes },
                  { label: `LOCKED ${board.locked}`, color: KIND_COLOR.locked },
                ].map((l) => (
                  <span key={l.label}>
                    <i
                      style={{
                        background: l.color,
                        boxShadow: l.lit ? `0 0 8px ${l.color}` : "none",
                        opacity: l.lit ? 1 : 0.6,
                      }}
                    />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="v8-pricing-preview-side">
              <p className="v8-pricing-preview-mono">NEXT BEST MOVES · ONE AT A TIME</p>
              <ul className="v8-pricing-preview-moves">
                {(data.moves || []).map((m, i) => {
                  const col = KIND_COLOR[m.kind] || KIND_COLOR.passes;
                  const done = approved.has(i) || m.autoDone;
                  const enterDelay = 0.9 + i * 0.6;
                  return (
                    <li key={m.title} className="sf-in" style={{ animationDelay: `${enterDelay.toFixed(2)}s` }}>
                      <div className="v8-pricing-preview-move-row">
                        <i style={{ background: col, boxShadow: `0 0 10px ${col}` }} />
                        <div>
                          <span className="v8-pricing-preview-move-tag" style={{ color: col }}>
                            {(m.kind || "").toUpperCase()} · {m.label}
                          </span>
                          <strong>{m.title}</strong>
                          <span className="v8-pricing-preview-move-why">{m.why}</span>
                        </div>
                      </div>
                      {done ? (
                        <p className="sf-in v8-pricing-preview-done" style={{ animationDelay: m.autoDone ? "0.2s" : "0.15s" }}>
                          <CheckIcon />
                          {m.doneText || "Approved · live check passed · undo available"}
                        </p>
                      ) : (
                        <button type="button" className="v8-pricing-preview-approve" onClick={() => approveMove(i)}>
                          Approve this move
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="v8-pricing-preview-month">
            <p className="v8-pricing-preview-mono">THIS MONTH</p>
            <div className="v8-pricing-preview-widgets">
              {(data.widgets || []).map((w, i) => (
                <div key={w.label}>
                  <span>{w.label}</span>
                  <strong>{w.value}</strong>
                  <i>
                    <b className="sf-bar" style={{ width: `${w.bar}%`, background: w.color, animationDelay: `${(1 + i * 0.3).toFixed(2)}s` }} />
                  </i>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="v8-pricing-preview-actions">
          <p className="v8-pricing-preview-note">EXAMPLE PREVIEW · YOUR NUMBERS WILL DIFFER</p>
          <button type="button" className="v8-pricing-preview-cta" onClick={chooseThisPlan}>
            Choose {planName} · continue to order
          </button>
        </div>
      </div>
    </section>
  );
}
