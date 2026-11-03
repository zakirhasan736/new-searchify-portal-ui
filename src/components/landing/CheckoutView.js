"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SearchifyMark from "@/components/landing/SearchifyMark";
import { passwordIssues } from "@/components/v8/AuthScreen";
import { startCheckout } from "@/lib/billingApi";
import { PARTNER_KEY, PREVIEW_KEY, clearSessionFlag } from "@/lib/authRoles";
import { readReferral } from "@/lib/referral";
import {
  hydrateJourney,
  markSelectedPlan,
  normalizeSiteUrl,
  seedDraftSite,
  stashPendingSite,
  syncJourneyNow,
} from "@/lib/journey";
import { fetchProjectByUserId } from "@/utils/users/ProjectUtil";
import { getUser, parseJwt, userIsAuthenticated, userLogin } from "@/utils/users/Helpers";
import "@/styles/v8-kit.css";
import "@/styles/v8-checkout.css";

const HEAR = [
  "A friend or colleague",
  "Google search",
  "An AI assistant",
  "YouTube or TikTok",
  "Somewhere else",
];

const COUNTRIES = [
  { id: "CA", label: "Canada", tax: 0.05, taxLabel: "GST (5%)" },
  { id: "US", label: "United States", tax: 0, taxLabel: "Sales tax" },
  { id: "GB", label: "United Kingdom", tax: 0.2, taxLabel: "VAT (20%)" },
  { id: "AU", label: "Australia", tax: 0.1, taxLabel: "GST (10%)" },
  { id: "OTHER", label: "Another country", tax: 0, taxLabel: "Tax" },
];

const REGIONS = {
  CA: ["Alberta", "British Columbia", "Ontario", "Other"],
  US: ["California", "New York", "Texas", "Other"],
  GB: ["England", "Scotland", "Wales", "Northern Ireland"],
  AU: ["New South Wales", "Victoria", "Queensland", "Other"],
  OTHER: ["Other"],
};

const REV = ["Under $100k", "$100k–$500k", "$500k–$1M", "$1M–$5M", "Over $5M", "Prefer not to say"];
const ADS = ["Google Ads", "Meta (Facebook, Instagram)", "TikTok", "Microsoft / Bing", "LinkedIn", "No paid ads", "Prefer not to say"];
const SPEND = ["Under $500", "$500–$2,000", "$2,000–$10,000", "Over $10,000", "Prefer not to say"];

const SURVEY_KEY = "searchify-checkout-survey";

function money(n) {
  return `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizePlan(raw) {
  const id = String(raw || "solo").trim().toLowerCase();
  if (id === "premium" || id === "agency" || id === "scale") return "agency";
  if (id === "growth" || id === "pro") return "pro";
  if (id === "starter" || id === "solo") return "solo";
  return "solo";
}

function apiPlanId(uiId) {
  return uiId === "agency" ? "premium" : uiId;
}

function userEmail() {
  const u = getUser();
  return String(u?.result?.email || u?.data?.email || u?.result?.username || u?.data?.username || "").trim();
}

function userName() {
  const u = getUser();
  return String(u?.result?.username || u?.data?.username || "").trim();
}

function Tip({ id, openId, setOpenId, label, align = "left", children }) {
  const open = openId === id;
  return (
    <span className="v8-checkout-tip">
      <button
        type="button"
        className="v8-checkout-tip-btn"
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
      {open ? (
        <span className={`v8-checkout-tip-pop is-${align}`}>
          <span className="v8-checkout-tip-card">{children}</span>
        </span>
      ) : null}
    </span>
  );
}

export default function CheckoutView() {
  const router = useRouter();
  const params = useSearchParams();
  const authed = userIsAuthenticated();

  const [plan, setPlan] = useState(() => normalizePlan(params.get("plan")));
  const [yearly, setYearly] = useState(() => {
    const b = String(params.get("billing") || "monthly").toLowerCase();
    return b === "annual" || b === "year" || b === "yearly";
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState(() => String(params.get("email") || "").trim());
  const [password, setPassword] = useState("");
  const [business, setBusiness] = useState("");
  const [website, setWebsite] = useState(() => String(params.get("site") || "").trim());
  const [hear, setHear] = useState(HEAR[0]);
  const [country, setCountry] = useState("CA");
  const [region, setRegion] = useState("Alberta");
  const [taxId, setTaxId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [postal, setPostal] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [tip, setTip] = useState(null);
  const [googleOn, setGoogleOn] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [wpHint, setWpHint] = useState(false);

  const [rev, setRev] = useState(null);
  const [ads, setAds] = useState({});
  const [spend, setSpend] = useState(null);
  const [survey, setSurvey] = useState("open");

  useEffect(() => {
    setPlan(normalizePlan(params.get("plan")));
    const b = String(params.get("billing") || "monthly").toLowerCase();
    setYearly(b === "annual" || b === "year" || b === "yearly");
    const mailParam = String(params.get("email") || "").trim();
    if (mailParam.includes("@")) setEmail(mailParam);
    const mail = userEmail();
    if (mail && mail.includes("@")) setEmail(mail);
    const uname = userName();
    if (uname && !name) setName(uname);
    const site = normalizeSiteUrl(params.get("site") || "");
    if (site) {
      setWebsite(site.replace(/^https?:\/\//i, ""));
      stashPendingSite(site);
      setWpHint(true);
    }
    fetch("/api/v1/auth/oauth/providers")
      .then((r) => r.json())
      .then((d) => setGoogleOn(Boolean(d?.google)))
      .catch(() => setGoogleOn(false));
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const from = String(params.get("from") || "").toLowerCase();
  const backHref = from === "billing" ? "/app/billing" : from === "plans" ? "/app/plans" : "/pricing";
  const backLabel = from === "billing" || from === "plans" ? "Back to plans" : "Back to pricing";

  useEffect(() => {
    const regions = REGIONS[country] || REGIONS.OTHER;
    if (!regions.includes(region)) setRegion(regions[0]);
  }, [country, region]);

  const catalog = useMemo(() => {
    const after = (mo) => (yearly ? mo * 10 : mo);
    return {
      solo: { name: "Solo", sub: "1 website", after: after(49), today: 0, free: true },
      pro: { name: "Pro", sub: "Up to 5 websites · launch price", after: after(79), today: after(79), free: false },
      agency: { name: "Agency", sub: "Up to 25 websites", after: after(399), today: after(399), free: false },
    };
  }, [yearly]);

  const chosen = catalog[plan] || catalog.solo;
  const countryMeta = COUNTRIES.find((c) => c.id === country) || COUNTRIES[0];
  const taxRate = countryMeta.tax;
  const tax = chosen.today * taxRate;
  const dueToday = chosen.today + tax;
  const per = yearly ? "a year" : "a month";

  const lines = chosen.free
    ? [
        { label: "Solo · first month", value: "Free", color: "#3DDC84" },
        { label: "From day 31", value: `${money(chosen.after)}${yearly ? " / yr" : " / mo"}`, color: "#F2F4F5" },
        { label: `${countryMeta.taxLabel} · ${region}`, value: money(0), color: "#9AA1AB" },
      ]
    : [
        { label: `${chosen.name}${yearly ? " · yearly" : " · monthly"}`, value: money(chosen.today), color: "#F2F4F5" },
        { label: `${countryMeta.taxLabel} · ${region}`, value: money(tax), color: "#9AA1AB" },
      ];

  const headline = chosen.free ? "Start your free month of Solo." : `Start Searchify ${chosen.name}.`;
  const renewLine = chosen.free
    ? `that after my free month, Solo renews at ${money(chosen.after)} ${per} until I cancel.`
    : `that ${chosen.name} renews at ${money(chosen.after)} ${per} until I cancel.`;
  const afterLine = chosen.free
    ? `Then ${money(chosen.after)} ${per} plus tax, starting on day 31. We email you 3 days before.`
    : `Renews at ${money(chosen.after)} ${per} plus tax. Cancel any time.`;
  const cta = chosen.free ? "Start my free month" : `Pay ${money(dueToday)} and start`;
  const freeMonthText = `Your first month on Solo is free. Results take about a month to show, so this gives you time to see them. After that it’s ${
    yearly ? "$490 a year" : "$49 a month"
  }, and you can cancel any time before then.`;

  const runsAds = Object.keys(ads).some((k) => ads[k] && k !== "No paid ads" && k !== "Prefer not to say");

  const openWorkspace = async (result) => {
    const data = parseJwt(result.token);
    clearSessionFlag(PARTNER_KEY);
    clearSessionFlag(PREVIEW_KEY);
    userLogin({ data, result });
    try {
      const resProject = await fetchProjectByUserId(data.sub);
      const resultProject = await resProject.json().catch(() => ({}));
      localStorage.setItem("project", JSON.stringify(resultProject));
    } catch {
      localStorage.setItem("project", "{}");
    }
    const site = normalizeSiteUrl(website) || normalizeSiteUrl(params.get("site") || "");
    if (site) {
      stashPendingSite(site);
      seedDraftSite(site);
    }
  };

  const ensureAccount = async () => {
    if (userIsAuthenticated()) return { ok: true };
    const mail = email.trim();
    if (!mail.includes("@")) return { ok: false, detail: "Enter a work email." };
    if (!name.trim()) return { ok: false, detail: "Enter your full name." };
    const pwdError = passwordIssues(password);
    if (pwdError) return { ok: false, detail: pwdError };
    const username = name.trim().replace(/\s+/g, "").slice(0, 32) || mail.split("@")[0];
    const res = await fetch("/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
        email: mail,
        roles: ["ROLE_CLIENT"],
        ref: readReferral(),
      }),
    });
    const created = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = created.detail;
      return {
        ok: false,
        detail: typeof detail === "string" ? detail : detail?.message || "Could not create that account.",
      };
    }
    let result = created;
    if (!result.token) {
      const signin = await fetch("/api/v1/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: mail, password }),
      });
      result = await signin.json().catch(() => ({}));
      if (!signin.ok || !result.token) {
        return { ok: false, detail: "Account created — sign in, then return to finish checkout." };
      }
    }
    await openWorkspace({
      token: result.token,
      userType: result.userType || "client",
      username: result.username || username,
    });
    return { ok: true };
  };

  const startGoogle = async () => {
    setErr("");
    setGoogleBusy(true);
    try {
      const q = new URLSearchParams({
        plan,
        billing: yearly ? "annual" : "monthly",
        email: email.trim(),
        site: website.trim(),
      });
      try {
        sessionStorage.setItem("searchify-checkout-return", `/checkout?${q}`);
      } catch {
        /* ignore */
      }
      const response = await fetch("/api/v1/auth/oauth/google/start");
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.authUrl) {
        setErr(data.detail || "Google sign-in is not configured yet.");
        setGoogleBusy(false);
        return;
      }
      window.location.href = data.authUrl;
    } catch {
      setErr("Could not start Google sign-in.");
      setGoogleBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!agreed) {
      setErr("Agree to the Terms and Privacy Policy to continue.");
      return;
    }
    if (!business.trim()) {
      setErr("Enter your business name.");
      return;
    }
    if (!website.trim()) {
      setErr("Enter your website.");
      return;
    }
    // Card fields are UI-only until Stripe is wired — never send card data.
    setBusy(true);
    const account = await ensureAccount();
    if (!account.ok) {
      setBusy(false);
      setErr(account.detail || "Could not create your account.");
      return;
    }
    await hydrateJourney({ force: true });
    const site = normalizeSiteUrl(website);
    if (site) {
      stashPendingSite(site);
      seedDraftSite(site);
    }
    const res = await startCheckout({
      planId: apiPlanId(plan),
      billing: yearly ? "annual" : "monthly",
      email: email.trim(),
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.data?.detail || "Could not start your plan. Try again.");
      return;
    }
    // Persist planId locally before sync so we don't push null and wipe the server journey.
    markSelectedPlan(res.data?.canonical || apiPlanId(plan), yearly ? "annual" : "monthly");
    await syncJourneyNow();
    try {
      localStorage.setItem(
        "searchify-checkout-profile",
        JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          business: business.trim(),
          website: website.trim(),
          hear,
          country,
          region,
          taxId: taxId.trim(),
          plan: apiPlanId(plan),
          billing: yearly ? "annual" : "monthly",
          at: Date.now(),
        }),
      );
    } catch {
      /* ignore */
    }
    setDone(true);
  };

  const toggleAd = (label) => {
    const exclusive = label === "No paid ads" || label === "Prefer not to say";
    setAds((prev) => {
      if (exclusive) return prev[label] ? {} : { [label]: true };
      return { ...prev, [label]: !prev[label], "No paid ads": false, "Prefer not to say": false };
    });
    if (exclusive) setSpend(null);
  };

  const saveSurvey = (mode) => {
    const payload = {
      revenue: rev,
      ads: Object.keys(ads).filter((k) => ads[k]),
      spend: runsAds ? spend : null,
      status: mode,
      at: Date.now(),
    };
    try {
      localStorage.setItem(SURVEY_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
    setSurvey(mode);
  };

  if (done) {
    const first = (name.trim().split(/\s+/)[0] || "there").replace(/[^\p{L}\p{N}'-]/gu, "") || "there";
    return (
      <div className="v8-checkout">
        <header className="v8-checkout-head">
          <Link href="/" className="v8-brand">
            <SearchifyMark size={28} />
            <span>searchify</span>
          </Link>
          <span className="v8-checkout-secure">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Secure checkout · payments by Stripe
          </span>
        </header>

        <section className="v8-checkout-done" role="status">
          <span className="v8-checkout-done-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24">
              <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#3DDC84" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="v8-checkout-done-eyebrow">Welcome aboard, {first}.</span>
          <h1>{chosen.free ? "Your free month has started." : `You’re on ${chosen.name}.`}</h1>
          <p className="v8-checkout-done-body">
            {chosen.free
              ? "Nothing is charged today. We’ll check in on day 27 with your report."
              : "Your plan is active. Card charging connects when Stripe is enabled."}{" "}
            A receipt is on its way to {email.trim() || "your inbox"}.
          </p>

          {survey === "open" ? (
            <div className="v8-checkout-survey">
              <div>
                <h2>Help us tailor your first fixes</h2>
                <p>
                  Optional, and about 20 seconds. It helps us focus on what matters for a business your size, and spot
                  where better search results could take pressure off your ad budget. We never share it.
                </p>
              </div>
              <fieldset>
                <legend>Roughly what&apos;s your annual revenue?</legend>
                <div className="v8-checkout-chips" role="radiogroup" aria-label="Annual revenue">
                  {REV.map((r) => (
                    <button key={r} type="button" role="radio" aria-checked={rev === r} className={`v8-checkout-chip${rev === r ? " is-on" : ""}`} onClick={() => setRev(r)}>
                      {r}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>
                  Do you run paid ads anywhere? <span style={{ fontWeight: 400, color: "#9AA1AB" }}>Tick all that apply.</span>
                </legend>
                <div className="v8-checkout-chips">
                  {ADS.map((a) => (
                    <button key={a} type="button" role="checkbox" aria-checked={Boolean(ads[a])} className={`v8-checkout-chip${ads[a] ? " is-on" : ""}`} onClick={() => toggleAd(a)}>
                      {a}
                    </button>
                  ))}
                </div>
              </fieldset>
              {runsAds ? (
                <fieldset>
                  <legend>About how much do you spend on ads a month?</legend>
                  <div className="v8-checkout-chips" role="radiogroup" aria-label="Monthly ad spend">
                    {SPEND.map((s) => (
                      <button key={s} type="button" role="radio" aria-checked={spend === s} className={`v8-checkout-chip${spend === s ? " is-on" : ""}`} onClick={() => setSpend(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ) : null}
              <div className="v8-checkout-survey-actions">
                <button type="button" className="v8-checkout-survey-save" onClick={() => saveSurvey("saved")}>
                  Save
                </button>
                <button type="button" className="v8-checkout-survey-skip" onClick={() => saveSurvey("skipped")}>
                  Skip for now
                </button>
              </div>
            </div>
          ) : (
            <span className="v8-checkout-survey-note">
              {survey === "saved" ? "Thanks, saved. You can change this any time in Settings." : "No problem. You can add this later in Settings."}
            </span>
          )}

          <Link href="/app/connections" className="v8-checkout-next">
            Plug in your website
          </Link>
          <span className="v8-checkout-next-hint">Next: connect WordPress and Google. It takes about a minute.</span>
        </section>
      </div>
    );
  }

  return (
    <div className="v8-checkout">
      <header className="v8-checkout-head">
        <Link href={backHref} className="v8-brand">
          <SearchifyMark size={28} />
          <span>searchify</span>
        </Link>
        <span className="v8-checkout-secure">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Secure checkout · payments by Stripe
        </span>
      </header>

      <div className="v8-checkout-shell">
        <form className="v8-checkout-form" aria-label="Checkout" onSubmit={submit}>
          <div className="v8-checkout-hero">
            <Link href={backHref} className="v8-checkout-back">
              ← {backLabel}
            </Link>
            <span className="v8-checkout-eyebrow">Almost there.</span>
            <h1>{headline}</h1>
          </div>

          <fieldset className="v8-checkout-card">
            <legend>1 · YOUR ACCOUNT</legend>
            {authed ? (
              <div className="v8-checkout-signed">
                Signed in as <strong>{email || userEmail()}</strong>
              </div>
            ) : (
              <>
                {googleOn ? (
                  <button type="button" className="v8-checkout-google" disabled={googleBusy} onClick={startGoogle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" fill="none" stroke="#9AA1AB" strokeWidth="2" />
                      <path d="M12 12h8" stroke="#9AA1AB" strokeWidth="2" />
                    </svg>
                    {googleBusy ? "Opening Google…" : "Continue with Google"}
                  </button>
                ) : null}
                {googleOn ? <div className="v8-checkout-or">or use your email</div> : null}
                <div className="v8-checkout-grid">
                  <label className="v8-checkout-label">
                    Full name
                    <input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </label>
                  <label className="v8-checkout-label">
                    Work email
                    <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </label>
                </div>
                <label className="v8-checkout-label">
                  Create a password
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 12 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>
              </>
            )}
            {authed ? (
              <label className="v8-checkout-label">
                Work email
                <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
            ) : null}
          </fieldset>

          <fieldset className="v8-checkout-card">
            <legend>2 · YOUR BUSINESS</legend>
            <div className="v8-checkout-grid">
              <label className="v8-checkout-label">
                Business name
                <input type="text" autoComplete="organization" value={business} onChange={(e) => setBusiness(e.target.value)} required />
              </label>
              <label className="v8-checkout-label">
                Website
                <input type="text" inputMode="url" placeholder="yourbusiness.com" value={website} onChange={(e) => setWebsite(e.target.value)} required />
              </label>
            </div>
            {wpHint ? (
              <span className="v8-checkout-wp">
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#3DDC84" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                WordPress detected. Your free analysis is already attached to this account.
              </span>
            ) : null}
            <label className="v8-checkout-label">
              How did you hear about us? (optional)
              <select value={hear} onChange={(e) => setHear(e.target.value)}>
                {HEAR.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          <fieldset className="v8-checkout-card">
            <legend>3 · PAYMENT</legend>
            {chosen.free ? (
              <div className="v8-checkout-free-note">
                <span style={{ flex: 1, minWidth: 0 }}>
                  You won&apos;t be charged today. Your card is only used from day 31, and we&apos;ll email you 3 days
                  before with your before-and-after report.
                </span>
                <Tip id="free" openId={tip} setOpenId={setTip} label="What is the free month?" align="right">
                  <span>{freeMonthText}</span>
                  <a href="https://searchify.io/help/free-month" target="_blank" rel="noreferrer">
                    Learn more
                  </a>
                </Tip>
              </div>
            ) : null}
            <label className="v8-checkout-label">
              Card number
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="1234 1234 1234 1234"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
            </label>
            <div className="v8-checkout-grid-3">
              <label className="v8-checkout-label">
                Expiry
                <input type="text" autoComplete="cc-exp" placeholder="MM / YY" value={cardExp} onChange={(e) => setCardExp(e.target.value)} />
              </label>
              <label className="v8-checkout-label">
                CVC
                <input type="text" inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} />
              </label>
              <label className="v8-checkout-label">
                Postal / ZIP
                <input type="text" autoComplete="postal-code" placeholder="T3B 0A1" value={postal} onChange={(e) => setPostal(e.target.value)} />
              </label>
            </div>
            <div className="v8-checkout-grid">
              <label className="v8-checkout-label">
                Country
                <select value={country} onChange={(e) => setCountry(e.target.value)}>
                  {COUNTRIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="v8-checkout-label">
                Province / state
                <select value={region} onChange={(e) => setRegion(e.target.value)}>
                  {(REGIONS[country] || REGIONS.OTHER).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="v8-checkout-label">
              GST / VAT number (optional, for business tax)
              <input type="text" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
            </label>
            <span className="v8-checkout-stripe-note">
              Card details will go straight to Stripe when payment is connected. Searchify never stores your full card
              number — fields above are placeholders until Stripe is added.
            </span>
          </fieldset>

          <label className="v8-checkout-agree">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              I agree to the <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>,
              and understand {renewLine}
            </span>
          </label>

          {err ? (
            <p className="v8-checkout-err" role="alert">
              {err}
            </p>
          ) : null}

          <button type="submit" className="v8-checkout-submit" disabled={!agreed || busy} style={{ opacity: agreed && !busy ? 1 : 0.45 }}>
            {busy ? "Starting…" : cta}
          </button>
        </form>

        <aside className="v8-checkout-aside" aria-label="Order summary">
          <div className="v8-checkout-summary">
            <span className="v8-checkout-summary-title">
              <h2>Your plan</h2>
              <Tip id="site" openId={tip} setOpenId={setTip} label="What is a site?" align="left">
                <span>A site is one website (one domain, like yourbusiness.com) with all its pages. Solo covers 1 site, Pro up to 5, and Agency up to 25.</span>
                <a href="https://searchify.io/help/sites" target="_blank" rel="noreferrer">
                  Learn more
                </a>
              </Tip>
            </span>

            <div className="v8-checkout-plans" role="radiogroup" aria-label="Plan">
              {(["solo", "pro", "agency"]).map((id) => {
                const p = catalog[id];
                const on = plan === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className={`v8-checkout-plan${on ? " is-on" : ""}`}
                    onClick={() => setPlan(id)}
                  >
                    <span className="v8-checkout-radio" aria-hidden="true">
                      <i />
                    </span>
                    <span className="v8-checkout-plan-copy">
                      <strong>{p.name}</strong>
                      <span>{p.sub}</span>
                    </span>
                    <span className={`v8-checkout-plan-price${p.free ? " is-free" : ""}`}>
                      {p.free ? "Free 1st month" : `$${p.after.toLocaleString("en-US")}${yearly ? "/yr" : "/mo"}`}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="v8-checkout-bill" role="group" aria-label="Billing">
              <button type="button" aria-pressed={!yearly} className={!yearly ? "is-on" : ""} onClick={() => setYearly(false)}>
                Monthly
              </button>
              <button type="button" aria-pressed={yearly} className={yearly ? "is-on" : ""} onClick={() => setYearly(true)}>
                Yearly · 2 months free
              </button>
            </div>

            <div className="v8-checkout-lines">
              {lines.map((l) => (
                <span key={l.label} className="v8-checkout-line">
                  <span>{l.label}</span>
                  <span style={{ color: l.color }}>{l.value}</span>
                </span>
              ))}
              <span className="v8-checkout-due">
                <span>Due today</span>
                <span>{money(dueToday)}</span>
              </span>
              <span className="v8-checkout-after">{afterLine}</span>
            </div>
          </div>

          <div className="v8-checkout-perks">
            <span>✓ Cancel any time from Settings, in two clicks.</span>
            <span>✓ Results take at least a month. Your day-30 report shows what&apos;s moved.</span>
            <span>✓ Every change is approved by you and can be undone.</span>
          </div>
          <span className="v8-checkout-tax-note">
            Prices in USD. Sales tax, GST or VAT is added where required, based on your location.
          </span>
          <button type="button" className="v8-checkout-survey-skip" style={{ alignSelf: "flex-start", paddingLeft: 0 }} onClick={() => router.push("/pricing")}>
            Back to pricing
          </button>
        </aside>
      </div>
    </div>
  );
}
