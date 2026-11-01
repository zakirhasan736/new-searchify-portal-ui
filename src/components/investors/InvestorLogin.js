"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchifyMarkSvg from "@/components/v8/SearchifyMarkSvg";
import { investorSetPassword, investorSignIn } from "@/lib/investorApi";
import { INVESTOR_KEY, PARTNER_KEY, PREVIEW_KEY, clearSessionFlag, writeSessionFlag } from "@/lib/authRoles";
import { parseJwt, userLogin, userLogout } from "@/utils/users/Helpers";

const STEPS = ["Password", "Two-step code", "Device check"];

const PROTECT = [
  { title: "Invite only", detail: "There is no sign-up page. Aadle creates each investor account by hand in HQ → Shareholders." },
  {
    title: "Highly recommended: a YubiKey",
    detail:
      "A physical security key you plug in or tap. It can’t be phished or copied, so even a stolen password and phone won’t get in. Register two: one on your keyring, one kept safe as a backup.",
  },
  {
    title: "Two-step sign-in, always",
    detail: "An authenticator app or a passkey. Never text messages, which can be hijacked.",
  },
  { title: "New devices need approval", detail: "A one-time email link before any new phone or computer gets in." },
  { title: "Short sessions", detail: "Signed out after 15 minutes idle. Trusted devices expire after 30 days." },
  { title: "Locked after 5 wrong tries", detail: "The account pauses for an hour and Aadle is alerted." },
  { title: "Every sign-in is logged", detail: "You and Aadle can both see when and where your account was used." },
];

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9FE7F5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function InvestorLoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setupToken = useMemo(() => params?.get("setup") || "", [params]);
  const [view, setView] = useState(setupToken ? "setpass" : "signin");
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const finish = (data) => {
    clearSessionFlag(PARTNER_KEY);
    clearSessionFlag(PREVIEW_KEY);
    writeSessionFlag(INVESTOR_KEY, true);
    const decoded = parseJwt(data.token) || {};
    userLogout();
    userLogin({
      result: { token: data.token, username: data.username, userType: "investor" },
      data: { ...decoded, role: decoded.role || "ROLE_INVESTOR", userType: "investor" },
    });
    router.push("/investors");
  };

  const continuePassword = async (e) => {
    e?.preventDefault?.();
    setBusy(true);
    setErr("");
    const res = await investorSignIn({ email, password });
    setBusy(false);
    if (!res.ok) {
      setErr(typeof res.data?.detail === "string" ? res.data.detail : "Could not sign in.");
      return;
    }
    if (res.data?.step === "code") {
      setStep(1);
      return;
    }
    if (res.data?.token) finish(res.data);
  };

  const continueCode = async (e) => {
    e?.preventDefault?.();
    setBusy(true);
    setErr("");
    const res = await investorSignIn({ email, password, code });
    setBusy(false);
    if (!res.ok) {
      setErr(typeof res.data?.detail === "string" ? res.data.detail : "That code isn’t right.");
      return;
    }
    if (res.data?.step === "device") {
      setStep(2);
      return;
    }
    if (res.data?.token) finish(res.data);
  };

  const continueDevice = async () => {
    setBusy(true);
    setErr("");
    const res = await investorSignIn({ email, password, code: code || "123456", deviceOk: true });
    setBusy(false);
    if (!res.ok || !res.data?.token) {
      setErr(typeof res.data?.detail === "string" ? res.data.detail : "Could not approve this device.");
      return;
    }
    finish(res.data);
  };

  const setNewPassword = async (e) => {
    e?.preventDefault?.();
    if (pass !== pass2) {
      setErr("The two passwords don’t match.");
      return;
    }
    setBusy(true);
    setErr("");
    const res = await investorSetPassword(setupToken, pass);
    setBusy(false);
    if (!res.ok || !res.data?.token) {
      setErr(typeof res.data?.detail === "string" ? res.data.detail : "This link has expired. Ask Aadle for a new invite.");
      return;
    }
    finish(res.data);
  };

  const passkey = async () => {
    setBusy(true);
    setErr("");
    const res = await investorSignIn({ email, password: password || "Investor-2026", code: "123456" });
    setBusy(false);
    if (!res.ok) {
      setErr("Passkey demo needs a seeded investor password (Investor-2026), or sign in with email first.");
      return;
    }
    setPassword(password || "Investor-2026");
    setCode("123456");
    setStep(2);
  };

  const field = {
    minHeight: 48,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid #262A31",
    background: "#0A0B0D",
    color: "#F2F4F5",
    font: "inherit",
    fontSize: 15,
  };

  return (
    <div
      style={{
        minHeight: 1000,
        background: "#0A0B0D",
        color: "#F2F4F5",
        fontFamily: "Geist, 'Helvetica Neue', sans-serif",
        boxSizing: "border-box",
        padding: "22px clamp(16px, 4vw, 56px) 56px",
        display: "flex",
        flexDirection: "column",
        gap: 40,
      }}
    >
      <style>{`
        @keyframes sfy-rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        a{color:#9FE7F5}a:hover{color:#CFF4FA}
        button:focus-visible,a:focus-visible,input:focus{outline:2px solid #9FE7F5;outline-offset:2px}
        @media (prefers-reduced-motion: reduce){*{animation:none !important;transition:none !important}}
      `}</style>
      <header style={{ maxWidth: 1120, width: "100%", margin: "0 auto", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <SearchifyMarkSvg size={30} />
        <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontWeight: 800, fontSize: 19, letterSpacing: "-0.4px" }}>
          searchify
        </span>
        <span
          style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 11,
            padding: "3px 8px",
            borderRadius: 6,
            background: "#9FE7F5",
            color: "#0A0B0D",
            fontWeight: 600,
          }}
        >
          INVESTOR
        </span>
      </header>

      <div style={{ maxWidth: 1120, width: "100%", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 40, alignItems: "flex-start" }}>
        <section
          aria-labelledby="si-h"
          style={{
            flex: "1 1 420px",
            minWidth: 0,
            maxWidth: 480,
            borderRadius: 24,
            background: "#101215",
            border: "1px solid #1A1D22",
            padding: "clamp(22px, 3vw, 32px)",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {view === "setpass" ? (
            <form onSubmit={setNewPassword} style={{ display: "flex", flexDirection: "column", gap: 16, animation: "sfy-rise .25s ease both" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <h1 id="si-h" style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 32, letterSpacing: "-0.8px", fontWeight: 700 }}>
                  Set your password
                </h1>
                <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>
                  Aadle invited you to the investor portal. Pick a password (link works for 3 days), then you&apos;re in.
                </span>
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                New password
                <input type="password" autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} minLength={8} required style={field} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                Confirm password
                <input type="password" autoComplete="new-password" value={pass2} onChange={(e) => setPass2(e.target.value)} minLength={8} required style={field} />
              </label>
              {err ? (
                <p role="alert" style={{ margin: 0, fontSize: 14, color: "#FF8A80" }}>
                  {err}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={busy || !setupToken}
                style={{ minHeight: 50, borderRadius: 12, border: 0, background: "#9FE7F5", color: "#0A0B0D", fontSize: 15, fontWeight: 600, opacity: busy ? 0.7 : 1 }}
              >
                {busy ? "Saving…" : "Save and open portal"}
              </button>
            </form>
          ) : null}

          {view === "signin" ? (
            <>
              <ol aria-label="Sign-in steps" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", gap: 6 }}>
                {STEPS.map((label, i) => (
                  <li
                    key={label}
                    aria-current={i === step ? "step" : false}
                    style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? "#9FE7F5" : "#262A31", position: "relative" }}
                  >
                    <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{label}</span>
                  </li>
                ))}
              </ol>

              {step === 0 ? (
                <form onSubmit={continuePassword} style={{ display: "flex", flexDirection: "column", gap: 16, animation: "sfy-rise .25s ease both" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <h1 id="si-h" style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 32, letterSpacing: "-0.8px", fontWeight: 700 }}>
                      Investor sign in
                    </h1>
                    <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>
                      For Searchify&apos;s investors only. Customers and affiliates sign in elsewhere.
                    </span>
                  </div>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                    Email
                    <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} style={field} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                    Password
                    <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} style={field} />
                  </label>
                  {err ? (
                    <p role="alert" style={{ margin: 0, fontSize: 14, color: "#FF8A80" }}>
                      {err}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={busy}
                    style={{ minHeight: 50, borderRadius: 12, border: 0, background: "#9FE7F5", color: "#0A0B0D", fontSize: 15, fontWeight: 600, opacity: busy ? 0.7 : 1 }}
                  >
                    {busy ? "Checking…" : "Continue"}
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#7D848E" }}>
                    <span style={{ flex: 1, height: 1, background: "#1A1D22" }} />
                    or
                    <span style={{ flex: 1, height: 1, background: "#1A1D22" }} />
                  </div>
                  <button
                    type="button"
                    onClick={passkey}
                    disabled={busy}
                    style={{
                      minHeight: 50,
                      borderRadius: 12,
                      border: "1px solid #262A31",
                      background: "transparent",
                      color: "#F2F4F5",
                      fontSize: 15,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="8" cy="9" r="4" />
                      <path d="M11 12l9 0M17 12v3M20 12v2" />
                    </svg>
                    Sign in with a passkey
                  </button>
                  <span style={{ fontSize: 13, color: "#9AA1AB" }}>Forgot your password? Aadle resets it in person or by phone.</span>
                </form>
              ) : null}

              {step === 1 ? (
                <form onSubmit={continueCode} style={{ display: "flex", flexDirection: "column", gap: 16, animation: "sfy-rise .25s ease both" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <h1 id="si-h" style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 32, letterSpacing: "-0.8px", fontWeight: 700 }}>
                      Two-step code
                    </h1>
                    <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>Open your authenticator app. Demo code: 123456.</span>
                  </div>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                    6-digit code
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      style={{ ...field, letterSpacing: "0.2em" }}
                    />
                  </label>
                  {err ? (
                    <p role="alert" style={{ margin: 0, fontSize: 14, color: "#FF8A80" }}>
                      {err}
                    </p>
                  ) : null}
                  <button type="submit" disabled={busy} style={{ minHeight: 50, borderRadius: 12, border: 0, background: "#9FE7F5", color: "#0A0B0D", fontSize: 15, fontWeight: 600 }}>
                    {busy ? "Checking…" : "Continue"}
                  </button>
                  <button type="button" onClick={() => setStep(0)} style={{ background: "none", border: 0, color: "#9AA1AB", fontSize: 13, padding: 0, textAlign: "left" }}>
                    ← Back
                  </button>
                </form>
              ) : null}

              {step === 2 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "sfy-rise .25s ease both" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <h1 id="si-h" style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 32, letterSpacing: "-0.8px", fontWeight: 700 }}>
                      New device
                    </h1>
                    <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>
                      We don&apos;t recognise this browser yet. Approve it to finish signing in. Trusted devices expire after 30 days.
                    </span>
                  </div>
                  {err ? (
                    <p role="alert" style={{ margin: 0, fontSize: 14, color: "#FF8A80" }}>
                      {err}
                    </p>
                  ) : null}
                  <button type="button" disabled={busy} onClick={continueDevice} style={{ minHeight: 50, borderRadius: 12, border: 0, background: "#9FE7F5", color: "#0A0B0D", fontSize: 15, fontWeight: 600 }}>
                    {busy ? "Approving…" : "Trust this device"}
                  </button>
                  <button type="button" onClick={() => setStep(1)} style={{ background: "none", border: 0, color: "#9AA1AB", fontSize: 13, padding: 0, textAlign: "left" }}>
                    ← Back
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </section>

        <aside aria-labelledby="sec-h" style={{ flex: "1 1 340px", minWidth: 0, display: "flex", flexDirection: "column", gap: 14, paddingTop: 6 }}>
          <h2 id="sec-h" style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            How this account is protected
          </h2>
          {PROTECT.map((p) => (
            <div key={p.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ flex: "none", width: 30, height: 30, borderRadius: 9, display: "grid", placeItems: "center", background: "rgba(159,231,245,.1)" }}>
                <LockIcon />
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{p.title}</span>
                <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.45 }}>{p.detail}</span>
              </span>
            </div>
          ))}
          {view === "setpass" ? (
            <button type="button" onClick={() => setView("signin")} style={{ alignSelf: "flex-start", background: "none", border: 0, color: "#9AA1AB", fontSize: 13, padding: 0 }}>
              Already set a password? Sign in →
            </button>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

export default function InvestorLogin() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#0A0B0D" }} />}>
      <InvestorLoginInner />
    </Suspense>
  );
}
