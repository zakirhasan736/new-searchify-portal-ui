"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  cancelSubscription,
  getBillingAccount,
  reactivateSubscription,
  takeRetentionOffer,
} from "@/lib/billingApi";
import { userIsAuthenticated } from "@/utils/users/Helpers";
import "@/styles/v8-cancel.css";

/** Exact metric cards from Cancel.html when live since-data is empty. */
const DESIGN_SINCE = [
  { label: "Clicks from Google / month", from: "1,240", to: "2,035", change: "+64%" },
  { label: "Average position", from: "18.4", to: "9.7", change: "Up 8.7 spots, onto page 1" },
  { label: "Pages at Great or Excellent", from: "0", to: "6", change: "6 pages reached the goal" },
  { label: "Pages Google has found", from: "71", to: "96", change: "+25 pages now showing" },
];

function buildReasons({ soloMo, paidThroughLabel, movesShipped }) {
  const solo = soloMo || 49;
  const when = paidThroughLabel || "your next renewal";
  const measured = Math.max(0, Number(movesShipped) || 0);
  const resultsTitle =
    measured > 0
      ? `${measured} of your changes are still being measured.`
      : "Give the changes time to land.";
  const resultsBody =
    measured > 0
      ? `Most changes take about 28 days to show up in Google. Staying through ${when} gives your first results window a fair shot.`
      : `Most changes take about 28 days to show up in Google. Staying through ${when} gives your first results window a fair shot.`;

  return [
    {
      id: "price",
      label: "It costs too much",
      hint: "The price doesn’t fit right now",
      title: "Let’s make the price fit instead.",
      body: "You don’t have to lose your setup, your history or your launch price to spend less.",
      offers: [
        {
          action: "switch_solo",
          label: `Switch to Solo · $${solo} / month`,
          desc: `One website, the same weekly moves and checks. Keeps your launch price. Starts at your next renewal on ${when}.`,
          btn: "Switch to Solo",
        },
        {
          action: "pause",
          label: "Pause for up to 3 months",
          desc: "No charges and nothing runs. Your history, settings and launch price wait for you. We’ll email a week before it restarts.",
          btn: "Pause my plan",
        },
      ],
    },
    {
      id: "done",
      label: "I got what I needed",
      hint: "My site is in good shape now",
      title: "Your fixes are live. Want someone watching them?",
      body: "Rankings drift, pages change and plugins update. A lighter plan keeps an eye on what you’ve already won.",
      offers: [
        {
          action: "watch_solo",
          label: `Keep watch on Solo · $${solo} / month`,
          desc: "Weekly scans, ranking alerts and automatic rollback if something drops. New moves only when they’re worth it.",
          btn: "Switch to Solo",
        },
        {
          action: "pause",
          label: "Pause for up to 3 months",
          desc: "Come back for a check-up later without losing your history or launch price.",
          btn: "Pause my plan",
        },
      ],
    },
    {
      id: "results",
      label: "I’m not seeing results",
      hint: "Rankings or traffic haven’t moved",
      title: resultsTitle,
      body: resultsBody,
      offers: [
        {
          action: "free_month",
          label: "Take next month free",
          desc: "Stay through the results window at no cost. If nothing moved by then, cancel in one click.",
          btn: "Take the free month",
        },
        {
          action: "book_review",
          label: "Book a 15-minute results review",
          desc: "A real person looks at your sites with you and tells you honestly whether Searchify is the right fit.",
          btn: "Pick a time",
        },
      ],
    },
    {
      id: "time",
      label: "Reviewing moves takes too long",
      hint: "I don’t have time to approve everything",
      title: "Let Searchify handle the small stuff on its own.",
      body: "Most of your approvals were titles, descriptions and internal links. Those can ship without you, still checked live and undoable.",
      offers: [
        {
          action: "autopilot",
          label: "Turn on “Ship small fixes on its own”",
          desc: "Up to 5 small fixes a week ship automatically. Bigger moves still wait for you. Change it back any time in Settings.",
          btn: "Turn it on",
        },
        {
          action: "weekly_email",
          label: "Get one weekly email instead of alerts",
          desc: "Approve or decline everything from a single email on your phone.",
          btn: "Switch to weekly",
        },
      ],
    },
    {
      id: "feature",
      label: "It’s missing something I need",
      hint: "A feature, platform or report",
      follow: "What’s missing?",
      ph: "For example: Shopify, bulk edits, white-label reports",
      title: "Tell us what’s missing. We may already be building it.",
      body: "We’ll tell you honestly if it’s on the way, and email you the day it ships.",
      offers: [
        {
          action: "book_founder",
          label: "Talk to the founder for 15 minutes",
          desc: "Explain what you need. If it’s coming soon, we’ll give you the time in between for free.",
          btn: "Pick a time",
        },
      ],
    },
    {
      id: "broken",
      label: "Something isn’t working",
      hint: "Errors, a broken connection or bad changes",
      follow: "What’s going wrong?",
      ph: "For example: WordPress keeps disconnecting",
      title: "Let us fix it before you decide.",
      body: "Problems go to the top of our queue. If we can’t fix it within 3 business days, cancel with a full refund for this month.",
      offers: [
        {
          action: "report_problem",
          label: "Report it and get it fixed first",
          desc: "A real person replies within one business day. Your plan stays on until it’s sorted.",
          btn: "Report the problem",
        },
      ],
    },
    {
      id: "switch",
      label: "I’m moving to another tool",
      hint: "Something else fits better",
      follow: "Which one? (optional)",
      ph: "Tool name",
      title: "Fair enough. Can we ask what tipped it?",
      body: "It helps us see where we fall short. Your change log is yours to take with you.",
      offers: [],
    },
    {
      id: "closing",
      label: "My business or site is closing",
      hint: "I don’t need SEO anymore",
      title: "Sorry to hear it. We’ll keep this simple.",
      body: "Nothing to sell you here.",
      offers: [],
    },
    {
      id: "other",
      label: "Something else",
      hint: "Tell us in the box below",
      title: "Thanks for telling us.",
      body: "If there’s anything we can do, we will.",
      offers: [],
    },
  ];
}

function FactIcon({ kind }) {
  const color = kind === "ok" ? "#3DDC84" : kind === "warn" ? "#FFC53D" : "#4DA3FF";
  const bg = kind === "ok" ? "rgba(61,220,132,.12)" : kind === "warn" ? "rgba(255,197,61,.12)" : "rgba(77,163,255,.12)";
  const d = kind === "ok" ? "M5 12l5 5 9-10" : kind === "warn" ? "M12 7v6M12 17h.01" : "M12 8h.01M12 11v6";
  return (
    <span className="v8-cancel-fact-icon" style={{ background: bg }} aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
    </span>
  );
}

function joinedShort(label) {
  if (!label) return "";
  return String(label).replace(/, \d{4}$/, "");
}

export default function CancelScreen() {
  const router = useRouter();
  const [account, setAccount] = useState(null);
  const [step, setStep] = useState("why");
  const [reasonId, setReasonId] = useState(null);
  const [detail, setDetail] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!userIsAuthenticated()) {
      router.replace("/login?next=/app/cancel");
      return;
    }
    getBillingAccount().then((res) => {
      if (res.ok) {
        setAccount(res.data);
        if (res.data?.status === "cancelled") {
          setStep("done");
          if (res.data?.cancel?.reason) setReasonId(res.data.cancel.reason);
          if (res.data?.cancel?.detail) setDetail(res.data.cancel.detail);
          if (res.data?.cancel?.note) setNote(res.data.cancel.note);
        } else if (res.data?.status === "paused") {
          setSaved({
            title: "Your plan is paused.",
            body: `No charges from ${res.data.paidThroughLabel || "your next renewal"}. We’ll email you a week before it restarts, and you can restart early any time.`,
          });
          setStep("saved");
        }
      } else {
        setAccount({
          name: "Pro",
          planId: "pro",
          priceMo: 79,
          listMo: 99,
          founding: true,
          paidThroughLabel: "Nov 14",
          joinedLabel: "Jun 12, 2026",
          business: "Rivera Digital",
          movesShipped: 96,
          email: "",
          since: DESIGN_SINCE,
        });
      }
    });
  }, [router]);

  const reasons = useMemo(
    () =>
      buildReasons({
        soloMo: 49,
        paidThroughLabel: account?.paidThroughLabel,
        movesShipped: account?.movesShipped,
      }),
    [account],
  );
  const cur = reasons.find((r) => r.id === reasonId) || null;

  const planLine = useMemo(() => {
    if (!account) return "Loading plan…";
    const per = account.billing === "annual" ? "year" : "month";
    const amount = account.billing === "annual" ? (account.priceMo || 0) * 10 : account.priceMo || 0;
    return `${account.name} · $${amount} / ${per}`;
  }, [account]);

  const planSub = useMemo(() => {
    if (!account) return "";
    const moves = account.movesShipped || 0;
    const joined = joinedShort(account.joinedLabel) || "you joined";
    const moveBit = moves ? ` · ${moves} moves shipped since ${joined}` : ` · joined ${joined}`;
    return `${account.business || "Your workspace"} · paid through ${account.paidThroughLabel || "—"}${moveBit}`;
  }, [account]);

  const facts = useMemo(() => {
    const when = account?.paidThroughLabel || "the end of your billing period";
    const price = account?.priceMo || 79;
    const list = account?.listMo || 99;
    const founding = account?.founding && account?.planId === "pro";
    return [
      {
        kind: "ok",
        title: `You keep everything until ${when}`,
        body: "Scans, moves and results keep running until the end of the period you paid for. No more charges after that.",
      },
      {
        kind: "ok",
        title: "Every change already live stays on your site",
        body: "Nothing we shipped is undone. Your pages keep their titles, links and fixes.",
      },
      {
        kind: "info",
        title: `After ${when}, nothing new runs`,
        body: "No new moves, no ranking checks, and no automatic rollback if something drops.",
      },
      founding
        ? {
            kind: "warn",
            title: `Your $${price} launch price ends`,
            body: `Launch pricing is only for the first 100 customers while they stay subscribed. If you come back later, Pro is $${list} a month.`,
          }
        : {
            kind: "info",
            title: "Coming back later",
            body: "If you resubscribe, you’ll pick up at the current plan price.",
          },
      {
        kind: "ok",
        title: "Your account and history are kept",
        body: "If you come back, you start where you left off. Want it all deleted instead? Ask us and we’ll do it.",
      },
    ];
  }, [account]);

  const liveSince = Array.isArray(account?.since) ? account.since.filter((s) => s?.label) : [];
  const since = liveSince.length ? liveSince : DESIGN_SINCE;
  const showSteps = step === "why" || step === "offer" || step === "confirm";
  const showSince = step === "why" || step === "confirm";
  const stepOrder = ["why", "offer", "confirm"];
  const stepIdx = stepOrder.indexOf(step);
  const joined = account?.joinedLabel || "day one";

  const goContinue = () => {
    if (!cur) return;
    setStep(cur.offers.length ? "offer" : "confirm");
  };

  const takeOffer = async (offer) => {
    setErr("");
    setBusy(true);
    const res = await takeRetentionOffer({
      action: offer.action,
      reason: reasonId || "",
      detail,
      note,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.data?.detail || "Could not apply that option. Try again.");
      return;
    }
    if (res.data) setAccount(res.data);
    setSaved({
      title: res.data?.savedTitle || "You’re all set.",
      body: res.data?.savedBody || res.data?.detail || "Your plan is updated.",
    });
    setStep("saved");
  };

  const doCancel = async () => {
    setErr("");
    setBusy(true);
    const res = await cancelSubscription({ reason: reasonId || "", detail, note });
    setBusy(false);
    if (!res.ok) {
      setErr(res.data?.detail || "Could not cancel. Try again.");
      return;
    }
    if (res.data) setAccount(res.data);
    setStep("done");
  };

  const reactivate = async () => {
    setErr("");
    setBusy(true);
    const res = await reactivateSubscription();
    setBusy(false);
    if (!res.ok) {
      setErr(res.data?.detail || "Could not reactivate. Try again.");
      return;
    }
    if (res.data) setAccount(res.data);
    const priceBit =
      res.data?.founding && res.data?.priceMo
        ? ` and your $${res.data.priceMo} launch price`
        : "";
    setSaved({
      title: "Welcome back. Nothing changed.",
      body: `Your ${res.data?.name || "plan"} plan${priceBit} carry on. Next charge is ${res.data?.paidThroughLabel || "at renewal"}.`,
    });
    setStep("saved");
  };

  return (
    <div className="v8-cancel">
      <header className="v8-cancel-head">
        <Link href="/app/settings?tab=billing" className="v8-cancel-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Plan and billing
        </Link>
        {showSteps ? (
          <ol className="v8-cancel-steps" aria-label="Cancel steps">
            {[
              ["why", "Why"],
              ["offer", "Options"],
              ["confirm", "Confirm"],
            ].map(([id, label], i) => {
              const on = id === step;
              const past = stepIdx > i;
              return (
                <li key={id} className={on ? "is-on" : past ? "is-past" : ""} aria-current={on ? "step" : "false"}>
                  <span>{past ? "✓" : String(i + 1)}</span>
                  {label}
                </li>
              );
            })}
          </ol>
        ) : null}
      </header>

      <div className="v8-cancel-main">
        <div className="v8-cancel-plan">
          <span className="v8-cancel-plan-inner">
            <span className="v8-cancel-plan-title">
              {planLine}
              {account?.founding && account?.planId === "pro" ? <span className="v8-cancel-badge">LAUNCH PRICE</span> : null}
            </span>
            <span className="v8-cancel-plan-sub">{planSub}</span>
          </span>
        </div>

        {showSince ? (
          <section className="v8-cancel-since" aria-labelledby="since-h">
            <div className="v8-cancel-since-top">
              <h2 id="since-h">Since you joined{joinedShort(account?.joinedLabel) ? ` on ${joinedShort(account.joinedLabel)}` : ""}</h2>
              <Link href="/app/results">See the full before-and-after</Link>
            </div>
            <div className="v8-cancel-since-grid">
              {since.map((s) => (
                <div key={s.label} className="v8-cancel-since-card">
                  <span className="v8-cancel-since-label">{s.label}</span>
                  <span className="v8-cancel-since-row">
                    <span className="v8-cancel-since-from">
                      {s.from} →
                    </span>
                    <span className="v8-cancel-since-to">{s.to}</span>
                  </span>
                  <span className="v8-cancel-since-change">{s.change}</span>
                </div>
              ))}
            </div>
            <span className="v8-cancel-since-note">
              Compared with your starting point saved on {joined}, across your sites, and with the same months last year so seasons don&apos;t skew it.
            </span>
          </section>
        ) : null}

        {step === "why" ? (
          <section className="v8-cancel-section" aria-labelledby="why-h">
            <div className="v8-cancel-section-head">
              <h1 id="why-h">Before you go, what&apos;s the main reason?</h1>
              <span className="v8-cancel-lede">
                Pick the closest one. It takes 20 seconds and it&apos;s the only way we get better. You can cancel on the next screen either way.
              </span>
            </div>
            <div className="v8-cancel-reasons" role="radiogroup" aria-label="Main reason for cancelling">
              {reasons.map((r) => {
                const on = reasonId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className={`v8-cancel-reason${on ? " is-on" : ""}`}
                    onClick={() => {
                      setReasonId(r.id);
                      setDetail("");
                    }}
                  >
                    <span className="v8-cancel-radio" aria-hidden="true">
                      <i />
                    </span>
                    <span className="v8-cancel-reason-copy">
                      <span className="v8-cancel-reason-label">{r.label}</span>
                      <span className="v8-cancel-reason-hint">{r.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {cur?.follow ? (
              <label className="v8-cancel-label">
                {cur.follow}
                <input type="text" value={detail} placeholder={cur.ph || ""} onChange={(e) => setDetail(e.target.value)} />
              </label>
            ) : null}
            <label className="v8-cancel-label">
              What would have made you stay? <span className="v8-cancel-label-hint">Optional. The founder reads every answer.</span>
              <textarea rows={3} value={note} placeholder="Be blunt. It helps." onChange={(e) => setNote(e.target.value)} />
            </label>
            <div className="v8-cancel-actions">
              <Link href="/app/settings?tab=billing" className="v8-cancel-btn is-primary">
                Keep my plan
              </Link>
              {cur ? (
                <button type="button" className="v8-cancel-btn is-secondary" onClick={goContinue}>
                  Continue
                </button>
              ) : (
                <>
                  <button type="button" className="v8-cancel-btn is-secondary" aria-disabled="true" disabled>
                    Continue
                  </button>
                  <span className="v8-cancel-hint">Pick a reason to continue</span>
                </>
              )}
            </div>
          </section>
        ) : null}

        {step === "offer" && cur ? (
          <section className="v8-cancel-section" aria-labelledby="off-h">
            <div className="v8-cancel-section-head">
              <span className="v8-cancel-said">YOU SAID: {cur.label.toUpperCase()}</span>
              <h1 id="off-h">{cur.title}</h1>
              <span className="v8-cancel-lede">{cur.body}</span>
            </div>
            <div className="v8-cancel-offers">
              {cur.offers.map((o) => (
                <div key={o.action + o.label} className="v8-cancel-offer">
                  <span className="v8-cancel-offer-copy">
                    <span className="v8-cancel-offer-label">{o.label}</span>
                    <span className="v8-cancel-offer-desc">{o.desc}</span>
                  </span>
                  <button
                    type="button"
                    className="v8-cancel-btn is-primary is-offer"
                    disabled={busy}
                    onClick={() => takeOffer(o)}
                  >
                    {busy ? "Working…" : o.btn}
                  </button>
                </div>
              ))}
            </div>
            {err ? (
              <p className="v8-cancel-err" role="alert">
                {err}
              </p>
            ) : null}
            <div className="v8-cancel-actions">
              <button type="button" className="v8-cancel-btn is-sm" onClick={() => setStep("why")}>
                Back
              </button>
              <button type="button" className="v8-cancel-linkbtn" onClick={() => setStep("confirm")}>
                No thanks, continue cancelling
              </button>
            </div>
          </section>
        ) : null}

        {step === "confirm" ? (
          <section className="v8-cancel-section" aria-labelledby="cf-h">
            <div className="v8-cancel-section-head">
              <h1 id="cf-h">Here&apos;s exactly what happens if you cancel.</h1>
              <span className="v8-cancel-lede">No surprises, no fine print.</span>
            </div>
            <ul className="v8-cancel-facts">
              {facts.map((f) => (
                <li key={f.title}>
                  <FactIcon kind={f.kind} />
                  <span className="v8-cancel-fact-copy">
                    <span className="v8-cancel-fact-title">{f.title}</span>
                    <p className="v8-cancel-fact-body">{f.body}</p>
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/app/history" className="v8-cancel-download">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
              </svg>
              Download your change log and reports
            </Link>
            {err ? (
              <p className="v8-cancel-err" role="alert">
                {err}
              </p>
            ) : null}
            <div className="v8-cancel-actions is-confirm">
              <button type="button" className="v8-cancel-btn is-danger" disabled={busy} onClick={doCancel}>
                {busy ? "Cancelling…" : "Cancel my subscription"}
              </button>
              <Link href="/app/settings?tab=billing" className="v8-cancel-btn is-primary">
                Keep my plan
              </Link>
              <button
                type="button"
                className="v8-cancel-ghost"
                onClick={() => setStep(cur?.offers?.length ? "offer" : "why")}
              >
                Back
              </button>
            </div>
          </section>
        ) : null}

        {step === "done" ? (
          <section className="v8-cancel-section" aria-labelledby="dn-h" role="status">
            <div className="v8-cancel-section-head">
              <h1 id="dn-h">Your subscription is cancelled.</h1>
              <span className="v8-cancel-lede">
                Everything keeps working until {account?.paidThroughLabel || "the end of your billing period"}. After that there are no more
                charges. A confirmation is on its way to {account?.email || "your inbox"}.
              </span>
            </div>
            <div className="v8-cancel-echo">
              <span className="v8-cancel-echo-kicker">What you told us</span>
              <span className="v8-cancel-echo-reason">{cur?.label || reasonId || "—"}</span>
              {detail ? (
                <p className="v8-cancel-echo-line">
                  {(cur?.follow || "").replace(" (optional)", "")} {detail}
                </p>
              ) : null}
              {note ? <p className="v8-cancel-echo-line">“{note}”</p> : null}
              <span className="v8-cancel-echo-thanks">Thank you. This goes straight to the founder, not a support queue.</span>
            </div>
            {err ? (
              <p className="v8-cancel-err" role="alert">
                {err}
              </p>
            ) : null}
            <div className="v8-cancel-actions">
              <button type="button" className="v8-cancel-btn is-primary" disabled={busy} onClick={reactivate}>
                {busy ? "Restoring…" : "Changed my mind, keep my plan"}
              </button>
              <Link href="/app" className="v8-cancel-btn is-secondary">
                Back to Home
              </Link>
            </div>
          </section>
        ) : null}

        {step === "saved" && saved ? (
          <section className="v8-cancel-section" aria-labelledby="sv-h" role="status">
            <div className="v8-cancel-saved-title">
              <span className="v8-cancel-saved-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5 9-10" />
                </svg>
              </span>
              <h1 id="sv-h">{saved.title}</h1>
            </div>
            <span className="v8-cancel-saved-body">{saved.body}</span>
            <div className="v8-cancel-actions">
              <Link href="/app" className="v8-cancel-btn is-primary">
                Back to Home
              </Link>
              <button type="button" className="v8-cancel-linkbtn" onClick={() => setStep("confirm")}>
                I still want to cancel
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
