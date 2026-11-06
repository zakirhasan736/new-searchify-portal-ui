"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  activeJourneySite,
  hydrateJourney,
  loadJourney,
  saveBaseline,
} from "@/lib/journey";
import { activeSiteContext } from "@/lib/siteContext";
import { featurePayload, getSiteScan, listChanges, loadFeature } from "@/lib/v1Api";
import { buildAuditFindings } from "@/lib/auditFindings";
import { findingsToScanTasks } from "@/lib/v8LiveData";
import { Skel } from "@/components/v8/SkeletonWave";
import DataHealthNotice from "@/components/v8/DataHealthNotice";
import "@/styles/v8-screens.css";

const LEAD_OPTS = ["0 to 5", "6 to 20", "21 to 50", "More than 50", "Not sure"];
const GOAL_OPTS = [
  "More phone calls",
  "More bookings",
  "More online sales",
  "More people walking in",
  "Getting named by AI assistants",
];
const LABELS = ["Snapshot", "Question 1", "Question 2", "Question 3", "Done"];

function numFrom(value) {
  const n = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function levelFromBoard(counts) {
  const total = Math.max(1, (counts.red || 0) + (counts.yellow || 0) + (counts.green || 0) + (counts.blue || 0));
  const direShare = (counts.red || 0) / total;
  const goodShare = ((counts.green || 0) + (counts.blue || 0)) / total;
  if (direShare >= 0.28) return { label: "Level 1 · Needs work", color: "#FF5A4E" };
  if (direShare >= 0.12 || goodShare < 0.35) return { label: "Level 2 · Fair", color: "#FF9F43" };
  if (goodShare >= 0.65) return { label: "Level 4 · Strong", color: "#3DDC84" };
  return { label: "Level 3 · Good", color: "#FFC53D" };
}

function RadioOption({ label, checked, onPick }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onPick}
      className="bl-opt"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        minHeight: "60px",
        padding: "0 18px",
        borderRadius: "14px",
        border: `1px solid ${checked ? "#4DA3FF" : "#262A31"}`,
        background: checked ? "rgba(77,163,255,.08)" : "#101215",
        color: "#F2F4F5",
        fontSize: "16px",
        textAlign: "left",
        width: "100%",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          width: "20px",
          height: "20px",
          flex: "none",
          borderRadius: "50%",
          border: `2px solid ${checked ? "#4DA3FF" : "#3A404A"}`,
          boxSizing: "border-box",
          display: "grid",
          placeItems: "center",
        }}
      >
        <span
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: checked ? "#4DA3FF" : "transparent",
          }}
        />
      </span>
      {label}
    </button>
  );
}

/**
 * Baseline.dc.html / Baseline.html — snapshot + 3 questions after Plug in.
 * Flow: Connect → /app/baseline → Site scan (/app/results).
 */
export default function BaselineScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [leads, setLeads] = useState(null);
  const [goal, setGoal] = useState(null);
  const [queries, setQueries] = useState(["", "", ""]);
  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState("your site");
  const [stats, setStats] = useState([
    { value: "—", label: "clicks from Google a month", color: "#F2F4F5" },
    { value: "—", label: "average spot in Google", color: "#FFC53D" },
    { value: "—", label: "pages Google can find", color: "#FF9F43" },
  ]);
  const [board, setBoard] = useState({ red: 0, yellow: 0, green: 0, blue: 0, pages: 0 });
  const [sugs, setSugs] = useState([]);
  const [fromGoogle, setFromGoogle] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      await hydrateJourney().catch(() => {});
      const journey = loadJourney();
      const site = activeJourneySite(journey);
      const prior = site?.answers?.baseline || {};
      if (prior.leads) setLeads(prior.leads);
      if (prior.goal) setGoal(prior.goal);
      if (Array.isArray(prior.searches) && prior.searches.length) {
        setQueries([prior.searches[0] || "", prior.searches[1] || "", prior.searches[2] || ""]);
      }
      if (site?.baselineDone || prior.savedAt) {
        // Returning users can re-open the done state or re-run from snapshot.
        setStep(0);
      }

      const { hostname, href } = activeSiteContext(journey);
      if (alive) setHost(hostname || "your site");

      try {
        const [organic, audit, pages, landings, scanRes, chRes] = await Promise.all([
          loadFeature("organic-search").catch(() => null),
          loadFeature("site-audit").catch(() => null),
          loadFeature("top-pages").catch(() => null),
          loadFeature("ga4-landing-pages").catch(() => null),
          getSiteScan(href || "").catch(() => ({ ok: false })),
          listChanges({ force: false }).catch(() => ({ ok: false, data: [] })),
        ]);
        if (!alive) return;

        const gsc = featurePayload(organic) || {};
        const clicks = numFrom(gsc.kpis?.[0]?.[1] || gsc.kpis?.find?.((r) => /click/i.test(String(r?.[0] || "")))?.[1]);
        const position = numFrom(
          gsc.kpis?.find?.((r) => /position|rank|spot/i.test(String(r?.[0] || "")))?.[1] || gsc.kpis?.[2]?.[1],
        );
        const scan = scanRes?.data?.scan || scanRes?.data || {};
        const pagesRead = Number(scan.pagesRead || scan.pages || 0) || 0;
        const indexed = Number(scan.indexed || scan.pagesIndexed || Math.max(pagesRead - Number(scan.blocked || 0), 0)) || pagesRead;

        const changeList = Array.isArray(chRes?.data) ? chRes.data : chRes?.data?.changes || [];
        const built = buildAuditFindings({
          audit,
          pages,
          queries: organic,
          landings,
          changes: changeList,
          crawl: null,
          scanIssues: Array.isArray(scan.auditIssues) ? scan.auditIssues : [],
        });
        const bundle = findingsToScanTasks(built.findings || [], { changes: changeList });
        const counts = {
          red: bundle.red?.length || 0,
          yellow: bundle.yellow?.length || 0,
          green: bundle.green?.length || 0,
          blue: bundle.blue?.length || 0,
        };
        const pageTotal = pagesRead || counts.red + counts.yellow + counts.green + counts.blue || 0;

        const posLabel =
          position > 0
            ? position <= 10
              ? "average spot in Google, mostly page 1"
              : "average spot in Google, mostly page 2"
            : "average spot in Google";

        setStats([
          {
            value: clicks > 0 ? Math.round(clicks).toLocaleString("en-US") : "—",
            label: "clicks from Google a month",
            color: "#F2F4F5",
          },
          {
            value: position > 0 ? (Math.round(position * 10) / 10).toString() : "—",
            label: posLabel,
            color: "#FFC53D",
          },
          {
            value: pageTotal > 0 ? `${indexed || pageTotal} of ${pageTotal}` : "—",
            label: clicks > 0 || position > 0 ? "pages Google can find" : "pages Searchify could read",
            color: "#FF9F43",
          },
        ]);
        setFromGoogle(clicks > 0 || position > 0);
        setBoard({ ...counts, pages: pageTotal });

        const rows = Array.isArray(gsc.rows) ? gsc.rows : Array.isArray(gsc.table) ? gsc.table : [];
        const fromGsc = rows
          .map((r) => String(r?.[0] || r?.query || r?.keyword || "").trim())
          .filter(Boolean)
          .slice(0, 8);
        const fallbackHost = (hostname || "your business").replace(/\.[a-z]+$/i, "").replace(/[-_]/g, " ");
        const fallback = [
          `${fallbackHost} near me`,
          `${fallbackHost} services`,
          `best ${fallbackHost}`,
          `${fallbackHost} reviews`,
          `${fallbackHost} quote`,
        ];
        setSugs((fromGsc.length ? fromGsc : fallback).slice(0, 6));
      } catch {
        /* keep placeholders */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const level = useMemo(() => levelFromBoard(board), [board]);
  const totalPages = board.pages || board.red + board.yellow + board.green + board.blue || 1;
  const widths = {
    red: `${((board.red || 0) / totalPages) * 100}%`,
    yellow: `${((board.yellow || 0) / totalPages) * 100}%`,
    green: `${((board.green || 0) / totalPages) * 100}%`,
    blue: `${((board.blue || 0) / totalPages) * 100}%`,
  };

  const answered =
    step === 0 ||
    (step === 1 && !!leads) ||
    (step === 2 && !!goal) ||
    (step === 3 && queries.some((q) => q.trim()));

  const stepLabel =
    step === 0 ? "STEP 1 OF 2 · YOUR SNAPSHOT" : step === 4 ? "ALL DONE" : `STEP 2 OF 2 · QUESTION ${step} OF 3`;

  const goNext = () => {
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step >= 1 && step <= 3) {
      if (!answered) return;
      if (step === 3) {
        saveBaseline({
          leads,
          goal,
          searches: queries.map((q) => q.trim()).filter(Boolean),
          snapshot: {
            stats,
            board,
            level: level.label,
            host,
          },
        });
        setStep(4);
        return;
      }
      setStep(step + 1);
    }
  };

  const skip = () => {
    if (step === 3) {
      saveBaseline({
        leads,
        goal,
        searches: queries.map((q) => q.trim()).filter(Boolean),
        skippedLast: true,
        snapshot: { stats, board, level: level.label, host },
      });
      setStep(4);
      return;
    }
    setStep(Math.min(4, step + 1));
  };

  const setQuery = (index, value) => {
    setQueries((prev) => {
      const next = prev.slice();
      next[index] = value;
      return next;
    });
  };

  const addSug = (term) => {
    setQueries((prev) => {
      const next = prev.slice();
      const i = next.findIndex((x) => !String(x).trim());
      if (i < 0) return next;
      next[i] = term;
      return next;
    });
  };

  const freeSug = sugs.filter((s) => !queries.includes(s));

  return (
    <div
      className="v8-baseline"
      style={{
        flex: "999 1 560px",
        minWidth: 0,
        minHeight: "1000px",
        background: "#0A0B0D",
        color: "#F2F4F5",
        fontFamily: "Geist, 'Helvetica Neue', sans-serif",
        boxSizing: "border-box",
        padding: "28px clamp(16px, 4vw, 56px) 56px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "36px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "640px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px", letterSpacing: "0.06em", color: "#9AA1AB" }}>
          {stepLabel}
        </span>
        <ol
          aria-label="Progress"
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: "6px",
          }}
        >
          {LABELS.map((label, i) => (
            <li
              key={label}
              aria-current={i === step ? "step" : "false"}
              style={{
                height: "4px",
                borderRadius: "2px",
                background: i < step ? "#3DDC84" : i === step ? "#4DA3FF" : "#1A1D22",
              }}
            >
              <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{label}</span>
            </li>
          ))}
        </ol>
      </div>

      {step === 0 ? (
        <section
          aria-labelledby="snap-h"
          style={{ width: "100%", maxWidth: "640px", display: "flex", flexDirection: "column", gap: "22px", animation: "sfy-rise .35s ease both" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span
              style={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: "'Geist Mono', monospace",
                fontSize: "11px",
                letterSpacing: "0.08em",
                color: "#4DA3FF",
                padding: "5px 10px",
                borderRadius: "8px",
                border: "1px solid rgba(77,163,255,.5)",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              SNAPSHOT · TODAY
            </span>
            <h1
              id="snap-h"
              style={{
                margin: 0,
                fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                fontSize: "clamp(34px, 4.4vw, 52px)",
                lineHeight: 1,
                letterSpacing: "-1.6px",
                fontWeight: 700,
              }}
            >
              This is where you&apos;re starting from.
            </h1>
            <p style={{ margin: 0, fontSize: "16px", color: "#9AA1AB", lineHeight: 1.55 }}>
              {fromGoogle ? "We took this from Google just now for " : "We read your website just now: "}
              <strong style={{ color: "#F2F4F5", fontWeight: 600 }}>{host}</strong>. Nothing to fill in. We save it so that later, you can
              see exactly what changed.
            </p>
          </div>

          <div
            style={{
              borderRadius: "24px",
              background: "#101215",
              border: "1px solid rgba(77,163,255,.5)",
              boxShadow: "0 0 34px rgba(77,163,255,.14)",
              padding: "clamp(20px, 3vw, 28px)",
              display: "flex",
              flexDirection: "column",
              gap: "22px",
            }}
          >
            <div
              className="v8-baseline-stats"
              style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px" }}
            >
              {stats.map((s) => (
                <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                      fontSize: "clamp(30px, 3.4vw, 40px)",
                      fontWeight: 800,
                      letterSpacing: "-1.2px",
                      lineHeight: 1,
                      color: s.color,
                    }}
                  >
                    {loading ? <Skel w="70%" h={34} radius={8} /> : s.value}
                  </span>
                  <span style={{ fontSize: "13px", color: "#D7DADE", lineHeight: 1.35 }}>{s.label}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: "#1A1D22" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "14px", color: "#D7DADE" }}>
                  Your {board.pages || totalPages} pages today
                </span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: level.color }}>{level.label}</span>
              </div>
              <div
                role="img"
                aria-label={`${board.red} red, ${board.yellow} yellow, ${board.green} green and ${board.blue} blue pages`}
                style={{ display: "flex", height: "12px", borderRadius: "6px", overflow: "hidden", gap: "2px", background: "#1A1D22" }}
              >
                {board.red ? <span style={{ width: widths.red, background: "#FF5A4E" }} /> : null}
                {board.yellow ? <span style={{ width: widths.yellow, background: "#FFC53D" }} /> : null}
                {board.green ? <span style={{ width: widths.green, background: "#3DDC84" }} /> : null}
                {board.blue ? <span style={{ width: widths.blue, background: "#4DA3FF" }} /> : null}
              </div>
              <div aria-hidden="true" style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "12px", color: "#9AA1AB" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5A4E" }} />
                  {board.red} red
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFC53D" }} />
                  {board.yellow} yellow
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3DDC84" }} />
                  {board.green} green
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4DA3FF" }} />
                  {board.blue} blue
                </span>
              </div>
            </div>
          </div>

          {loading ? null : <DataHealthNotice need={["scan", "firewall", "google", "gsc", "gsc_data"]} />}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "4px" }}>
            <span style={{ fontSize: "15px", color: "#D7DADE", lineHeight: 1.5 }}>
              Next, <strong style={{ fontWeight: 600, color: "#F2F4F5" }}>3 quick questions</strong> that Google can&apos;t answer for us.
              About 30 seconds.
            </span>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                onClick={goNext}
                style={{
                  alignSelf: "flex-start",
                  minHeight: "56px",
                  padding: "0 28px",
                  borderRadius: "14px",
                  border: 0,
                  background: "#4DA3FF",
                  color: "#0A0B0D",
                  fontSize: "16px",
                  fontWeight: 600,
                  boxShadow: "0 0 24px rgba(77,163,255,.45)",
                  cursor: "pointer",
                }}
              >
                Got it, next
              </button>
              <Link href="/app/connections" style={{ fontSize: "14px", color: "#9AA1AB" }}>
                Back to Plug in
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {step >= 1 && step <= 3 ? (
        <section
          aria-labelledby="q-h"
          style={{ width: "100%", maxWidth: "640px", display: "flex", flexDirection: "column", gap: "24px", animation: "sfy-rise .3s ease both" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <h1
              id="q-h"
              style={{
                margin: 0,
                fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                fontSize: "clamp(30px, 3.8vw, 44px)",
                lineHeight: 1.05,
                letterSpacing: "-1.3px",
                fontWeight: 700,
              }}
            >
              {step === 1
                ? "About how many calls or leads does your website bring in a month?"
                : step === 2
                  ? "What matters most to you right now?"
                  : "Which 3 searches do you most want to show up for?"}
            </h1>
            <p style={{ margin: 0, fontSize: "16px", color: "#9AA1AB", lineHeight: 1.55 }}>
              {step === 1
                ? "A rough guess is fine. It helps us measure what each fix is worth to you."
                : step === 2
                  ? "We’ll put the fixes that help with this first."
                  : "These become your scorecard. We’ll track exactly where you rank for them."}
            </p>
          </div>

          {step === 1 ? (
            <div role="radiogroup" aria-labelledby="q-h" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {LEAD_OPTS.map((opt) => (
                <RadioOption key={opt} label={opt} checked={leads === opt} onPick={() => setLeads(opt)} />
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <div role="radiogroup" aria-labelledby="q-h" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {GOAL_OPTS.map((opt) => (
                <RadioOption key={opt} label={opt} checked={goal === opt} onPick={() => setGoal(opt)} />
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[0, 1, 2].map((i) => (
                <label
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    minHeight: "58px",
                    padding: "0 16px",
                    borderRadius: "14px",
                    border: "1px solid #262A31",
                    background: "#101215",
                  }}
                >
                  <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: "13px", color: "#7D848E", flex: "none" }}>{i + 1}</span>
                  <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Search {i + 1}</span>
                  <input
                    type="text"
                    value={queries[i]}
                    onChange={(e) => setQuery(i, e.target.value)}
                    placeholder="Type a search, or tap one below"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      border: 0,
                      outline: "none",
                      background: "transparent",
                      color: "#F2F4F5",
                      font: "inherit",
                      fontSize: "16px",
                    }}
                  />
                </label>
              ))}
              {freeSug.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "13px", color: "#9AA1AB" }}>Searches you already show up for</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {freeSug.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => addSug(term)}
                        style={{
                          minHeight: "40px",
                          padding: "0 14px",
                          borderRadius: "999px",
                          border: "1px solid #3A404A",
                          background: "transparent",
                          color: "#D7DADE",
                          fontSize: "14px",
                          cursor: "pointer",
                        }}
                      >
                        + {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", paddingTop: "4px" }}>
            <button
              type="button"
              onClick={goNext}
              disabled={!answered}
              style={{
                minHeight: "56px",
                padding: "0 28px",
                borderRadius: "14px",
                border: 0,
                background: "#4DA3FF",
                color: "#0A0B0D",
                fontSize: "16px",
                fontWeight: 600,
                boxShadow: "0 0 24px rgba(77,163,255,.45)",
                opacity: answered ? 1 : 0.5,
                cursor: answered ? "pointer" : "default",
              }}
            >
              {step === 3 ? "Save my starting point" : "Next"}
            </button>
            <button
              type="button"
              onClick={skip}
              style={{
                minHeight: "44px",
                padding: "0 6px",
                border: 0,
                background: "transparent",
                color: "#9AA1AB",
                fontSize: "14px",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Skip this one
            </button>
            <button
              type="button"
              onClick={() => setStep(Math.max(0, step - 1))}
              style={{
                marginLeft: "auto",
                minHeight: "44px",
                padding: "0 6px",
                border: 0,
                background: "transparent",
                color: "#7D848E",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Back
            </button>
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section
          aria-labelledby="d-h"
          style={{ width: "100%", maxWidth: "640px", display: "flex", flexDirection: "column", gap: "22px", animation: "sfy-rise .35s ease both" }}
        >
          <span
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(61,220,132,.14)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <h1
              id="d-h"
              role="status"
              style={{
                margin: 0,
                fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                fontSize: "clamp(32px, 4vw, 48px)",
                lineHeight: 1.02,
                letterSpacing: "-1.4px",
                fontWeight: 700,
              }}
            >
              Your starting point is saved.
            </h1>
            <p style={{ margin: 0, fontSize: "16px", color: "#9AA1AB", lineHeight: 1.55 }}>
              From here on, your reports compare against today, so you&apos;ll always see exactly what Searchify changed. Now
              let&apos;s look at what&apos;s holding your site back.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/app/results")}
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              minHeight: "56px",
              padding: "0 28px",
              borderRadius: "14px",
              border: 0,
              background: "#4DA3FF",
              color: "#0A0B0D",
              fontSize: "16px",
              fontWeight: 600,
              boxShadow: "0 0 24px rgba(77,163,255,.45)",
              cursor: "pointer",
            }}
          >
            See what it&apos;s costing you
          </button>
        </section>
      ) : null}

    </div>
  );
}
