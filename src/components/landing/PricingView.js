"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SearchifyMark from "@/components/landing/SearchifyMark";
import { V8Button, V8Field, V8Segmented } from "@/components/v8/primitives";
import { getBillingAccount, getBillingCatalog, startCheckout } from "@/lib/billingApi";
import { SkeletonCards } from "@/components/v8/SkeletonWave";
import { PLAN_ALIAS, choosePlan, hydrateJourney, readySites, syncJourneyNow } from "@/lib/journey";
import { getUser, userIsAuthenticated } from "@/utils/users/Helpers";
import "@/styles/v8-kit.css";
import "@/styles/v8-pricing.css";

const FALLBACK_EARLY = {
  total: 100,
  claimed: 63,
  claimedThisWeek: 12,
  lastClaimed: "2 hrs",
  proListMo: 99,
  proLaunchMo: 79,
};

const FALLBACK_MANAGED = {
  name: "Managed",
  tag: "DONE FOR YOU",
  fromMo: 599,
  href: "https://sovereignstandard.ca",
  features: [
    "A dedicated expert SEO strategist",
    "Hands-on help with connections and onboarding",
    "Monthly progress reports",
    "Proactive monitoring to catch issues early",
    "Every feature in the Agency plan",
  ],
};

const FALLBACK = [
  {
    id: "solo",
    name: "Solo",
    tag: "ONE BUSINESS",
    sites: "1 website",
    mo: 49,
    freeMonth: true,
    founding: false,
    popular: false,
    features: [
      "Search Console + WordPress",
      "Colour-coded task board",
      "Up to 10 approved fixes a month",
      "Change log, one-click undo, unlimited CSV export",
      "1 branded PDF report per month",
      "2 site scans, 10 tracked keywords, and 5 backlink checks a month",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tag: "GROWING TEAMS",
    sites: "Up to 5 websites",
    mo: 79,
    listMo: 99,
    freeMonth: false,
    founding: true,
    popular: true,
    features: [
      "Everything in Solo, with unlimited approved fixes",
      "Calls and leads from Analytics",
      "5 branded reports per site, per month",
      "1 scheduled client send + 3 client logins per site",
      "AI answer tracking and autopilot within limits",
      "8 site scans, 40 keyword checks (50 tracked), and 20 backlink checks a month",
      "Extra websites $15 USD/mo each",
    ],
  },
  {
    id: "premium",
    name: "Agency",
    tag: "BEST FOR AGENCIES",
    sites: "Up to 25 websites",
    mo: 399,
    freeMonth: false,
    founding: false,
    popular: false,
    features: [
      "Everything in Pro",
      "Unlimited white-label reports, no Searchify name",
      "Unlimited scheduled sends and client logins",
      "All-clients view and team seats",
      "30 site scans, 150 keyword checks (200 tracked), and 60 backlink checks a month",
    ],
  },
];

const SITE_HELP = {
  solo: "A site is one website (one domain, like yourbusiness.com) with all its pages. Solo covers 1 site.",
  pro: "A site is one website (one domain, like yourbusiness.com) with all its pages. Pro covers up to 5 sites, and extra sites are $15 USD a month each.",
  premium:
    "A site is one website (one domain, like yourbusiness.com) with all its pages. Agency covers up to 25 sites, across all your clients.",
  agency:
    "A site is one website (one domain, like yourbusiness.com) with all its pages. Agency covers up to 25 sites, across all your clients.",
};

const TIMELINE = [
  { when: "WEEK 1", title: "Scan and first fixes", body: "Every page scored. Your first fixes approved and live.", color: "#4DA3FF" },
  { when: "WEEKS 2–4", title: "Google catches up", body: "Google re-reads your updated pages. Early signs appear, like showing up in more searches.", color: "#FFC53D" },
  { when: "DAY 30", title: "Your before-and-after", body: "A report of where you started, what we fixed, and what has moved so far.", color: "#D5F879" },
  { when: "MONTHS 2–3", title: "Results build", body: "Rankings, clicks and calls usually move most over this stretch.", color: "#3DDC84" },
];

const FAQ = [
  {
    q: "Does Searchify change my site on its own?",
    a: "Searchify suggests one move at a time and you approve it. Every change is logged, checked live after it ships, and can be undone in one click.",
  },
  {
    q: "What happens to my early launch price if I cancel?",
    a: "It stays locked in for as long as you're subscribed. If you cancel and come back later, you'd rejoin at the regular price.",
  },
  {
    q: "Can I change plans later?",
    a: "Anytime. Upgrades apply right away and are prorated. Downgrades take effect at the end of your billing period.",
  },
  {
    q: "Need more than 5 sites on Pro?",
    a: "Add extra websites for $15 USD/month each, or move to Agency when you're managing clients.",
  },
  {
    q: "When am I charged?",
    a: "On Solo, your first month is free: we charge on day 31, and email you 3 days before with your before-and-after report. Cancel before then and you pay nothing. Pro and Agency start billing the day you sign up, and you can cancel any time.",
  },
  {
    q: "How soon will I see results?",
    a: "Give it at least a month. You’ll see fixes go live and pages turn green in the first week, but Google takes weeks to re-read your pages and rerank them. Your day-30 report shows early signs, and rankings and traffic usually move over months two and three.",
  },
];

function money(n) {
  return `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

function userEmail() {
  const u = getUser();
  return String(u?.result?.email || u?.data?.email || u?.result?.username || "").trim();
}

function Tip({ id, openId, setOpenId, label, children }) {
  const open = openId === id;
  return (
    <span className="v8-pricing-tip">
      <button
        type="button"
        className="v8-pricing-tip-btn"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpenId(open ? null : id)}
        onBlur={(e) => {
          if (!e.currentTarget.parentElement?.contains(e.relatedTarget)) setOpenId(null);
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
          <path d="M12 11v7" />
          <path d="M12 6.5h.01" />
        </svg>
      </button>
      {open ? <span className="v8-pricing-tip-pop">{children}</span> : null}
    </span>
  );
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D5F879" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

export default function PricingView({ embedded = false, onboarding = false }) {
  const router = useRouter();
  const [period, setPeriod] = useState("month");
  const [pick, setPick] = useState("pro");
  const [defs, setDefs] = useState(FALLBACK);
  const [early, setEarly] = useState(FALLBACK_EARLY);
  const [managed, setManaged] = useState(FALLBACK_MANAGED);
  const [live, setLive] = useState(false);
  const [account, setAccount] = useState(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [openFaq, setOpenFaq] = useState(0);
  const [tip, setTip] = useState(null);
  const yearly = period === "year";

  useEffect(() => {
    const mail = userEmail();
    if (mail && mail.includes("@")) setEmail(mail);
    getBillingCatalog()
      .then((res) => {
        if (res.ok && Array.isArray(res.data?.plans) && res.data.plans.length) {
          setDefs(
            res.data.plans.map((p) => ({
              id: p.id,
              name: p.name,
              tag: p.tag,
              sites: p.sites,
              mo: Number(p.mo) || 0,
              listMo: p.listMo != null ? Number(p.listMo) : undefined,
              freeMonth: Boolean(p.freeMonth),
              founding: Boolean(p.founding),
              popular: Boolean(p.popular),
              features: Array.isArray(p.features) ? p.features : [],
            })),
          );
          if (res.data.earlyLaunch) setEarly({ ...FALLBACK_EARLY, ...res.data.earlyLaunch });
          if (res.data.managed) setManaged({ ...FALLBACK_MANAGED, ...res.data.managed });
          setLive(Boolean(res.data.live));
        } else {
          setLive(true);
        }
      })
      .catch(() => setLive(true));
    if (onboarding && userIsAuthenticated()) {
      hydrateJourney({ force: true }).then(() => {
        if (!readySites().length) router.replace("/app/start");
      });
    }
    if (!userIsAuthenticated()) return;
    getBillingAccount().then((res) => {
      if (!res.ok || !res.data?.planId) return;
      setAccount(res.data);
      setPick(res.data.planId);
      if (res.data.billing === "annual") setPeriod("year");
      if (res.data.email && String(res.data.email).includes("@")) setEmail(res.data.email);
    });
  }, [onboarding, router]);

  const claimed = Math.max(0, Math.min(Number(early.total) || 100, Number(early.claimed) || 0));
  const left = (Number(early.total) || 100) - claimed;

  const plans = useMemo(
    () =>
      defs.map((d) => {
        const on = d.id === pick;
        const yr = d.mo * 10;
        const listYr = d.listMo ? d.listMo * 10 : 0;
        let priceLabel;
        let per = yearly ? "USD/yr" : "USD/mo";
        let note;
        if (d.freeMonth) {
          priceLabel = "FREE";
          per = "for your first month";
          note = yearly ? `Then ${money(yr)} USD a year (2 months free)` : `Then ${money(d.mo)} USD a month. Cancel anytime.`;
        } else if (yearly) {
          priceLabel = money(yr);
          note = `Billed yearly · about ${money(Math.round(yr / 12))}/mo`;
        } else {
          priceLabel = money(d.mo);
          note = "Billed monthly";
        }
        const listPrice = d.founding ? (yearly ? money(listYr) : money(d.listMo || early.proListMo)) : "";
        return { ...d, on, priceLabel, per, note, listPrice, yr };
      }),
    [defs, pick, yearly, early.proListMo],
  );

  const chosen = plans.find((d) => d.id === pick) || plans[1] || plans[0];

  const orderPrice = chosen?.freeMonth
    ? "$0 today"
    : yearly
      ? `${money(chosen?.yr || 0)} USD / year`
      : `${money(chosen?.mo || 0)} USD / month`;
  const orderTrial = chosen?.freeMonth ? "First month free" : "Starts today";
  const orderBilled = chosen?.freeMonth
    ? yearly
      ? `Then ${money(chosen?.yr || 0)} USD a year, from day 31`
      : `Then ${money(chosen?.mo || 0)} USD a month, from day 31`
    : "Billed today · cancel any time";
  const orderFoot = chosen?.freeMonth
    ? "Card required, not charged for 30 days. We email you 3 days before, with your before-and-after report."
    : userIsAuthenticated()
      ? "Cancel any time from Settings."
      : "Create your account next. Cancel any time from Settings.";
  const freeMonthText = `Your first month on Solo is free. Results take about a month to show, so this gives you time to see them. After that it’s ${
    yearly ? `${money(49 * 10)} a year` : `${money(49)} a month`
  }, and you can cancel any time before then.`;

  const alreadyOn =
    embedded &&
    account?.planId === chosen?.id &&
    (yearly ? account.billing === "annual" : account.billing !== "annual");

  const checkout = async () => {
    setErr("");
    setMsg("");
    const mail = email.trim();
    if (!mail.includes("@")) {
      setErr("Enter a work email to continue.");
      return;
    }
    // Public + onboarding go through the full Checkout.dc.html flow (Stripe stub).
    if (!embedded) {
      const q = new URLSearchParams({
        plan: pick,
        billing: yearly ? "annual" : "monthly",
        email: mail,
      });
      router.push(`/checkout?${q}`);
      return;
    }
    setBusy(true);
    await hydrateJourney();
    const canonical = PLAN_ALIAS[pick] || pick;
    const path = choosePlan(canonical, yearly ? "annual" : "monthly");
    if (!path) {
      setBusy(false);
      setErr("That plan cannot cover the websites already in this workspace. Remove a site or pick a larger plan.");
      return;
    }
    const res = await startCheckout({
      planId: pick,
      billing: yearly ? "annual" : "monthly",
      email: mail,
    });
    await syncJourneyNow();
    setBusy(false);
    if (!res.ok) {
      setErr(res.data?.detail || "Could not start checkout. Try again.");
      return;
    }
    setMsg(res.data?.detail || "Plan selected.");
    const fresh = await getBillingAccount();
    if (fresh.ok && fresh.data?.planId) {
      setAccount(fresh.data);
      setPick(fresh.data.planId);
    }
  };

  return (
    <div className="v8-page v8-pricing">
      <header className="v8-pricing-head">
        {embedded ? (
          <span className="v8-pricing-current">
            {account ? (
              <>
                Your plan is <strong>{account.name}</strong>
                {" · "}
                {account.sitesUsed} of {account.siteLimit} websites
                {account.allowance?.features?.audits?.limit != null
                  ? ` · ${account.allowance.features.audits.used} of ${account.allowance.features.audits.limit} scans`
                  : ""}
                {account.allowance?.features?.keywords?.limit != null
                  ? ` · ${account.allowance.features.keywords.used} of ${account.allowance.features.keywords.limit} keyword checks`
                  : ""}
                {account.allowance?.features?.backlinks?.limit != null
                  ? ` · ${account.allowance.features.backlinks.used} of ${account.allowance.features.backlinks.limit} backlink checks`
                  : ""}
                {" · "}
                {account.billing === "annual" ? "billed yearly" : "billed monthly"}
                {account.status === "trial" ? ` · ${account.trialDays || 30}-day free month` : ""}
              </>
            ) : (
              "Loading your plan…"
            )}
          </span>
        ) : (
          <Link href="/" className="v8-brand">
            <SearchifyMark size={28} />
            <span>searchify</span>
          </Link>
        )}
        <Link
          href={onboarding ? "/app/start" : embedded ? "/app/settings" : userIsAuthenticated() ? "/app" : "/login"}
          className="v8-pricing-back"
        >
          {onboarding ? "Back" : embedded ? "Settings" : userIsAuthenticated() ? "Back to app" : "Sign in"}
        </Link>
      </header>

      <div className="v8-wrap v8-pricing-hero">
        <h1 className="v8-pricing-caveat">Pay for sites, not seats.</h1>
        <p className="v8-lede">
          Searchify scans your site, suggests the next best move, and waits for your go-ahead. Every plan includes the
          scan, the colour-coded board, approvals, live checks and one-click undo.
        </p>
      </div>

      <section className="v8-wrap v8-pricing-early" aria-label="Early launch pricing">
        <div className="v8-pricing-early-inner">
          <div className="v8-pricing-early-top">
            <div className="v8-pricing-early-copy">
              <p className="v8-pricing-early-live">
                <span className="v8-pricing-pulse" aria-hidden="true" />
                EARLY LAUNCH PRICING · LIVE
              </p>
              <h2>
                {left} of {early.total} spots left
              </h2>
              <p>
                The first {early.total} customers lock in{" "}
                <strong>Pro at {money(early.proLaunchMo)}</strong> instead of {money(early.proListMo)}, for as long as
                they stay subscribed. And Solo is <strong>free for your first month</strong>.
              </p>
            </div>
            <div className="v8-pricing-early-stats">
              <div className="v8-pricing-stat">
                <p>
                  {early.claimedThisWeek}
                  <span className="v8-pricing-caret" aria-hidden="true" />
                </p>
                <span>claimed this week</span>
              </div>
              <div className="v8-pricing-stat">
                <p>
                  {early.lastClaimed}
                  <span className="v8-pricing-caret" aria-hidden="true" />
                </p>
                <span>since the last spot was claimed</span>
              </div>
            </div>
          </div>
          <div
            className="v8-pricing-bar"
            role="progressbar"
            aria-label="Early launch spots claimed"
            aria-valuemin={0}
            aria-valuemax={early.total}
            aria-valuenow={claimed}
          >
            <div className="v8-pricing-bar-fill" style={{ width: `${claimed}%` }} />
          </div>
          <div className="v8-pricing-bar-labels">
            <span>{claimed} CLAIMED</span>
            <span>{early.total} SPOTS TOTAL</span>
          </div>
        </div>
      </section>

      <div className="v8-wrap v8-pricing-toggle">
        <V8Segmented
          ariaLabel="Billing period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: "month", label: "Monthly" },
            { value: "year", label: "Yearly · 2 months free", accent: "green" },
          ]}
        />
      </div>

      <div className="v8-wrap v8-pricing-grid" id="plans">
        {!live ? (
          <div style={{ gridColumn: "1 / -1" }}>
            <SkeletonCards count={3} lines={5} />
          </div>
        ) : (
          plans.map((pl) => (
            <article key={pl.id} className={`v8-card${pl.on ? " is-on" : ""}`}>
              <div className="v8-pricing-card-top">
                <h2>{pl.name}</h2>
                <span className="v8-pricing-tag">{account?.planId === pl.id ? "YOUR PLAN" : pl.tag}</span>
              </div>
              <div className="v8-pricing-price-block">
                {pl.founding ? <p className="v8-pricing-founding">EARLY LAUNCH PRICING</p> : null}
                {pl.popular ? <p className="v8-pricing-popular">RECOMMENDED · MOST POPULAR</p> : null}
                {pl.freeMonth ? (
                  <p className="v8-pricing-free-row">
                    <span className="v8-pricing-free-pill">First month free</span>
                    <Tip id={`free-${pl.id}`} openId={tip} setOpenId={setTip} label="What is the free month?">
                      <span>{freeMonthText}</span>
                    </Tip>
                  </p>
                ) : null}
                <div className="v8-pricing-price">
                  <span>{pl.priceLabel}</span>
                  {pl.listPrice ? (
                    <s className="v8-pricing-was" aria-label={`Regular price ${pl.listPrice}`}>
                      {pl.listPrice}
                    </s>
                  ) : null}
                  <small>{pl.per}</small>
                </div>
                <span className="v8-pricing-note">{pl.note}</span>
              </div>
              <span className="v8-pricing-sites">
                {pl.sites}
                <Tip id={`site-${pl.id}`} openId={tip} setOpenId={setTip} label="What is a site?">
                  <span>{SITE_HELP[pl.id] || SITE_HELP.solo}</span>
                </Tip>
              </span>
              <ul className="v8-pricing-feats">
                {pl.features.map((f) => (
                  <li key={f}>
                    <Check />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`v8-pricing-cta${pl.on ? " is-on" : ""}`}
                onClick={() => {
                  setPick(pl.id);
                  setErr("");
                  setMsg("");
                }}
              >
                {pl.on && account?.planId === pl.id ? "Current plan" : pl.on ? "Selected" : `Choose ${pl.name}`}
              </button>
            </article>
          ))
        )}
      </div>

      <article className="v8-wrap v8-pricing-managed" aria-label="Managed plan">
        <div className="v8-pricing-managed-price">
          <div className="v8-pricing-card-top">
            <h2>{managed.name}</h2>
            <span className="v8-pricing-tag">{managed.tag}</span>
          </div>
          <p className="v8-pricing-price">
            <small>from</small>
            <span>{money(managed.fromMo)}</span>
            <small>USD/mo</small>
          </p>
          <span className="v8-pricing-note">Custom quote based on your site and goals</span>
        </div>
        <div className="v8-pricing-managed-body">
          <p>
            Rather have people handle it? Real humans run Searchify for you. Our partner agency, Sovereign Standard,
            makes the calls, approves the moves and keeps you posted.
          </p>
          <ul className="v8-pricing-feats v8-pricing-managed-feats">
            {(managed.features || []).map((f) => (
              <li key={f}>
                <Check />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <a className="v8-pricing-managed-cta" href={managed.href || "https://sovereignstandard.ca"} target="_blank" rel="noreferrer">
          Talk to Sovereign Standard
        </a>
      </article>

      <section className="v8-wrap v8-pricing-expect" aria-labelledby="exp-h">
        <p className="v8-pricing-expect-eyebrow">Honest expectations</p>
        <h2 id="exp-h">Good SEO takes at least a month to show up.</h2>
        <p className="v8-pricing-expect-lede">
          Google needs time to notice your changes and decide what they&apos;re worth. Here&apos;s what your first months
          really look like:
        </p>
        <ol className="v8-pricing-timeline">
          {TIMELINE.map((t) => (
            <li key={t.when}>
              <span style={{ color: t.color }}>{t.when}</span>
              <strong>{t.title}</strong>
              <span>{t.body}</span>
            </li>
          ))}
        </ol>
        <div className="v8-pricing-card-why">
          <div>
            <strong>Why we ask for a card on the free month</strong>
            <p>
              Every scan, every fix and every report runs on live search data and AI that we pay for from day one.
              We&apos;re glad to cover your first month, because we&apos;d rather earn your trust than ask for it. And
              since we&apos;re early, you get something bigger companies can&apos;t offer: the people who built Searchify,
              reading every message and genuinely invested in your results.
            </p>
          </div>
          <span>
            We&apos;ll email you 3 days before your free month ends, with your before-and-after report. Cancel in two
            clicks and you pay nothing.
          </span>
        </div>
      </section>

      <section className="v8-wrap v8-pricing-panel" aria-label="Your order">
        <h2>Your order</h2>
        <div className="v8-pricing-row">
          <span>
            {chosen?.name} · {chosen?.sites}
          </span>
          <span className="mono">{orderPrice}</span>
        </div>
        <div className="v8-pricing-row muted">
          <span>{orderTrial}</span>
          <span>{orderBilled}</span>
        </div>
        {chosen?.founding ? (
          <p className="v8-pricing-lock">Early launch price locked in for as long as you stay subscribed.</p>
        ) : null}
        <hr />
        <V8Field
          label="Work email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@business.com"
          autoComplete="email"
        />
        {err ? (
          <p role="alert" style={{ margin: 0, color: "#FF8A80", fontSize: 14 }}>
            {err}
          </p>
        ) : null}
        {msg ? (
          <p role="status" style={{ margin: 0, color: "#3DDC84", fontSize: 14 }}>
            {msg}
          </p>
        ) : null}
        <V8Button type="button" variant="primary" className="v8-pricing-full" disabled={busy || alreadyOn} onClick={checkout}>
          {busy
            ? chosen?.freeMonth
              ? "Starting free month…"
              : "Starting…"
            : alreadyOn
              ? "You're on this plan"
              : embedded
                ? `Switch to ${chosen?.name}`
                : "Continue to secure checkout"}
        </V8Button>
        <span className="v8-pricing-fine">{orderFoot}</span>
      </section>

      <section className="v8-wrap v8-pricing-faq" aria-label="Questions">
        <h2 className="v8-pricing-caveat v8-pricing-faq-title">Common questions</h2>
        <div className="v8-pricing-faq-list">
          {FAQ.map((item, i) => {
            const open = openFaq === i;
            return (
              <div key={item.q} className="v8-pricing-faq-item">
                <h3>
                  <button type="button" aria-expanded={open} onClick={() => setOpenFaq(open ? -1 : i)}>
                    <span>{item.q}</span>
                    <span className={`v8-pricing-faq-icon${open ? " is-open" : ""}`} aria-hidden="true">
                      +
                    </span>
                  </button>
                </h3>
                {open ? <p>{item.a}</p> : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
