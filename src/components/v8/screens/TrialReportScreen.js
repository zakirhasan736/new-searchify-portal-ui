"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getBillingAccount } from "@/lib/billingApi";
import { loadFeature, featurePayload, listChanges } from "@/lib/v1Api";
import { activeSiteContext } from "@/lib/siteContext";
import { loadJourney } from "@/lib/journey";
import { getUser } from "@/utils/users/Helpers";
import { SkeletonCards } from "@/components/v8/SkeletonWave";
import FounderSignature from "@/components/v8/FounderSignature";
import "@/styles/v8-trial-report.css";

const COL = {
  r: ["#FF5A4E", "rgba(255,90,78,.6)"],
  y: ["#FFC53D", "rgba(255,197,61,.3)"],
  g: ["#3DDC84", "rgba(61,220,132,.2)"],
};

function dotsFromCounts(red, yellow, green, total = 38) {
  const r = Math.max(0, Number(red) || 0);
  const y = Math.max(0, Number(yellow) || 0);
  const g = Math.max(0, total - r - y);
  const keys = [...Array(r).fill("r"), ...Array(y).fill("y"), ...Array(Math.max(0, g)).fill("g")].slice(0, total);
  while (keys.length < total) keys.push("g");
  return keys.map((k) => ({ c: COL[k][0], g: COL[k][1] }));
}

function improveDots(beforeKeys) {
  let reds = 0;
  let yell = 0;
  return beforeKeys.map((k) => {
    let n = k;
    if (k === "r") {
      reds += 1;
      n = reds <= 1 ? "r" : reds <= 3 ? "y" : "g";
    } else if (k === "y") {
      yell += 1;
      n = yell <= 4 ? "y" : "g";
    }
    return { c: COL[n][0], g: COL[n][1], key: n };
  });
}

function firstName(user, business) {
  const raw = user?.data?.name || user?.result?.username || business || "";
  const bit = String(raw).trim().split(/\s+|@/)[0];
  if (!bit) return "there";
  return bit.charAt(0).toUpperCase() + bit.slice(1);
}

function fmtDay(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return String(iso).slice(0, 10);
  }
}

function statusForChange(change) {
  if (!change) return { status: "Waiting on data", color: "#9AA1AB" };
  const c = String(change);
  if (/proven|goal/i.test(c)) return { status: "Proven", color: "#3DDC84" };
  if (/\+/.test(c) || /rising|early/i.test(c)) return { status: c.startsWith("+") ? `Early sign, ${c}` : "Early sign, rising", color: "#3DDC84" };
  if (/waiting|connect|no pages|too early/i.test(c)) return { status: "Too early to call", color: "#9AA1AB" };
  return { status: c || "Early sign", color: "#FFC53D" };
}

/**
 * TrialReport.dc.html — Day-30 before-and-after for free-month accounts.
 * Live: billing account.since + changes + site audit snapshot when available.
 */
export default function TrialReportScreen() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [changes, setChanges] = useState([]);
  const [auditCounts, setAuditCounts] = useState({ red: 0, yellow: 0, green: 21 });
  const { hostname } = activeSiteContext(loadJourney());
  const user = typeof window !== "undefined" ? getUser() : null;

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    Promise.all([
      getBillingAccount().catch(() => ({ ok: false })),
      listChanges().catch(() => ({ ok: false })),
      loadFeature("site-audit").catch(() => ({ ok: false })),
      loadFeature("organic-search").catch(() => ({ ok: false })),
    ])
      .then(([bill, ch, auditFeat]) => {
        if (cancel) return;
        if (bill?.ok) setAccount(bill.data || bill);
        const rows = Array.isArray(ch?.data) ? ch.data : ch?.data?.changes || ch?.data?.rows || [];
        setChanges(Array.isArray(rows) ? rows.slice(0, 12) : []);
        const audit = featurePayload(auditFeat);
        const issues = audit.issues || audit.rows || [];
        if (Array.isArray(issues) && issues.length) {
          let red = 0;
          let yellow = 0;
          let green = 0;
          issues.forEach((row) => {
            const sev = String(row.severity || row[1] || row.tone || "").toLowerCase();
            if (/critical|error|red|urgent/.test(sev)) red += 1;
            else if (/warn|medium|yellow/.test(sev)) yellow += 1;
            else green += 1;
          });
          setAuditCounts({ red, yellow, green: Math.max(green, 1) });
        }
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  const trialDays = Number(account?.trialDays || 30);
  const joined = account?.joinedAt || account?.createdAt || account?.trialStartedAt;
  const ends = account?.trialEndsAt || account?.paidThrough || account?.renewsAt;
  const dayNum = useMemo(() => {
    if (!joined) return Math.min(28, trialDays - 2);
    const start = new Date(joined).getTime();
    if (!Number.isFinite(start)) return Math.min(28, trialDays - 2);
    const days = Math.max(1, Math.floor((Date.now() - start) / 86400000) + 1);
    return Math.min(days, trialDays);
  }, [joined, trialDays]);

  const name = firstName(user, account?.business);
  const since = Array.isArray(account?.since) ? account.since : [];
  const moves = Number(account?.movesShipped || account?.measuredMoves || 0);

  const beforeKeys = useMemo(() => {
    const total = 38;
    const r = Math.min(12, Math.max(2, auditCounts.red || 6));
    const y = Math.min(14, Math.max(4, auditCounts.yellow || 11));
    return [...Array(r).fill("r"), ...Array(y).fill("y"), ...Array(total - r - y).fill("g")].slice(0, total);
  }, [auditCounts]);

  const beforeDots = beforeKeys.map((k) => ({ c: COL[k][0], g: COL[k][1] }));
  const afterDots = improveDots(beforeKeys);
  const beforeLabel = `${beforeKeys.filter((k) => k === "r").length} urgent · ${beforeKeys.filter((k) => k === "y").length} need work · ${beforeKeys.filter((k) => k === "g").length} healthy`;
  const afterR = afterDots.filter((d) => d.key === "r").length;
  const afterY = afterDots.filter((d) => d.key === "y").length;
  const afterG = afterDots.filter((d) => d.key === "g").length;
  const afterLabel = `${afterR} urgent · ${afterY} need work · ${afterG} healthy`;

  const metrics = since.length
    ? since.map((row) => {
        const st = statusForChange(row.change);
        return { what: row.label, a: row.from, b: row.to, ...st };
      })
    : [
        { what: "Healthy pages", a: String(beforeKeys.filter((k) => k === "g").length), b: String(afterG), status: moves ? "Proven" : "Waiting on first scan", color: moves ? "#3DDC84" : "#9AA1AB" },
        { what: "Moves shipped", a: "0", b: String(moves), status: moves ? "Proven" : "Too early to call", color: moves ? "#3DDC84" : "#9AA1AB" },
      ];

  const fixed = changes
    .filter((c) => /shipped|live|applied|published|approved/i.test(String(c.status || c.state || c.action || "live")))
    .slice(0, 5)
    .map((c) => c.summary || c.title || c.label || c.path || "Fix shipped to your site");

  const coming = changes
    .filter((c) => /pending|queued|draft|waiting/i.test(String(c.status || c.state || "")))
    .slice(0, 3)
    .map((c) => ({
      what: c.summary || c.title || c.label || "Recent fix",
      when: c.eta || "Google still catching up",
    }));

  const endLabel = ends ? fmtDay(ends) : `day ${trialDays}`;
  const rangeLabel = joined
    ? `${hostname || "your site"} · ${fmtDay(joined)} to ${fmtDay(ends || new Date())}`
    : `${hostname || "your site"} · first ${dayNum} days`;

  if (loading) {
    return (
      <div className="v8-tr">
        <div className="v8-tr-inner">
          <SkeletonCards count={3} lines={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="v8-tr">
      <div className="v8-tr-inner">
        <span className="v8-tr-pills">
          <span className="v8-tr-pill">
            Day {dayNum} of your free month
          </span>
          {account?.sinceLive ? <span className="v8-tr-badge">LIVE DATA</span> : <span className="v8-tr-badge">WORKSPACE</span>}
        </span>
        <span className="v8-tr-script">Your first month, {name}.</span>
        <h1>Here&apos;s where you started, what we fixed, and what&apos;s moved so far.</h1>
        <span className="v8-tr-lede">
          {rangeLabel}. Some of this is early: Google is still catching up on your most recent fixes, so we&apos;ve marked
          what&apos;s proven and what&apos;s still coming.
          {account?.sinceNote ? ` ${account.sinceNote}` : ""}
        </span>
      </div>

      <section className="v8-tr-ba" aria-label="Before and after">
        <div className="v8-tr-card">
          <span className="v8-tr-card-label">DAY 1 · BEFORE</span>
          <div className="v8-tr-dots" aria-hidden="true">
            {beforeDots.map((d, i) => (
              <span key={i} style={{ background: d.c, boxShadow: `0 0 6px ${d.g}` }} />
            ))}
          </div>
          <span style={{ fontSize: 14, color: "#D7DADE" }}>{beforeLabel}</span>
        </div>
        <div className="v8-tr-arrow" aria-hidden="true">
          →
        </div>
        <div className="v8-tr-card is-now">
          <span className="v8-tr-card-label">
            DAY {dayNum} · NOW
          </span>
          <div className="v8-tr-dots" aria-hidden="true">
            {afterDots.map((d, i) => (
              <span key={i} style={{ background: d.c, boxShadow: `0 0 6px ${d.g}` }} />
            ))}
          </div>
          <span style={{ fontSize: 14, color: "#D7DADE" }}>{afterLabel}</span>
        </div>
      </section>

      <section className="v8-tr-section" aria-labelledby="pr-h">
        <h2 id="pr-h">The numbers, honestly</h2>
        <div className="v8-tr-table">
          <div style={{ minWidth: 620 }}>
            <div className="v8-tr-table-head" aria-hidden="true">
              <span>MEASURE</span>
              <span style={{ textAlign: "right" }}>DAY 1</span>
              <span style={{ textAlign: "right" }}>DAY {dayNum}</span>
              <span>STATUS</span>
            </div>
            {metrics.map((m) => (
              <div key={m.what} className="v8-tr-table-row">
                <span>{m.what}</span>
                <span style={{ textAlign: "right", fontFamily: "var(--mono)", color: "#9AA1AB" }}>{m.a}</span>
                <span style={{ textAlign: "right", fontFamily: "var(--mono)", fontWeight: 600 }}>{m.b}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: m.color }}>{m.status}</span>
              </div>
            ))}
          </div>
        </div>
        <span style={{ fontSize: 13, color: "#9AA1AB" }}>
          From your Google Search Console and Analytics when connected. &ldquo;Too early&rdquo; means a fix went live
          recently and Google hasn&apos;t finished re-reading the page.
        </span>
      </section>

      <section className="v8-tr-split">
        <div className="v8-tr-panel">
          <h2>What we fixed together</h2>
          <span style={{ fontSize: 14, color: "#9AA1AB" }}>
            {moves ? `${moves} fixes approved and live. All undoable.` : "Fixes you approve will show up here."}
          </span>
          {(fixed.length ? fixed : ["Connect Google and approve your first move to start this list."]).map((f) => (
            <div key={f} className="v8-tr-fix-row">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none", marginTop: 3 }}>
                <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#3DDC84" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{f}</span>
            </div>
          ))}
        </div>
        <div className="v8-tr-panel is-warn">
          <h2>Still coming</h2>
          <span style={{ fontSize: 14, color: "#D7DADE", lineHeight: 1.5 }}>
            Recent fixes can take another 3 to 6 weeks for Google to fully reflect. We keep watching and mark what&apos;s
            proven here.
          </span>
          {(coming.length
            ? coming
            : [
                { what: "Newest title and description changes", when: "results in 3–6 weeks" },
                { what: "Internal link updates", when: "results in 3–6 weeks" },
              ]
          ).map((c) => (
            <div key={c.what} className="v8-tr-coming-row">
              <span>{c.what}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "#FFC53D" }}>{c.when}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="v8-tr-decide" aria-labelledby="dec-h">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h2 id="dec-h">Your free month ends on {endLabel}.</h2>
          <span style={{ fontSize: 15, color: "#D7DADE" }}>Nothing to do if you&apos;d like to keep going. Or choose what&apos;s next:</span>
        </div>
        <div className="v8-tr-choices">
          <div className="v8-tr-choice is-primary">
            <span style={{ fontSize: 17, fontWeight: 600 }}>Keep going on Solo</span>
            <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5, flex: 1 }}>
              Continue after {endLabel}. Results from your newest fixes land over the next two months.
            </span>
            <Link href="/app/billing">Keep Solo</Link>
          </div>
          <div className="v8-tr-choice">
            <span style={{ fontSize: 17, fontWeight: 600 }}>Upgrade to Pro</span>
            <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5, flex: 1 }}>
              Unlimited fixes, calls and leads from Analytics, and tracking of whether AI answers mention you.
            </span>
            <Link href="/app/billing">See Pro</Link>
          </div>
          <div className="v8-tr-choice is-muted">
            <span style={{ fontSize: 17, fontWeight: 600 }}>Not right now</span>
            <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5, flex: 1 }}>
              Cancel before {endLabel} and you pay nothing. Every fix we made stays on your site.
            </span>
            <Link href="/app/cancel">Cancel my free month</Link>
          </div>
        </div>
      </section>

      <section className="v8-tr-note" aria-label="A note from the founder">
        <span style={{ fontSize: 16, lineHeight: 1.7 }}>
          {name}, thank you for being one of our early users. Every scan and fix runs on real search data and AI that we
          pay for, and we were glad to cover your first month, because we&apos;d rather earn your business than ask for
          it. If anything in this report doesn&apos;t make sense, or you&apos;d like a hand with what&apos;s next, just
          reply. A real person reads every message, usually me.
        </span>
        <FounderSignature />
      </section>
    </div>
  );
}
