"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SearchifyMarkSvg from "@/components/v8/SearchifyMarkSvg";
import FounderSignature from "@/components/v8/FounderSignature";
import SearchifyLoader from "@/components/v8/SearchifyLoader";
import { getPartnerMe, partnerInitials, partnerSignAgreement } from "@/lib/partnerApi";
import { isPartnerAuthenticated } from "@/lib/authRoles";
import "@/styles/v8-affiliate.css";

const STEPS = ["1 · Welcome", "2 · The rules", "3 · Sign the agreement", "4 · Your link"];

const DOS = [
  "Say clearly that you earn a commission, every time you share your link.",
  "Describe Searchify accurately: what it does, and what it costs.",
  "Follow anti-spam laws: only email people who agreed to hear from you.",
  "Use the logos and screenshots from the partner kit once your dashboard unlocks.",
];

const DONTS = [
  'Bid on "Searchify" or similar words in Google or Bing ads.',
  "Pretend to be Searchify, or make promises we don’t make (like guaranteed rankings).",
  "Sign up yourself, your own businesses or family through your link.",
];

const TERMS = [
  ["Your rate", "25% of every payment on Solo, Pro and Agency (20% on Managed SEO)"],
  ["How long", "Each customer’s first 12 months"],
  ["Link tracking", "60 days after a click"],
  ["When it clears", "30 days after each payment"],
  ["When you’re paid", "Monthly on the 15th, once over $50"],
  ["Ending it", "Either side, with 30 days’ notice"],
];

export default function PartnerWelcome() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signedName, setSignedName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isPartnerAuthenticated()) {
      router.replace("/partners/login");
      return;
    }
    let cancel = false;
    getPartnerMe()
      .then((res) => {
        if (cancel) return;
        if (!res.ok) {
          router.replace("/partners/login");
          return;
        }
        setMe(res.data);
        setReferralLink(res.data?.referralLink || "");
        setSignedName(res.data?.profile?.displayName || "");
        if (res.data?.agreementSigned && !res.data?.needsAgreement) {
          // Already signed — allow revisiting step 4 with their link.
          setStep(3);
          setAcceptedRules(true);
          setAcceptedTerms(true);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancel) router.replace("/partners/login");
      });
    return () => {
      cancel = true;
    };
  }, [router]);

  const first = useMemo(() => {
    const name = me?.profile?.displayName || me?.username || "there";
    return String(name).trim().split(/\s+/)[0] || "there";
  }, [me]);

  const initials = partnerInitials(me?.profile?.displayName || me?.username || "AF");

  const sign = async () => {
    setBusy(true);
    setErr("");
    const res = await partnerSignAgreement({
      signedName: signedName.trim(),
      acceptedRules,
      acceptedTerms,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(typeof res.data?.detail === "string" ? res.data.detail : "Could not save your signature.");
      return;
    }
    if (res.data?.referralLink) setReferralLink(res.data.referralLink);
    setStep(3);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return <SearchifyLoader full label="Opening affiliate welcome" />;
  }

  return (
    <div className="v8-aff" style={{ gap: 26 }}>
      <header className="v8-aff-head" style={{ maxWidth: 1080, justifyContent: "flex-start" }}>
        <span className="v8-aff-brand" style={{ marginRight: "auto" }}>
          <SearchifyMarkSvg size={30} />
          <strong>searchify</strong>
          <span className="v8-aff-chip">AFFILIATE CENTRE</span>
        </span>
        <span className="v8-aff-me">
          <span className="v8-aff-avatar">{initials}</span>
          <span style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{me?.profile?.displayName || me?.username}</span>
            <span style={{ fontSize: 12, color: "#9AA1AB" }}>New affiliate</span>
          </span>
        </span>
      </header>

      <nav className="v8-aff-nav" aria-label="Affiliate centre">
        <span className="is-lock" aria-disabled="true">
          <LockIcon /> Overview
        </span>
        <span className="is-lock" aria-disabled="true">
          <LockIcon /> Earnings
        </span>
        <span className="is-lock" aria-disabled="true">
          <LockIcon /> Payout and tax
        </span>
        <span className="is-on">Agreement and rules</span>
        <span style={{ fontSize: 12, color: "#7D848E", paddingLeft: 6 }}>The rest unlocks once you sign.</span>
      </nav>

      <ol className="v8-aff-progress" aria-label="Getting started">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? "is-on" : i < step ? "is-done" : ""} aria-current={i === step ? "step" : "false"}>
            <i />
            <span>{label}</span>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <>
          <section className="v8-aff-letter" aria-labelledby="w-h">
            <h1 id="w-h">Welcome aboard, {first}.</h1>
            <p>
              Thanks for joining the Searchify affiliate program. We help business owners get found on Google and named
              in AI answers like ChatGPT, and now you’re part of how people hear about it.
            </p>
            <p>
              Before your dashboard opens, there are three quick things: a short list of do’s and don’ts that keep this
              fair for everyone, the agreement to sign, and then your link. It takes about two minutes.
            </p>
            <p>We’re glad to have you here.</p>
            <FounderSignature />
          </section>
          <div className="v8-aff-actions">
            <button type="button" className="v8-aff-cta" onClick={() => setStep(1)}>
              Let’s go
            </button>
          </div>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <section className="v8-aff-panel" aria-labelledby="rules-h">
            <h2 id="rules-h">The rules that keep this fair</h2>
            <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>
              Short version: be honest, disclose your commission, and don’t game the program.
            </span>
            <strong style={{ fontSize: 15, color: "#3DDC84" }}>Do</strong>
            <ul className="v8-aff-list">
              {DOS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <strong style={{ fontSize: 15, color: "#FFC53D" }}>Don’t</strong>
            <ul className="v8-aff-list">
              {DONTS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <label className="v8-aff-check">
              <input type="checkbox" checked={acceptedRules} onChange={(e) => setAcceptedRules(e.target.checked)} />
              <span>I’ve read the rules and I’ll follow them when I share Searchify.</span>
            </label>
          </section>
          <div className="v8-aff-actions">
            <button type="button" className="v8-aff-ghost" onClick={() => setStep(0)}>
              Back
            </button>
            <button type="button" className="v8-aff-cta" disabled={!acceptedRules} onClick={() => setStep(2)}>
              Continue to the agreement
            </button>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <section className="v8-aff-panel" aria-labelledby="ag-h">
            <h2 id="ag-h">Affiliate Program Terms</h2>
            <span style={{ fontSize: 13, color: "#9AA1AB" }}>Version 1.2 · Alberta law · Sign to unlock your link</span>
            <ul className="v8-aff-list">
              {TERMS.map(([label, value]) => (
                <li key={label}>
                  <strong>{label}</strong>
                  {value}
                </li>
              ))}
            </ul>
            <label className="v8-aff-field">
              Type your full name to sign
              <input type="text" value={signedName} onChange={(e) => setSignedName(e.target.value)} autoComplete="name" />
            </label>
            <label className="v8-aff-check">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
              <span>
                I agree to the <Link href="/partners/terms">Affiliate Program Terms</Link> and the rules above.
              </span>
            </label>
            {err ? (
              <p className="v8-aff-err" role="alert">
                {err}
              </p>
            ) : null}
          </section>
          <div className="v8-aff-actions">
            <button type="button" className="v8-aff-ghost" onClick={() => setStep(1)}>
              Back
            </button>
            <button
              type="button"
              className="v8-aff-cta"
              disabled={!acceptedRules || !acceptedTerms || signedName.trim().length < 2 || busy}
              onClick={sign}
            >
              {busy ? "Signing…" : "Sign and unlock my link"}
            </button>
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <section className="v8-aff-panel" aria-labelledby="link-h">
            <h2 id="link-h">Your referral link is ready</h2>
            <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>
              Share it with agencies and site owners. Say you earn a commission. Tracking lasts 60 days after a click.
            </span>
            <div className="v8-aff-linkbox">
              <code>{referralLink || "Loading…"}</code>
              <button type="button" className="v8-aff-cta" onClick={copyLink} disabled={!referralLink}>
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
            <span style={{ fontSize: 13, color: "#7D848E", lineHeight: 1.5 }}>
              Overview, earnings and payout unlock next. You can revisit the agreement anytime under Agreement and rules.
            </span>
          </section>
          <div className="v8-aff-actions">
            <button type="button" className="v8-aff-cta" onClick={() => router.push("/partners")}>
              Open the affiliate centre
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
