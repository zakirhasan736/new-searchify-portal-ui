"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import SearchifyMarkSvg from "@/components/v8/SearchifyMarkSvg";
import { partnerApply } from "@/lib/partnerApi";
import "@/styles/v8-affiliate.css";

const ROLES = [
  ["Content creator", "Videos, posts, podcasts or a blog"],
  ["Business owner", "You run a company and know other owners"],
  ["Agency or freelancer", "You build or market websites for clients"],
  ["Consultant or coach", "You advise businesses one-on-one"],
  ["Community or newsletter", "You run a group, forum or email list"],
  ["Something else", "Tell us below"],
];

const PLATFORMS = [
  "YouTube",
  "TikTok",
  "Instagram",
  "Facebook",
  "LinkedIn",
  "X (Twitter)",
  "Podcast",
  "My blog or website",
  "Email newsletter",
  "Online groups and forums",
  "My clients",
  "Word of mouth",
];

const REACH = ["Just starting", "Under 1,000", "1,000–10,000", "10,000–100,000", "100,000+"];

const AUDIENCE = [
  "Local small businesses",
  "Trades and home services",
  "Clinics and wellness",
  "Restaurants and retail",
  "Online stores",
  "Agencies and marketers",
  "Real estate and finance",
  "A mix of everyone",
];

function toggleList(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function PartnerApply() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("Canada");
  const [role, setRole] = useState("");
  const [platforms, setPlatforms] = useState([]);
  const [reach, setReach] = useState("");
  const [audience, setAudience] = useState([]);
  const [website, setWebsite] = useState("");
  const [note, setNote] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const canSend = useMemo(() => {
    return Boolean(name.trim() && email.includes("@") && role && platforms.length && agreed);
  }, [name, email, role, platforms, agreed]);

  const submit = async (e) => {
    e.preventDefault();
    if (!canSend) return;
    setBusy(true);
    setErr("");
    const res = await partnerApply({
      name: name.trim(),
      email: email.trim(),
      country,
      role,
      platforms,
      audience,
      reach,
      website: website.trim(),
      note: note.trim(),
      channel: platforms.join(", "),
      agreed: true,
    });
    setBusy(false);
    if (res.ok) setDone(true);
    else setErr(typeof res.data?.detail === "string" ? res.data.detail : "Could not send application.");
  };

  return (
    <div className="v8-aff">
      <header className="v8-aff-head" style={{ maxWidth: 1080 }}>
        <Link href="/" className="v8-aff-brand">
          <SearchifyMarkSvg size={30} />
          <strong>searchify</strong>
          <span className="v8-aff-chip">AFFILIATES</span>
        </Link>
        <Link href="/partners/login" className="v8-aff-back">
          Already an affiliate? Sign in
        </Link>
      </header>

      <div className="v8-aff-apply">
        <div className="v8-aff-side" hidden={done}>
          <span className="v8-aff-kicker">ABOUT 2 MINUTES</span>
          <h1>Apply to be a Searchify affiliate.</h1>
          <p style={{ margin: 0, fontSize: 16, color: "#9AA1AB", lineHeight: 1.55 }}>
            Tell us a little about you and where you’d share Searchify. Most of it is tap-to-pick. We read every
            application and reply within 2 business days.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="v8-aff-rate">
              <b>25%</b>
              <span>of every payment on Solo, Pro and Agency, for each customer’s first 12 months</span>
            </div>
            <div className="v8-aff-rate">
              <b className="is-plain">20%</b>
              <span>on the Managed SEO plan, which our team does by hand</span>
            </div>
            <div className="v8-aff-rate">
              <b className="is-plain">60</b>
              <span>days of link tracking after someone clicks, paid monthly on the 15th</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>What happens after you apply</span>
            <ol className="v8-aff-steps">
              <li>
                <i>1</i>We review it and email you within 2 business days.
              </li>
              <li>
                <i>2</i>The first time you sign in, you read the rules and sign the agreement.
              </li>
              <li>
                <i>3</i>Your link unlocks and you can start sharing.
              </li>
            </ol>
          </div>
        </div>

        {done ? (
          <section aria-labelledby="done-h" style={{ flex: "1 1 100%", maxWidth: 640, margin: "40px auto 0", borderRadius: 26, background: "#101215", border: "1px solid rgba(213,248,121,.45)", boxShadow: "0 0 40px rgba(213,248,121,.1)", padding: "clamp(24px, 4vw, 40px)", display: "flex", flexDirection: "column", gap: 18 }}>
            <span style={{ width: 54, height: 54, borderRadius: "50%", background: "#D5F879", color: "#0A0B0D", display: "grid", placeItems: "center" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </span>
            <h1 id="done-h" style={{ margin: 0, fontFamily: "var(--display)", fontSize: 36, letterSpacing: "-1px", fontWeight: 700 }}>Thanks, {name.trim().split(/\s+/)[0] || "there"}. Application received.</h1>
            <p role="status" style={{ margin: 0, fontSize: 16, color: "#D7DADE", lineHeight: 1.6 }}>We read every one ourselves and reply to {email || "your email"} within 2 business days. Once you&apos;re approved, the first time you sign in you&apos;ll read the rules, sign the agreement, and get your link.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/partners/welcome" style={{ display: "inline-flex", alignItems: "center", minHeight: 48, padding: "0 18px", borderRadius: 13, background: "#4DA3FF", color: "#0A0B0D", textDecoration: "none", fontSize: 15, fontWeight: 600 }}>Preview your first sign-in</Link>
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", minHeight: 48, padding: "0 18px", borderRadius: 13, border: "1px solid #262A31", color: "#F2F4F5", textDecoration: "none", fontSize: 15 }}>Back to searchify.io</Link>
            </div>
          </section>
        ) : (
          <form className="v8-aff-form" aria-label="Affiliate application" onSubmit={submit}>
            <fieldset>
              <legend>
                <i>1</i>About you
              </legend>
              <div className="v8-aff-grid">
                <label className="v8-aff-field">
                  Your name
                  <input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label className="v8-aff-field">
                  Email
                  <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                <label className="v8-aff-field">
                  Country you live in
                  <select value={country} onChange={(e) => setCountry(e.target.value)}>
                    <option>Canada</option>
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>Australia</option>
                    <option>Another country</option>
                  </select>
                </label>
              </div>
              <span id="role-l" style={{ fontSize: 15, fontWeight: 500, paddingTop: 8 }}>
                What best describes you?
              </span>
              <div role="group" aria-labelledby="role-l" className="v8-aff-grid">
                {ROLES.map(([label, sub]) => (
                  <button
                    key={label}
                    type="button"
                    className={`v8-aff-choice${role === label ? " is-on" : ""}`}
                    aria-pressed={role === label}
                    onClick={() => setRole(label)}
                  >
                    <strong>{label}</strong>
                    <span>{sub}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>
                <i>2</i>How you’d share Searchify
              </legend>
              <span id="plat-l" style={{ fontSize: 15, fontWeight: 500 }}>
                Where will you promote it? <span style={{ fontSize: 13, fontWeight: 400, color: "#9AA1AB" }}>Pick any</span>
              </span>
              <div role="group" aria-labelledby="plat-l" className="v8-aff-pills">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`v8-aff-pill${platforms.includes(p) ? " is-on" : ""}`}
                    aria-pressed={platforms.includes(p)}
                    onClick={() => setPlatforms((prev) => toggleList(prev, p))}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <span id="size-l" style={{ fontSize: 15, fontWeight: 500, paddingTop: 8 }}>
                Roughly how many people do you reach?{" "}
                <span style={{ fontSize: 13, fontWeight: 400, color: "#9AA1AB" }}>
                  Followers, subscribers, clients or members. Any size is welcome.
                </span>
              </span>
              <div role="group" aria-labelledby="size-l" className="v8-aff-pills">
                {REACH.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`v8-aff-pill is-box${reach === r ? " is-on" : ""}`}
                    aria-pressed={reach === r}
                    onClick={() => setReach(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <span id="aud-l" style={{ fontSize: 15, fontWeight: 500, paddingTop: 8 }}>
                Who mostly follows or works with you?{" "}
                <span style={{ fontSize: 13, fontWeight: 400, color: "#9AA1AB" }}>Pick any</span>
              </span>
              <div role="group" aria-labelledby="aud-l" className="v8-aff-pills">
                {AUDIENCE.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={`v8-aff-pill${audience.includes(a) ? " is-on" : ""}`}
                    aria-pressed={audience.includes(a)}
                    onClick={() => setAudience((prev) => toggleList(prev, a))}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <div className="v8-aff-grid" style={{ paddingTop: 8 }}>
                <label className="v8-aff-field">
                  Link to your main channel or website <span style={{ color: "#7D848E" }}>(optional)</span>
                  <input
                    type="url"
                    placeholder="youtube.com/@yourchannel"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </label>
                <label className="v8-aff-field">
                  Anything you’d like us to know? <span style={{ color: "#7D848E" }}>(optional)</span>
                  <input
                    type="text"
                    placeholder="e.g. I review marketing tools for local businesses"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>
                <i>3</i>Send it
              </legend>
              <label className="v8-aff-check">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span>
                  I’ve read the <Link href="/partners/terms">Affiliate Program Terms</Link> and agree to them, and I’m
                  happy for Searchify to email me about my application. I’ll sign the full agreement the first time I
                  sign in.
                </span>
              </label>
              {err ? (
                <p className="v8-aff-err" role="alert">
                  {err}
                </p>
              ) : null}
              <button type="submit" className="v8-aff-cta is-block" disabled={!canSend || busy}>
                {busy ? "Sending…" : "Send my application"}
              </button>
              <span style={{ fontSize: 12, color: "#7D848E", textAlign: "center" }}>
                Only your name, email, what describes you and one place you’ll share are required.
              </span>
            </fieldset>
          </form>
        )}
      </div>
    </div>
  );
}
