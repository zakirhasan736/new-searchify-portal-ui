"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OverviewTour from "@/components/board/OverviewTour";
import { useConnectionStatus } from "@/components/board/ConnectDialog";
import { useWorkspaceSite } from "@/components/board/useBusinessBrief";
import { hostnameOf } from "@/lib/businessBrief";
import { activeJourneySite, hydrateJourney, loadJourney, planById, requiredJourneyPath } from "@/lib/journey";
import {
  approveChange,
  dismissChange,
  executeChange,
  generateMetaCopy,
  listChanges,
  proposeFromGsc,
} from "@/lib/v1Api";
import { userIsAuthenticated } from "@/utils/users/Helpers";
import { breadthKey, loadGuardrails } from "@/lib/guardrails";
import { changeBoardColor, DOT_COLORS, DOT_LABEL, DOT_TAG } from "@/lib/dotPriority";
import "@/styles/v8-app.css";

const COLORS = DOT_COLORS;
const LABELS = DOT_LABEL;
const OPEN = new Set(["awaiting_approval", "proposed", "approved", "failed", "needs_review"]);

function pathOf(url) {
  try {
    return new URL(url).pathname || "/";
  } catch {
    return url || "/";
  }
}

function toMove(row) {
  const p = row.proposed || {};
  const before = p.liveTitle || p.currentTitle || "(No live title)";
  const after = p.title || "";
  const desc = p.metaDescription || "";
  const color = changeBoardColor(row);
  return {
    id: row.id,
    status: row.status,
    color,
    tag: `${DOT_TAG[color]} · TITLE REWRITE`,
    kind: "Title rewrite",
    page: pathOf(row.targetUrl),
    head: after ? `Ship a clearer title for ${pathOf(row.targetUrl)}.` : "Review this page title and description.",
    before,
    after,
    description: desc,
    gain: p.expectedGain || p.gain || "Review before ship",
    ships: "Ships to WordPress · checked live · one-click undo",
    proof: p.reason || "Evidence stays on the review card.",
    raw: row,
  };
}

export default function TodayMoves() {
  const router = useRouter();
  const { brief } = useWorkspaceSite();
  const [status] = useConnectionStatus();
  const [ready, setReady] = useState(false);
  const [host, setHost] = useState("your website");
  const [col, setCol] = useState("red");
  const [moves, setMoves] = useState([]);
  const [cur, setCur] = useState(0);
  const [done, setDone] = useState({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [cmd, setCmd] = useState("");

  const load = async () => {
    const res = await listChanges({ force: true });
    const rows = Array.isArray(res.data) ? res.data : [];
    const hostName = hostnameOf(brief.siteUrl) || brief.hostname;
    const mine = rows
      .filter((row) => OPEN.has(row.status) && row.changeType === "meta")
      .filter((row) => !hostName || hostnameOf(row.targetUrl) === hostName)
      .map(toMove);
    setMoves(mine);
    setCur(0);
  };

  useEffect(() => {
    if (!userIsAuthenticated()) {
      router.replace("/login");
      return;
    }
    let cancel = false;
    hydrateJourney().then(() => {
      if (cancel) return;
      const gate = requiredJourneyPath("/app");
      if (gate) {
        router.replace(gate);
        return;
      }
      const state = loadJourney();
      const active = activeJourneySite(state);
      try {
        setHost(new URL(active?.answers?.site || brief.siteUrl || "").hostname.replace(/^www\./, "") || brief.hostname || "your website");
      } catch {
        setHost(brief.hostname || "your website");
      }
      setReady(true);
      load().catch(() => setNote("Could not load today’s moves."));
    });
    return () => {
      cancel = true;
    };
  }, [router, brief.siteUrl, brief.hostname]);

  const openMoves = useMemo(() => moves.filter((m) => !done[m.id] && m.color === col), [moves, done, col]);
  const move = openMoves[cur] || openMoves[0] || null;

  const chips = ["red", "yellow", "green", "blue"].map((k) => {
    const left = moves.filter((m) => !done[m.id] && m.color === k).length;
    return {
      key: k,
      label: LABELS[k],
      count: k === "red" || k === "yellow" ? (left ? `${left} left` : "0") : "—",
      color: COLORS[k],
      on: col === k,
    };
  });

  const connections = [
    { n: "1", name: "Search Console", sub: status.gsc ? "Connected" : "Not connected", on: status.gsc },
    { n: "2", name: "WordPress", sub: status.wordpress ? "Connected" : "Not connected", on: status.wordpress },
    { n: "3", name: "Analytics", sub: status.ga ? "Connected" : "Not connected", on: status.ga },
  ];

  const generate = async () => {
    setBusy(true);
    setNote("");
    const res = await proposeFromGsc({ breadth: breadthKey(loadGuardrails().breadth), limit: 6 });
    setBusy(false);
    if (!res.ok) {
      setNote("Could not generate moves. Connect Search Console, then try again.");
      return;
    }
    await load();
  };

  const ship = async () => {
    if (!move) return;
    setBusy(true);
    setNote("");
    const approved = await approveChange(move.id);
    if (!approved.ok) {
      setBusy(false);
      setNote("Could not approve. Open the full review card.");
      return;
    }
    const executed = await executeChange(move.id, { includeOpenGraph: true, includeJsonLd: true });
    setBusy(false);
    if (!executed.ok) {
      setNote("Approved, but publish needs the WordPress connection. Open review to finish.");
      router.push(`/app/queue/${move.id}`);
      return;
    }
    setDone((d) => ({ ...d, [move.id]: "shipped" }));
    setCur(0);
    await load();
  };

  const skip = async () => {
    if (!move) return;
    setBusy(true);
    await dismissChange(move.id);
    setBusy(false);
    setDone((d) => ({ ...d, [move.id]: "skipped" }));
    setCur(0);
    await load();
  };

  const regen = async () => {
    if (!move) return;
    setBusy(true);
    const res = await generateMetaCopy(move.id, {});
    setBusy(false);
    if (!res.ok) {
      setNote("Regenerate failed. Open the review card for more options.");
      return;
    }
    await load();
  };

  if (!ready) return null;

  const captured = Math.min(100, openMoves.length ? 17 : 0);

  return (
    <>
      <div className="v8-home">
        <header className="v8-home-head">
          <Link className="host" href="/app/workspace">
            {host}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA1AB" strokeWidth="2" aria-hidden="true">
              <path d="M7 10l5 5 5-5" />
            </svg>
          </Link>
          <Link className="v8-pill" href="/app/path">
            <span style={{ fontWeight: 600 }}>Page progress</span>
            <span style={{ color: "#9AA1AB" }}>Open levels</span>
          </Link>
          <Link className="v8-pill accent" href="/app/outcomes">
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#0A0B0D" }} />
            Results
          </Link>
          <Link className="v8-pill" href="/app/history" aria-label="Reports and change log" style={{ width: 40, padding: 0, justifyContent: "center", placeItems: "center" }}>
            ↺
          </Link>
        </header>

        <section className="v8-captured" aria-label="Captured so far">
          <div className="v8-captured-row">
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <span className="v8-captured-num">{openMoves.length ? `${openMoves.length}` : "—"}</span>
              <span style={{ fontSize: 17, color: "#9AA1AB" }}>
                {openMoves.length ? "moves waiting for your approval" : "no open moves yet — generate from Search Console"}
              </span>
            </div>
            <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: "#D5F879" }}>
              {status.gsc && status.wordpress ? "Ready to ship" : "Connect GSC + WordPress"}
            </span>
          </div>
          <div className="v8-bar" role="progressbar" aria-valuenow={captured} aria-valuemin={0} aria-valuemax={100}>
            <i style={{ width: `${captured}%` }} />
          </div>
        </section>

        <div className="v8-home-main">
          <section className="v8-moves" aria-label="Your moves">
            <div className="v8-chips">
              <div className="v8-chip-row">
                <span style={{ fontSize: 13, color: "#9AA1AB", marginRight: 4 }}>Work on</span>
                {chips.map((ch) => (
                  <button
                    key={ch.key}
                    type="button"
                    className={`v8-chip${ch.on ? " is-on" : ""}`}
                    aria-pressed={ch.on}
                    onClick={() => setCol(ch.key)}
                    style={
                      ch.on
                        ? {
                            borderColor: ch.color,
                            background: `${ch.color}29`,
                            boxShadow: `0 0 22px ${ch.color}8c`,
                          }
                        : undefined
                    }
                  >
                    <span className="dot" style={{ background: ch.color, boxShadow: ch.on ? `0 0 10px ${ch.color}` : "none" }} />
                    {ch.label}{" "}
                    <span style={{ fontFamily: "var(--mono)", color: ch.on ? "#F2F4F5" : "#9AA1AB" }}>{ch.count}</span>
                  </button>
                ))}
              </div>

              {col === "red" && openMoves.length ? (
                <>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.6px", color: "#7D848E" }}>INCOMING</span>
                    <span style={{ fontSize: 13, color: "#D7DADE" }}>{openMoves.length} title / description drafts</span>
                  </div>
                  <div className="v8-stream">
                    {openMoves.map((m, i) => (
                      <button
                        key={m.id}
                        type="button"
                        aria-label={m.page}
                        title={m.page}
                        onClick={() => setCur(i)}
                        style={{
                          border: `2px solid ${COLORS.red}`,
                          background: COLORS.red,
                          boxShadow: i === cur ? `0 0 16px ${COLORS.red}` : `0 0 8px rgba(255,90,78,.45)`,
                          outline: i === cur ? "2px solid #F2F4F5" : "none",
                          outlineOffset: 3,
                          opacity: i === cur ? 1 : 0.8,
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {note ? <p style={{ color: "#FF5A4E", margin: 0 }}>{note}</p> : null}

            {col !== "red" ? (
              <div className="v8-move-card" style={{ borderColor: COLORS[col] }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: COLORS[col] }}>{LABELS[col].toUpperCase()}</span>
                <h1 className="v8-move-title">
                  {col === "yellow"
                    ? "Medium moves appear after Dire is clear."
                    : col === "green"
                      ? "Passing checks show here once the scan finishes."
                      : "Locked winning pages stay untouched."}
                </h1>
                <p style={{ margin: 0, color: "#9AA1AB", fontSize: 17, maxWidth: 560 }}>
                  Open Site scan for the full colour board, or stay on Dire to ship title and description drafts that need your approval.
                </p>
                <Link className="v8-ship" href="/app/results" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", width: "fit-content" }}>
                  Open site scan
                </Link>
              </div>
            ) : move ? (
              <article className="v8-move-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 13 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "var(--mono)", color: COLORS.red }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.red, boxShadow: `0 0 8px ${COLORS.red}` }} />
                    {move.tag}
                  </span>
                  <span style={{ color: "#3A404A" }}>·</span>
                  <span style={{ color: "#9AA1AB" }}>{move.kind}</span>
                  <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", color: "#9AA1AB" }}>{move.page}</span>
                </div>
                <div className="v8-suggest">We suggest…</div>
                <h1 className="v8-move-title">{move.head}</h1>
                <div className="v8-ba">
                  <div>
                    <span className="lab">NOW</span>
                    <span style={{ fontSize: 17, lineHeight: 1.4, color: "#9AA1AB" }}>{move.before}</span>
                  </div>
                  <div className="after">
                    <span className="lab" style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>AFTER</span>
                      <span style={{ color: "#7D848E" }}>DRAFT</span>
                    </span>
                    <span style={{ fontSize: 17, lineHeight: 1.55 }}>{move.after || "Open review to edit"}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" className="v8-skip" onClick={regen} disabled={busy}>
                    Regenerate suggestion
                  </button>
                  <Link className="v8-skip" href={`/app/queue/${move.id}`} style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                    Make manual edits
                  </Link>
                </div>
                <div className="v8-move-actions">
                  <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 700, letterSpacing: "-0.6px", color: "#D5F879" }}>
                      {move.gain}
                    </span>
                    <span style={{ fontSize: 13, color: "#9AA1AB" }}>{move.ships}</span>
                    <span style={{ fontSize: 13, color: "#D7DADE", marginTop: 6 }}>{move.proof}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
                    <button type="button" className="v8-skip" onClick={skip} disabled={busy}>
                      Skip it
                    </button>
                    <button type="button" className="v8-ship" onClick={ship} disabled={busy}>
                      {busy ? "Working…" : "Ship it"}
                    </button>
                  </div>
                </div>
              </article>
            ) : (
              <div className="v8-move-card">
                <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: "#D5F879" }}>NO OPEN DIRE MOVES</span>
                <h1 className="v8-move-title">Generate the next batch from Search Console.</h1>
                <p style={{ margin: 0, color: "#9AA1AB", fontSize: 17, maxWidth: 560 }}>
                  Searchify writes title and description drafts from live evidence. You still approve every ship.
                </p>
                <button type="button" className="v8-ship" onClick={generate} disabled={busy} style={{ width: "fit-content" }}>
                  {busy ? "Generating…" : "Generate moves"}
                </button>
              </div>
            )}
          </section>

          <aside className="v8-conn-aside" aria-labelledby="conn-h">
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <h2 id="conn-h" style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                Connections active
              </h2>
              <Link href="/app/connections" style={{ fontSize: 13, color: "#9AA1AB", textDecoration: "none" }}>
                Manage
              </Link>
            </div>
            <ol>
              {connections.map((c) => (
                <li key={c.n}>
                  <Link href="/app/connections" className={c.on ? "is-on" : undefined}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#7D848E", width: 14 }}>{c.n}</span>
                    <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</span>
                      <span style={{ fontSize: 12, color: "#9AA1AB" }}>{c.sub}</span>
                    </span>
                    {c.on ? (
                      <span style={{ color: "#3DDC84", fontSize: 18 }} aria-label="Connected">
                        ⚡
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ol>
          </aside>
        </div>

        <label className="v8-cmd" htmlFor="v8-cmd">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D5F879" }} />
          <input
            id="v8-cmd"
            type="text"
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && cmd.trim()) {
                window.dispatchEvent(new CustomEvent("sf-ask", { detail: { q: cmd.trim() } }));
                setCmd("");
              }
            }}
            placeholder='Talk to Searchify — “why did this page drop?” or “write the client report”'
          />
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#9AA1AB", border: "1px solid #262A31", borderRadius: 6, padding: "2px 7px" }}>
            ⌘K
          </span>
        </label>
      </div>
      <OverviewTour />
    </>
  );
}
