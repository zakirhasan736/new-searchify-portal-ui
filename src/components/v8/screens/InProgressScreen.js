"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { changePath, historyItems, listChanges } from "@/lib/v1Api";
import { changeBoardColor } from "@/lib/dotPriority";
import { useConnectionStatus } from "@/components/board/ConnectDialog";
import { activeSiteContext } from "@/lib/siteContext";
import { SkeletonRows } from "@/components/v8/SkeletonWave";
import "@/styles/v8-screens.css";

const STAGES = [
  null,
  { title: "Published", sub: "Live on your website right now.", color: "#4DA3FF", rgb: "77,163,255" },
  { title: "Google is re-reading", sub: "Google visits and notices the change. Usually a few days.", color: "#4DA3FF", rgb: "77,163,255" },
  { title: "Measuring", sub: "We watch your spot on Google for 4 weeks before calling it.", color: "#FFC53D", rgb: "255,197,61" },
  { title: "Result in", sub: "Proven. It moves to Results.", color: "#3DDC84", rgb: "61,220,132" },
];

const SEG_LABELS = ["Published", "Google re-reading", "Measuring", "Result in"];
const OPEN = new Set(["proposed", "awaiting_approval", "approved", "needs_review"]);

function whenLabel(iso) {
  if (!iso) return "recently";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "recently";
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((start - day) / 86400000);
  if (diff <= 0) return "today";
  if (diff === 1) return "yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function stageOf(change) {
  if (change.status === "undone") return null;
  const mon = change.monitoring || {};
  const delta = Number(mon.clickDelta ?? mon.visitorsDelta ?? mon.delta);
  const outcome = String(mon.outcome || mon.verdict || "");
  if (change.status === "closed" || outcome === "up" || (Number.isFinite(delta) && delta > 0)) return 4;
  const day = Number(mon.day ?? mon.daysElapsed);
  if (change.status === "monitoring" || (Number.isFinite(day) && day >= 2)) {
    return Number.isFinite(day) && day >= 4 ? 3 : 2;
  }
  return 1;
}

function progressOf(change, stage) {
  const day = Number(change.monitoring?.day ?? change.monitoring?.daysElapsed);
  if (stage === 4) return 1;
  if (stage === 3) return Math.max(0.08, Math.min(0.96, (Number.isFinite(day) ? day : 1) / 28));
  if (stage === 2) return 0.35;
  return 0.6;
}

function detailOf(change, stage) {
  const note = String(change.monitoring?.note || "").trim();
  if (note) return note;
  if (stage === 4) return "Google has a result for this fix. Open Results to read it.";
  if (stage === 3) {
    const day = Number(change.monitoring?.day ?? change.monitoring?.daysElapsed);
    return Number.isFinite(day)
      ? `Day ${day} of 28. Google has seen the page again. Too early to call it.`
      : "Watching your spot on Google. Too early to call it.";
  }
  if (stage === 2) return "Waiting for Google to visit the page again. Nothing for you to do.";
  return "Live on your website. Google usually visits within a few days.";
}

function titleOf(change) {
  const proposed = change.proposed || {};
  return String(proposed.title || change.opportunity || "Published fix").split("·")[0].trim();
}

export default function InProgressScreen() {
  const [connectionStatus] = useConnectionStatus();
  const [rows, setRows] = useState([]);
  const [waiting, setWaiting] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState(0);
  const { hostname } = activeSiteContext();
  const plugged = !!(connectionStatus.gsc || connectionStatus.wordpress);

  useEffect(() => {
    let live = true;
    listChanges({ force: true })
      .then((res) => {
        if (!live) return;
        const list = Array.isArray(res.data) ? res.data : res.data?.changes || [];
        const published = historyItems(list).filter((change) => change.status !== "undone" && stageOf(change));
        published.sort((a, b) => new Date(a.appliedAt || a.updatedAt || 0) - new Date(b.appliedAt || b.updatedAt || 0));
        setRows(
          published.map((change, index) => ({
            id: change.id,
            num: index + 1,
            what: titleOf(change),
            page: changePath(change),
            when: whenLabel(change.appliedAt || change.updatedAt),
            stage: stageOf(change),
            progress: progressOf(change, stageOf(change)),
            detail: detailOf(change, stageOf(change)),
          })),
        );
        setWaiting(list.filter((change) => OPEN.has(change.status) && changeBoardColor(change) === "red").length);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const counts = useMemo(() => {
    const next = [0, 0, 0, 0, 0];
    rows.forEach((row) => {
      next[row.stage] += 1;
    });
    return next;
  }, [rows]);

  const visible = useMemo(() => {
    const list = stage ? rows.filter((row) => row.stage === stage) : rows;
    return [...list].reverse();
  }, [rows, stage]);

  return (
    <div
      style={{
        flex: "999 1 560px",
        minWidth: 0,
        minHeight: 720,
        background: "#0A0B0D",
        color: "#F2F4F5",
        fontFamily: "Geist, 'Helvetica Neue', sans-serif",
        boxSizing: "border-box",
        padding: "24px clamp(16px, 4vw, 56px) 48px",
        display: "flex",
        flexDirection: "column",
        gap: 26,
      }}
    >
      <header style={{ maxWidth: 1000, width: "100%", margin: "0 auto", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Link href="/app/workspace" aria-label="Switch site" style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 40, color: "#F2F4F5", textDecoration: "none", fontWeight: 600, fontSize: 16 }}>
          {hostname || "Your site"}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9AA1AB" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M7 10l5 5 5-5" />
          </svg>
        </Link>
        <Link href="/app/connections" style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 40, fontSize: 13, color: "#9AA1AB", textDecoration: "none" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: plugged ? "#3DDC84" : "#FFC53D", boxShadow: plugged ? "0 0 8px #3DDC84" : "none" }} />
          {plugged ? "Connected" : "Plug in to publish"}
        </Link>
      </header>

      <section style={{ maxWidth: 1000, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <h1 style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(34px, 4.2vw, 52px)", lineHeight: 1.04, letterSpacing: "-1.5px", fontWeight: 700 }}>
          In progress
        </h1>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: "#D7DADE", maxWidth: 720 }}>
          Every fix you&apos;ve published, and how far along Google is with each one.
        </p>
        <span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 10, minHeight: 44, padding: "0 18px", borderRadius: 999, background: "rgba(61,220,132,.08)", border: "1px solid rgba(61,220,132,.45)", fontSize: 15, fontWeight: 600 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          No further action needed from you. Let these bake.
        </span>
      </section>

      <section aria-label="Stages" style={{ maxWidth: 1000, width: "100%", margin: "0 auto" }}>
        <div role="group" aria-label="Show fixes by stage" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
          {STAGES.slice(1).map((item, index) => {
            const key = index + 1;
            const on = stage === key;
            return (
              <button
                key={item.title}
                type="button"
                aria-pressed={on}
                onClick={() => setStage(on ? 0 : key)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 6,
                  padding: "16px 18px",
                  borderRadius: 18,
                  border: `1.5px solid ${on ? item.color : "#1A1D22"}`,
                  background: on ? `rgba(${item.rgb},.08)` : "#101215",
                  color: "#F2F4F5",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                  <span style={{ width: 28, height: 28, flex: "none", borderRadius: "50%", background: `rgba(${item.rgb},.14)`, display: "grid", placeItems: "center", fontFamily: "'Open Sans', sans-serif", fontSize: 12, fontWeight: 700, color: item.color }}>
                    {key}
                  </span>
                  <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 30, fontWeight: 800, color: item.color, marginLeft: "auto" }}>{counts[key]}</span>
                </span>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{item.title}</span>
                <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.4 }}>{item.sub}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="progress-list" style={{ maxWidth: 1000, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h2 id="progress-list" style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {stage ? STAGES[stage].title : "All published fixes"}
          </h2>
          {stage ? (
            <button type="button" onClick={() => setStage(0)} style={{ minHeight: 36, padding: 0, border: 0, background: "transparent", color: "#9AA1AB", fontSize: 13, textDecoration: "underline", cursor: "pointer" }}>
              Show all {rows.length}
            </button>
          ) : null}
        </div>
        {loading ? <SkeletonRows count={4} /> : null}
        {!loading && visible.length === 0 ? (
          <p style={{ margin: 0, padding: "18px 20px", borderRadius: 18, background: "#101215", border: "1px solid #1A1D22", color: "#D7DADE", fontSize: 15, lineHeight: 1.5 }}>
            Nothing is baking yet. Publish one fix and it will show up here with its number.
          </p>
        ) : null}
        {visible.map((row) => {
          const meta = STAGES[row.stage];
          const done = row.stage === 4;
          return (
            <article key={row.id} style={{ borderRadius: 18, background: "#101215", border: `1px solid ${done ? "rgba(61,220,132,.45)" : "#1A1D22"}`, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <span aria-label={`Fix number ${row.num}`} style={{ width: 48, height: 48, flex: "none", borderRadius: 14, display: "grid", placeItems: "center", background: "linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.04))", border: "1.5px solid rgba(255,255,255,.85)", boxShadow: "0 0 18px rgba(255,255,255,.35), inset 0 0 10px rgba(255,255,255,.18)", fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 21, fontWeight: 800, color: "#FFFFFF" }}>
                  {row.num}
                </span>
                <span style={{ flex: "1 1 300px", minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 600 }}>
                    <span title="Published" style={{ width: 20, height: 20, flex: "none", borderRadius: "50%", background: "rgba(61,220,132,.16)", display: "grid", placeItems: "center" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    {row.what}
                  </span>
                  <span style={{ fontSize: 13, color: "#9AA1AB" }}>
                    <span style={{ fontFamily: "'Open Sans', sans-serif", fontWeight: 700, fontSize: 12 }}>{row.page}</span>
                    {" · published "}
                    {row.when}
                  </span>
                </span>
                <span style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: meta.color }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color }} />
                  {done ? "Result in" : `Step ${row.stage} of 4 · ${meta.title}`}
                </span>
              </div>
              <div aria-hidden="true" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>
                {SEG_LABELS.map((label, index) => {
                  const key = index + 1;
                  const filled = key < row.stage || done;
                  const current = key === row.stage && !done;
                  const col = done ? "#3DDC84" : key === 3 ? "#FFC53D" : "#4DA3FF";
                  const width = filled ? "100%" : current ? `${Math.max(8, Math.round(row.progress * 100))}%` : "0%";
                  return (
                    <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ height: 8, borderRadius: 999, background: "#1A1D22", overflow: "hidden" }}>
                        <div style={{ height: "100%", width, borderRadius: 999, background: col }} />
                      </div>
                      <span style={{ fontSize: 11, color: filled || current ? "#D7DADE" : "#7D848E" }}>{label}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ flex: "1 1 300px", fontSize: 14, color: "#D7DADE", lineHeight: 1.5 }}>{row.detail}</span>
                {done ? (
                  <Link href="/app/outcomes" style={{ display: "inline-flex", alignItems: "center", minHeight: 42, padding: "0 16px", borderRadius: 12, background: "#3DDC84", color: "#0A0B0D", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                    See the result →
                  </Link>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 38, padding: "0 14px", borderRadius: 999, background: "rgba(61,220,132,.08)", border: "1px solid rgba(61,220,132,.4)", fontSize: 13, fontWeight: 600, color: "#3DDC84" }}>
                    {row.stage === 1 ? "No action needed · it's live" : row.stage === 2 ? "No action needed · Google is on it" : "No action needed · let it bake"}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <Link href="/app/results" style={{ maxWidth: 1000, width: "100%", margin: "0 auto", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "16px 20px", borderRadius: 18, background: "#101215", border: "1px dashed #3A404A", color: "#F2F4F5", textDecoration: "none" }}>
        <span style={{ display: "inline-flex", gap: 4 }} aria-hidden="true">
          {["#FF5A4E", "#FFC53D", "#3DDC84", "#4DA3FF"].map((color) => (
            <span key={color} style={{ width: 9, height: 9, borderRadius: "50%", background: color }} />
          ))}
        </span>
        <span style={{ flex: "1 1 260px", fontSize: 15 }}>
          {waiting ? `${waiting} urgent ${waiting === 1 ? "fix is" : "fixes are"} still waiting on your SearchLites.` : "Open SearchLites to work through the next fix."}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#4DA3FF" }}>Fix them →</span>
      </Link>
    </div>
  );
}
