"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SearchifyMarkSvg from "@/components/v8/SearchifyMarkSvg";
import PhoneTabBar from "@/components/v8/PhoneTabBar";
import { activeSiteContext } from "@/lib/siteContext";
import { queueItemsFromChanges } from "@/lib/v8LiveData";
import { approveChange, dismissChange, executeChange, featurePayload, listChanges, loadFeature } from "@/lib/v1Api";
import { loadJourney } from "@/lib/journey";
import "@/styles/v8-phone.css";

function mapChangeToMove(c) {
  const proposed = c.proposed || {};
  const ct = String(c.changeType || "change").toUpperCase();
  let path = "/";
  try {
    path = new URL(c.targetUrl).pathname || "/";
  } catch {
    path = c.targetUrl || "/";
  }
  const mid = Number(proposed.evidence?.clicks) || 20;
  return {
    id: String(c.id),
    kind: ct === "META" ? "TITLE" : ct.slice(0, 8),
    page: path,
    title: String(c.opportunity || proposed.title || "Review this change").trim(),
    before: proposed.beforeTitle || proposed.beforeMetaDescription || proposed.before || "Current live version",
    after: proposed.title || proposed.metaDescription || proposed.after || "Suggested update",
    gain: proposed.evidence?.clicks ? `+${proposed.evidence.clicks} clicks / mo` : "+5–25 clicks / mo",
    mid,
    changeId: c.id,
  };
}

/**
 * Phone.dc.html — approve-on-the-go mobile layout, live queue from listChanges.
 * Desktop: 390×844 device frame. Phone width: full-bleed viewport.
 */
export default function PhoneScreen() {
  const [i, setI] = useState(0);
  const [pending, setPending] = useState(0);
  const [moves, setMoves] = useState([]);
  const [hostname, setHostname] = useState("site");
  const [captured, setCaptured] = useState({ now: 0, total: 0 });
  const accent = "#D5F879";

  useEffect(() => {
    const journey = loadJourney();
    const ctx = activeSiteContext(journey);
    setHostname(ctx.hostname.split(".")[0] || ctx.hostname || "site");
    Promise.all([listChanges({ force: true }), loadFeature("organic-search")])
      .then(([chRes, organic]) => {
        const gsc = featurePayload(organic);
        const weeks = (gsc.weekly || gsc.panels?.weeklyClicks || []).slice(-4);
        const clicks = weeks.reduce((s, w) => s + (Number(w[1]) || 0), 0);
        const impr = Number(String(gsc.kpis?.[1]?.[1] || "").replace(/[^\d.]/g, "")) || 0;
        setCaptured({ now: clicks || 0, total: impr || clicks || 0 });
        const queue = queueItemsFromChanges(chRes.data);
        setMoves(queue.slice(0, 8).map(mapChangeToMove));
      })
      .catch(() => setMoves([]));
  }, []);

  const hasQueue = moves.length > 0;
  const done = !hasQueue || i >= moves.length;
  const hasMove = hasQueue && !done;
  const m = hasMove ? moves[i] : null;
  const counter = done ? "ALL CLEAR" : `${i + 1} / ${moves.length}`;
  const pctCaptured = useMemo(
    () => Math.min(99, Math.round((captured.now / Math.max(captured.total, 1)) * 100)),
    [captured],
  );
  const pendingWidth = `${((pending / Math.max(captured.total, 1)) * 100).toFixed(1)}%`;

  const ship = async () => {
    if (m?.changeId) {
      await approveChange(m.changeId).catch(() => {});
      await executeChange(m.changeId).catch(() => {});
    }
    setI(i + 1);
    setPending(pending + (m?.mid || 0));
  };

  const later = async () => {
    if (m?.changeId) dismissChange(m.changeId).catch(() => {});
    setI(i + 1);
  };

  const reset = () => {
    setI(0);
    setPending(0);
  };

  return (
    <div className="v8-phone">
      <div className="v8-phone-top">
        <div className="v8-phone-brand">
          <SearchifyMarkSvg size={26} />
          <span>{hostname}</span>
        </div>
        <span className="v8-phone-counter">{counter}</span>
      </div>

      <div className="v8-phone-capture">
        <div className="v8-phone-capture-row">
          <span className="v8-phone-capture-num">{captured.now}</span>
          <span className="v8-phone-capture-label">
            of {captured.total.toLocaleString("en-US")} clicks / mo captured
          </span>
        </div>
        <div className="v8-phone-bar">
          <div className="v8-phone-bar-live" style={{ width: `${pctCaptured}%`, ["--sfy-fill-to"]: `${pctCaptured}%` }}>
            <div className="v8-phone-bar-sheen" />
          </div>
          <div className="v8-phone-bar-pending" style={{ width: pendingWidth }} />
        </div>
      </div>

      {hasMove && m ? (
        <>
          <article className="v8-phone-card">
            <span className="v8-phone-kind">
              {m.kind} · {m.page}
            </span>
            <div className="v8-phone-suggest" style={{ color: accent }}>
              We suggest…
            </div>
            <h1 className="v8-phone-title">{m.title}</h1>
            <div className="v8-phone-diff">
              <div className="v8-phone-now">
                <span className="v8-phone-meta" style={{ color: "#7D848E" }}>
                  NOW
                </span>
                <span style={{ fontSize: 15, color: "#9AA1AB", lineHeight: 1.35 }}>{m.before}</span>
              </div>
              <div className="v8-phone-after">
                <span className="v8-phone-meta" style={{ color: "#4DA3FF" }}>
                  AFTER
                </span>
                <span style={{ fontSize: 15, lineHeight: 1.35 }}>{m.after}</span>
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="v8-phone-gain" style={{ color: accent }}>
                {m.gain}
              </span>
              <span style={{ fontSize: 13, color: "#9AA1AB" }}>Checked live after shipping · one-tap undo</span>
            </div>
          </article>
          <div className="v8-phone-actions">
            <button type="button" className="v8-phone-skip" onClick={later}>
              Skip it
            </button>
            <button type="button" className="v8-phone-ship" onClick={ship}>
              Ship it
            </button>
          </div>
        </>
      ) : null}

      {done ? (
        <div className="v8-phone-done">
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: accent }}>
            {hasQueue ? "WEEK CLEARED · 4-WEEK STREAK" : "NO OPEN MOVES"}
          </span>
          <h1>{hasQueue ? "Done in under two minutes." : "Nothing queued yet."}</h1>
          <p>
            {hasQueue
              ? "We'll message you when the results land."
              : "Plug in Search Console or run a site scan to fill today’s phone queue."}
          </p>
          {hasQueue ? (
            <button type="button" className="v8-phone-replay" onClick={reset}>
              Replay
            </button>
          ) : (
            <Link href="/app/connections" className="v8-phone-replay" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
              Plug in
            </Link>
          )}
        </div>
      ) : null}

      <PhoneTabBar />
    </div>
  );
}
