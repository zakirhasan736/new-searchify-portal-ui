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

const NUMS = [
  ["25%", "on Solo, Pro and Agency", "#D5F879"],
  ["20%", "on Managed SEO", "#F2F4F5"],
  ["12 mo", "per customer you refer", "#F2F4F5"],
  ["60 days", "link tracking after a click", "#F2F4F5"],
  ["30 days", "before a commission clears", "#F2F4F5"],
  ["$50", "minimum payout, on the 15th", "#F2F4F5"],
];

const DOS = [
  "Put “affiliate link” or #ad next to your link where you post it. A tag is all it takes.",
  "Describe Searchify accurately: what it does, and what it costs.",
  "Talk about real outcomes: getting found on Google and named in AI answers.",
  "Follow anti-spam laws: only email people who agreed to hear from you.",
  "Use the logos and screenshots from the marketing kit.",
];

const DONTS = [
  "Bid on “Searchify” or similar words in Google or Bing ads.",
  "Put “Searchify” in your domain, handle or page name so it looks official.",
  "Promise rankings, traffic or income. Nobody can guarantee those.",
  "Post codes on coupon or deal sites unless we gave them to you.",
  "Spam people, in email, comments or DMs.",
  "Sign up yourself, your own businesses or family through your link.",
  "Use any trick that fakes a click or steals a referral.",
];

const TERMS = [
  ["The program", "Aequitas Marketing Corp., operating Searchify (“we”), invites you to refer customers using your personal link. You are an independent affiliate, not our employee, partner or agent, and you can’t make promises or sign anything on our behalf."],
  ["Your commission", "25% of each payment on the Solo, Pro and Agency plans, and 20% on the Managed SEO plan, for each referred customer’s first 12 months. A referral counts when someone signs up within 60 days of clicking your link and isn’t already a customer."],
  ["Clearing and payment", "Commissions clear 30 days after each payment. Refunds, chargebacks and cancellations in that window reverse the commission. Cleared commissions are paid monthly on the 15th once your balance is over $50. You’re responsible for your own taxes and must give us your tax details before your first payout."],
  ["How you may promote Searchify", "Describe it accurately, use our approved logos and screenshots, label your link as an affiliate link where you post it, and follow anti-spam laws: only email people who agreed to hear from you."],
  ["What’s not allowed", "Bidding on “Searchify” or similar words in paid search; using our name in domains, handles or ads that look official; promising rankings, traffic or income; posting codes on coupon or deal sites unless we gave them to you; spam; referring yourself, your own businesses or family; and any trick that fakes or steals a referral."],
  ["Ending the agreement", "Either of us can end it with 30 days’ notice. We can end it right away if section 5 is broken, and unpaid commissions on the affected customers are then forfeited."],
  ["Changes to these terms", "We may update these terms with 30 days’ notice by email. You’ll be asked to accept the new version the next time you sign in."],
  ["General", "Nothing here is exclusive. Our total liability to you is limited to commissions owed. These terms are governed by the laws of Alberta and Canada, and the courts of Alberta decide any dispute."],
];

export default function PartnerWelcome() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedEnd, setAcceptedEnd] = useState(false);
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
          setAcceptedEnd(true);
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
      acceptedTerms: acceptedTerms && acceptedEnd,
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
        {step < 3 ? (
          <>
            <span className="is-lock" aria-disabled="true"><LockIcon /> Overview</span>
            <span className="is-lock" aria-disabled="true"><LockIcon /> Earnings</span>
            <span className="is-lock" aria-disabled="true"><LockIcon /> Payout and tax</span>
            <span className="is-on">Agreement and rules</span>
            <span style={{ fontSize: 12, color: "#7D848E", paddingLeft: 6 }}>The rest unlocks once you sign.</span>
          </>
        ) : (
          <>
            <Link href="/partners">Overview</Link>
            <Link href="/partners/earnings">Earnings</Link>
            <Link href="/partners/payout">Payout and tax</Link>
            <Link href="/partners/terms">Agreement and rules</Link>
          </>
        )}
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
        <section aria-labelledby="r-h" style={{ maxWidth: 1080, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 18, animation: "v8-aff-rise .35s ease both" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--script)", fontSize: "clamp(38px, 4.2vw, 50px)", lineHeight: 1, fontWeight: 700, color: "#D5F879" }}>The ground rules</span>
            <h1 id="r-h" style={{ margin: 0, fontFamily: "var(--display)", fontSize: 30, letterSpacing: "-0.8px", fontWeight: 700 }}>A few do&apos;s and don&apos;ts that protect all of us.</h1>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            {NUMS.map(([v, l, color]) => (
              <div key={v} style={{ borderRadius: 14, background: "#101215", border: "1px solid #1A1D22", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 800, color }}>{v}</span>
                <span style={{ fontSize: 12, color: "#9AA1AB", lineHeight: 1.4 }}>{l}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "stretch" }}>
            <div style={{ flex: "1 1 380px", minWidth: 0, borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 600 }}>Please do</h2>
              {DOS.map((d) => (
                <div key={d} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none", marginTop: 2 }}><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#3DDC84" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span>{d}</span>
                </div>
              ))}
            </div>
            <div style={{ flex: "1 1 380px", minWidth: 0, borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 600 }}>Please don&apos;t</h2>
              {DONTS.map((d) => (
                <div key={d} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none", marginTop: 2 }}><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="#FF8A80" strokeWidth="2.4" strokeLinecap="round" /></svg>
                  <span>{d}</span>
                </div>
              ))}
              <span style={{ fontSize: 12, color: "#7D848E", lineHeight: 1.5, paddingTop: 4 }}>Breaking these can end the agreement, and commissions on those customers stop.</span>
            </div>
          </div>
          <label className="v8-aff-check" style={{ padding: "14px 16px", borderRadius: 14, background: "#101215", border: "1px solid #1A1D22" }}>
            <input type="checkbox" checked={acceptedRules} onChange={(e) => setAcceptedRules(e.target.checked)} style={{ accentColor: "#D5F879", width: 20, height: 20 }} />
            <span>I&apos;ve read the do&apos;s and don&apos;ts.</span>
          </label>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="v8-aff-ghost" onClick={() => setStep(0)}>Back</button>
            <button type="button" className="v8-aff-cta" disabled={!acceptedRules} onClick={() => setStep(2)}>Continue to the agreement</button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section aria-labelledby="a-h" style={{ maxWidth: 860, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, animation: "v8-aff-rise .35s ease both" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h1 id="a-h" style={{ margin: 0, fontFamily: "var(--display)", fontSize: 30, letterSpacing: "-0.8px", fontWeight: 700 }}>Affiliate Program Terms</h1>
              <span style={{ fontSize: 14, color: "#9AA1AB" }}>Version 1.3 · Aequitas Marketing Corp., operating Searchify · Alberta law</span>
            </span>
            <Link href="/partners/terms" style={{ display: "inline-flex", alignItems: "center", minHeight: 42, padding: "0 16px", borderRadius: 12, border: "1px solid #262A31", color: "#F2F4F5", textDecoration: "none", fontSize: 14 }}>Download PDF</Link>
          </div>
          <div role="region" aria-label="Agreement text" tabIndex={0} style={{ maxHeight: 380, overflowY: "auto", borderRadius: 18, background: "#101215", border: "1px solid #1A1D22", padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            {TERMS.map(([h, b], i) => (
              <div key={h} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{i + 1}. {h}</span>
                <span style={{ fontSize: 14, color: "#D7DADE", lineHeight: 1.6 }}>{b}</span>
              </div>
            ))}
            <span style={{ fontSize: 12, color: "#7D848E", paddingTop: 6, borderTop: "1px solid #1A1D22" }}>[Draft for the design. Final wording comes from Searchify&apos;s lawyer.]</span>
          </div>
          <div style={{ borderRadius: 20, background: "#101215", border: "1px solid rgba(213,248,121,.35)", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Sign and confirm</h2>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 14, lineHeight: 1.5, color: "#D7DADE" }}>
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} style={{ accentColor: "#D5F879", width: 20, height: 20, flex: "none", marginTop: 1 }} />
              I&apos;ve read the Affiliate Program Terms (version 1.3) and agree to be bound by them.
            </label>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 14, lineHeight: 1.5, color: "#D7DADE" }}>
              <input type="checkbox" checked={acceptedEnd} onChange={(e) => setAcceptedEnd(e.target.checked)} style={{ accentColor: "#D5F879", width: 20, height: 20, flex: "none", marginTop: 1 }} />
              I&apos;ll follow the do&apos;s and don&apos;ts, and I understand that breaking them can end this agreement and stop my commissions.
            </label>
            <label className="v8-aff-field">
              Type your full legal name to sign
              <input type="text" autoComplete="name" value={signedName} placeholder="Full legal name" onChange={(e) => setSignedName(e.target.value)} />
            </label>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "6px 4px 0" }}>
              <span style={{ display: "flex", flexDirection: "column", flex: "1 1 260px", minWidth: 0 }}>
                <span style={{ fontFamily: '"Mrs Saint Delafield", "Snell Roundhand", cursive', fontSize: 52, lineHeight: 1.15, color: "#D5F879", minHeight: 60, borderBottom: "1px solid #3A404A" }}>{signedName.trim() || " "}</span>
                <span style={{ fontSize: 12, color: "#7D848E", paddingTop: 6 }}>Signature</span>
              </span>
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: 15, paddingBottom: 6, borderBottom: "1px solid #3A404A" }}>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                <span style={{ fontSize: 12, color: "#7D848E", paddingTop: 6 }}>Date</span>
              </span>
            </div>
            <span style={{ fontSize: 12, color: "#7D848E", lineHeight: 1.5 }}>Typing your name and pressing the button counts as your signature. We save it with the date, time and terms version, and you can download a signed copy any time from Agreement and rules.</span>
            {err ? <p className="v8-aff-err" role="alert">{err}</p> : null}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="v8-aff-ghost" onClick={() => setStep(1)}>Back</button>
            <button type="button" disabled={!acceptedRules || !acceptedTerms || !acceptedEnd || signedName.trim().length < 3 || busy} onClick={sign} style={{ minHeight: 52, padding: "0 24px", borderRadius: 14, border: 0, background: "#D5F879", color: "#0A0B0D", fontSize: 16, fontWeight: 600, boxShadow: "0 0 24px rgba(213,248,121,.35)", opacity: acceptedTerms && acceptedEnd && signedName.trim().length >= 3 ? 1 : 0.45 }}>
              {busy ? "Signing…" : "Sign and confirm"}
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section aria-labelledby="d-h" style={{ maxWidth: 720, width: "100%", boxSizing: "border-box", margin: "10px auto 0", borderRadius: 26, background: "#101215", border: "1px solid rgba(213,248,121,.45)", boxShadow: "0 0 40px rgba(213,248,121,.1)", padding: "clamp(24px, 4vw, 40px)", display: "flex", flexDirection: "column", gap: 18, animation: "v8-aff-rise .35s ease both" }}>
          <span style={{ width: 54, height: 54, borderRadius: "50%", background: "#D5F879", color: "#0A0B0D", display: "grid", placeItems: "center" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </span>
          <h1 id="d-h" role="status" style={{ margin: 0, fontFamily: "var(--display)", fontSize: 36, letterSpacing: "-1px", fontWeight: 700 }}>Signed. You&apos;re in, {signedName.trim().split(/\s+/)[0] || first}.</h1>
          <p style={{ margin: 0, fontSize: 16, color: "#D7DADE", lineHeight: 1.6 }}>Here&apos;s your link. Anyone who clicks it is tracked to you for 60 days.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ flex: "1 1 260px", minHeight: 52, display: "flex", alignItems: "center", padding: "0 16px", borderRadius: 13, border: "1px solid #262A31", background: "#0A0B0D", fontFamily: '"Open Sans", sans-serif', fontWeight: 700, fontSize: 15 }}>{referralLink || "Your link is ready after sign-in"}</span>
            <button type="button" onClick={copyLink} disabled={!referralLink} style={{ minHeight: 52, padding: "0 20px", borderRadius: 13, border: 0, background: copied ? "#3DDC84" : "#D5F879", color: "#0A0B0D", fontSize: 15, fontWeight: 600 }}>{copied ? "Copied" : "Copy link"}</button>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 4 }}>
            <button type="button" onClick={() => router.push("/partners")} style={{ display: "inline-flex", alignItems: "center", minHeight: 50, padding: "0 20px", borderRadius: 13, border: 0, background: "#4DA3FF", color: "#0A0B0D", fontSize: 15, fontWeight: 600, boxShadow: "0 0 22px rgba(77,163,255,.4)" }}>Go to your dashboard</button>
            <Link href="/partners/terms" style={{ display: "inline-flex", alignItems: "center", minHeight: 50, padding: "0 18px", borderRadius: 13, border: "1px solid #262A31", color: "#F2F4F5", textDecoration: "none", fontSize: 15 }}>Download signed copy</Link>
          </div>
        </section>
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
