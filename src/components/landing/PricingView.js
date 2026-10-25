"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SearchifyMark from "@/components/landing/SearchifyMark";
import { V8Button, V8Field, V8Segmented } from "@/components/v8/primitives";
import { getBillingAccount, getBillingCatalog, requestEnterpriseQuote, startCheckout } from "@/lib/billingApi";
import { SkeletonCards } from "@/components/v8/SkeletonWave";
import { PLAN_ALIAS, choosePlan, hydrateJourney, syncJourneyNow } from "@/lib/journey";
import { getUser, userIsAuthenticated } from "@/utils/users/Helpers";
import "@/styles/v8-kit.css";
import "@/styles/v8-pricing.css";

const FALLBACK = [
  {
    id: "solo",
    name: "Solo",
    tag: "ONE BUSINESS",
    sites: "1 website",
    mo: 29,
    features: [
      "Search Console + WordPress",
      "Colour-coded task board",
      "One move at a time, with results",
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
    features: [
      "Everything in Solo",
      "Calls and leads from Analytics",
      "5 branded reports per site, per month",
      "1 scheduled client send + 3 client logins per site",
      "AI answer tracking and autopilot within limits",
      "8 site scans, 40 keyword checks (50 tracked), and 20 backlink checks a month",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tag: "BEST FOR AGENCIES",
    sites: "Up to 25 websites",
    mo: 399,
    features: [
      "Everything in Pro",
      "Unlimited white-label reports, no Searchify name",
      "Unlimited scheduled sends and client logins",
      "Social channels via Postiz",
      "All-clients view and team seats",
      "30 site scans, 150 keyword checks (200 tracked), and 60 backlink checks a month",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tag: "LARGE PORTFOLIOS",
    sites: "25+ websites",
    mo: 0,
    features: [
      "Everything in Premium",
      "Custom site and report limits",
      "Single sign-on and audit log",
      "Dedicated success manager",
      "API access and custom contract",
    ],
  },
];

function money(n) {
  return `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

function userEmail() {
  const u = getUser();
  return String(u?.result?.email || u?.data?.email || u?.result?.username || "").trim();
}

export default function PricingView({ embedded = false }) {
  const router = useRouter();
  const [period, setPeriod] = useState("month");
  const [pick, setPick] = useState("premium");
  const [defs, setDefs] = useState(FALLBACK);
  const [live, setLive] = useState(false);
  const [account, setAccount] = useState(null);
  const [entSent, setEntSent] = useState(false);
  const [email, setEmail] = useState("");
  const [sites, setSites] = useState("60");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const yearly = period === "year";

  useEffect(() => {
    const mail = userEmail();
    if (mail && mail.includes("@")) setEmail(mail);
    getBillingCatalog().then((res) => {
      if (res.ok && Array.isArray(res.data?.plans) && res.data.plans.length) {
        setDefs(
          res.data.plans.map((p) => ({
            id: p.id,
            name: p.name,
            tag: p.tag,
            sites: p.sites,
            mo: Number(p.mo) || 0,
            features: Array.isArray(p.features) ? p.features : [],
          })),
        );
        setLive(Boolean(res.data.live));
      } else {
        setLive(true);
      }
    }).catch(() => setLive(true));
    if (!userIsAuthenticated()) return;
    getBillingAccount().then((res) => {
      if (!res.ok || !res.data?.planId) return;
      setAccount(res.data);
      setPick(res.data.planId);
      if (res.data.billing === "annual") setPeriod("year");
      if (res.data.email && String(res.data.email).includes("@")) setEmail(res.data.email);
    });
  }, []);

  const plans = useMemo(
    () =>
      defs.map((d) => {
        const on = d.id === pick;
        const ent = d.id === "enterprise";
        const perMo = yearly && d.mo ? Math.round(((d.mo * 10) / 12) * 100) / 100 : d.mo;
        return {
          ...d,
          on,
          ent,
          price: ent ? "Contact us" : money(perMo),
          per: ent ? "" : "USD/mo",
          note: ent ? "Custom quote for your portfolio" : yearly ? `${money(d.mo * 10)} USD billed yearly` : "Billed monthly",
          noteGreen: !ent && yearly,
        };
      }),
    [defs, pick, yearly],
  );

  const chosen = defs.find((d) => d.id === pick) || defs[2] || FALLBACK[2];
  const isEnt = pick === "enterprise";
  const isPaid = !isEnt;

  const checkout = async () => {
    setErr("");
    setMsg("");
    const mail = email.trim();
    if (!mail.includes("@")) {
      setErr("Enter a work email to continue.");
      return;
    }
    if (!userIsAuthenticated()) {
      const q = new URLSearchParams({
        plan: pick,
        billing: yearly ? "annual" : "monthly",
        email: mail,
        next: "/pricing",
      });
      router.push(`/signup?${q}`);
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
    setMsg(res.data?.detail || "Trial started.");
    const fresh = await getBillingAccount();
    if (fresh.ok && fresh.data?.planId) {
      setAccount(fresh.data);
      setPick(fresh.data.planId);
    }
    if (embedded) return;
    router.push(res.data?.next || path || "/app/connections");
  };

  const sendQuote = async () => {
    setErr("");
    setMsg("");
    const mail = email.trim();
    if (!mail.includes("@")) {
      setErr("Enter a work email for the quote.");
      return;
    }
    setBusy(true);
    const res = await requestEnterpriseQuote({ email: mail, sites: sites.trim() || "60" });
    setBusy(false);
    if (!res.ok) {
      setErr(res.data?.detail || "Could not send the request.");
      return;
    }
    setEntSent(true);
    setMsg(res.data?.detail || "Request sent.");
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
                {account.status === "trial" ? " · 14-day trial" : ""}
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
        <Link href={embedded ? "/app/settings" : userIsAuthenticated() ? "/app" : "/login"} className="v8-pricing-back">
          {embedded ? "Settings" : userIsAuthenticated() ? "Back to app" : "Sign in"}
        </Link>
      </header>

      <div className="v8-wrap v8-pricing-hero">
        <h1 className="v8-h1">Pay for sites, not seats.</h1>
        <p className="v8-lede">
          Every plan includes the scan, the colour-coded board, approvals, live checks and one-click undo.
        </p>
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

      <div className="v8-wrap v8-pricing-grid">
        {!live ? <div style={{ gridColumn: "1 / -1" }}><SkeletonCards count={4} lines={5} /></div> : plans.map((pl) => (
          <article key={pl.id} className={`v8-card${pl.on ? " is-on" : ""}`}>
            <div className="v8-pricing-card-top">
              <h2>{pl.name}</h2>
              <span className="v8-pricing-tag">{account?.planId === pl.id ? "YOUR PLAN" : pl.tag}</span>
            </div>
            <div className="v8-pricing-price">
              <span className={pl.ent ? "is-ent" : undefined}>{pl.price}</span>
              {pl.per ? <small>{pl.per}</small> : null}
            </div>
            <span className={`v8-pricing-note${pl.noteGreen ? " is-green" : ""}`}>{pl.note}</span>
            <span className="v8-pricing-sites">{pl.sites}</span>
            <ul className="v8-pricing-feats">
              {pl.features.map((f) => (
                <li key={f}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D5F879" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`v8-pricing-cta${pl.on ? " is-on" : ""}`}
              onClick={() => {
                setPick(pl.id);
                setEntSent(false);
                setErr("");
                setMsg("");
              }}
            >
              {pl.on && account?.planId === pl.id ? "Current plan" : pl.on ? "Selected" : pl.ent ? "Contact for a quote" : `Choose ${pl.name}`}
            </button>
          </article>
        ))}
      </div>

      {isPaid ? (
        <section className="v8-wrap v8-pricing-panel" aria-label="Checkout">
          <h2>Your order</h2>
          <div className="v8-pricing-row">
            <span>
              {chosen.name} · {chosen.sites}
            </span>
            <span className="mono">
              {yearly ? `${money(chosen.mo * 10)} USD / year` : `${money(chosen.mo)} USD / month`}
            </span>
          </div>
          <div className="v8-pricing-row muted">
            <span>14-day free trial</span>
            <span>Billed after the trial ends</span>
          </div>
          <hr />
          <V8Field
            label="Work email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@agency.com"
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
          <V8Button
            type="button"
            variant="primary"
            className="v8-pricing-full"
            disabled={busy || (embedded && account?.planId === chosen.id && (yearly ? account.billing === "annual" : account.billing !== "annual"))}
            onClick={checkout}
          >
            {busy
              ? "Starting trial…"
              : embedded && account?.planId === chosen.id && (yearly ? account.billing === "annual" : account.billing !== "annual")
                ? "You're on this plan"
                : embedded
                  ? `Switch to ${chosen.name}`
                  : "Continue to secure checkout"}
          </V8Button>
          <span className="v8-pricing-fine">
            {userIsAuthenticated()
              ? "Starts a 14-day trial on your account. Card checkout connects when Stripe is enabled — cancel any time from Settings."
              : "Create an account next, then we start your 14-day trial. Cancel any time from Settings."}
          </span>
        </section>
      ) : null}

      {isEnt ? (
        <section className="v8-wrap v8-pricing-panel" aria-label="Contact sales">
          <h2>Get an Enterprise quote</h2>
          <p className="v8-lede" style={{ maxWidth: "none" }}>
            Tell us how many sites you manage. We&apos;ll reply within one business day with a quote built around your
            portfolio.
          </p>
          <div className="v8-pricing-ent-grid">
            <V8Field label="Work email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <V8Field label="Number of websites" type="text" value={sites} onChange={(e) => setSites(e.target.value)} />
          </div>
          {err ? (
            <p role="alert" style={{ margin: 0, color: "#FF8A80", fontSize: 14 }}>
              {err}
            </p>
          ) : null}
          {entSent ? (
            <span className="v8-pricing-sent">Request sent · we&apos;ll be in touch within one business day</span>
          ) : (
            <V8Button type="button" variant="primary" className="v8-pricing-full" disabled={busy} onClick={sendQuote}>
              {busy ? "Sending…" : "Request a quote"}
            </V8Button>
          )}
        </section>
      ) : null}
    </div>
  );
}
