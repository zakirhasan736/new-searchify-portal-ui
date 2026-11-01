"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SearchifyMarkSvg from "@/components/v8/SearchifyMarkSvg";
import { PARTNER_KEY, PREVIEW_KEY, clearSessionFlag, writeSessionFlag } from "@/lib/authRoles";
import { partnerResetPassword, partnerSetPassword, partnerSignIn, getPartnerMe } from "@/lib/partnerApi";
import { parseJwt, userLogin, userLogout } from "@/utils/users/Helpers";
import "@/styles/v8-affiliate.css";

function AffiliateLoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setupToken = params?.get("setup") || params?.get("reset") || "";
  const [view, setView] = useState(setupToken ? "setpass" : "signin");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (setupToken) setView("setpass");
  }, [setupToken]);

  const finishSignedIn = async (tokenPayload) => {
    clearSessionFlag(PREVIEW_KEY);
    writeSessionFlag(PARTNER_KEY, true);
    try {
      sessionStorage.setItem(
        "searchify-partner-type",
        tokenPayload?.tier === "founding" ? "founding" : "standard",
      );
    } catch {
      /* ignore */
    }
    const me = await getPartnerMe();
    if (me.ok && me.data?.needsAgreement) {
      router.push("/partners/welcome");
      return;
    }
    router.push("/partners");
  };

  const storeSession = (data) => {
    const decoded = parseJwt(data.token) || {};
    userLogout();
    userLogin({
      result: { token: data.token, username: data.username, userType: "partner" },
      data: { ...decoded, exp: decoded.exp, role: decoded.role || "ROLE_PARTNER", userType: "partner" },
    });
  };

  const signIn = async (e) => {
    e?.preventDefault?.();
    setBusy(true);
    setErr("");
    const res = await partnerSignIn(email, pass);
    setBusy(false);
    if (!res.ok || !res.data?.token) {
      setErr(res.data?.detail || "That email and password don't match an affiliate account.");
      return;
    }
    if (String(res.data.userType || "").toLowerCase() !== "partner") {
      setErr("That account is not an affiliate login. Agency workspaces use /login.");
      return;
    }
    storeSession(res.data);
    await finishSignedIn(res.data);
  };

  const sendReset = async (e) => {
    e?.preventDefault?.();
    setBusy(true);
    setErr("");
    await partnerResetPassword(resetEmail || email);
    setBusy(false);
    setSent(true);
  };

  const setNewPassword = async (e) => {
    e?.preventDefault?.();
    if ((pass || "").length < 8) {
      setErr("Use at least 8 characters.");
      return;
    }
    if (pass !== pass2) {
      setErr("Those passwords don’t match.");
      return;
    }
    setBusy(true);
    setErr("");
    const res = await partnerSetPassword(setupToken, pass);
    setBusy(false);
    if (!res.ok || !res.data?.token) {
      setErr(res.data?.detail || "This link has expired or was already used. Ask for a new one.");
      return;
    }
    storeSession(res.data);
    await finishSignedIn(res.data);
  };

  return (
    <div className="v8-aff">
      <header className="v8-aff-head">
        <Link href="/" className="v8-aff-brand">
          <SearchifyMarkSvg size={30} />
          <strong>searchify</strong>
          <span className="v8-aff-chip">AFFILIATES</span>
        </Link>
        <Link href="/" className="v8-aff-back">
          ← Back to searchify.io
        </Link>
      </header>

      <div className="v8-aff-hero">
        <div className="v8-aff-copy">
          <h1>Earn a 25% commission on every payment you refer.</h1>
          <p>
            Share your link with agencies and site owners. For the first 12 months of each customer you send, you earn a
            25% commission on what they pay, every month, paid out on the 15th.
          </p>
          <div className="v8-aff-stats">
            <div className="v8-aff-stat">
              <b className="is-lime">25%</b>
              <span>commission rate, for 12 months</span>
            </div>
            <div className="v8-aff-stat">
              <b>60 days</b>
              <span>link tracking after a click</span>
            </div>
            <div className="v8-aff-stat">
              <b>$50</b>
              <span>minimum payout</span>
            </div>
          </div>
          <span style={{ fontSize: 13, color: "#7D848E" }}>
            Example: refer one agency on the Agency plan ($399 / month) and earn $99.75 a month for a year.
          </span>
        </div>

        {view === "signin" ? (
          <form className="v8-aff-card" onSubmit={signIn} aria-label="Affiliate sign in">
            <h2>Affiliate sign in</h2>
            <label className="v8-aff-field">
              Email
              <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="v8-aff-field">
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
              />
            </label>
            <button
              type="button"
              className="v8-aff-linkish"
              onClick={() => {
                setView("reset");
                setSent(false);
                setErr("");
                setResetEmail(email);
              }}
            >
              Forgot your password?
            </button>
            {err ? (
              <p className="v8-aff-err" role="alert">
                {err}
              </p>
            ) : null}
            <button type="submit" className="v8-aff-cta" disabled={busy}>
              {busy ? "Signing in…" : "Sign in to the affiliate centre"}
            </button>
            <span style={{ fontSize: 14, color: "#9AA1AB" }}>
              Not an affiliate yet? <Link href="/partners/apply">Apply in two minutes</Link>
            </span>
            <span style={{ fontSize: 13, color: "#7D848E", lineHeight: 1.5 }}>
              Agency workspace? Use <Link href="/login" style={{ color: "#9AA1AB" }}>/login</Link> — not this page.
            </span>
          </form>
        ) : null}

        {view === "reset" ? (
          <form className="v8-aff-card" onSubmit={sendReset} aria-label="Reset password">
            <h2>Reset your password</h2>
            {!sent ? (
              <>
                <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>
                  Enter the email you signed up with. We’ll send a link that works for 30 minutes.
                </span>
                <label className="v8-aff-field">
                  Email
                  <input
                    type="email"
                    autoComplete="username"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </label>
                {err ? (
                  <p className="v8-aff-err" role="alert">
                    {err}
                  </p>
                ) : null}
                <button type="submit" className="v8-aff-cta" disabled={busy}>
                  {busy ? "Sending…" : "Send reset link"}
                </button>
              </>
            ) : (
              <p className="v8-aff-ok" role="status">
                If that email has an affiliate account, a reset link is on its way. Check your spam folder if it hasn’t
                arrived in a few minutes.
              </p>
            )}
            <button type="button" className="v8-aff-linkish" style={{ alignSelf: "flex-start", marginTop: 0 }} onClick={() => setView("signin")}>
              Back to sign in
            </button>
          </form>
        ) : null}

        {view === "setpass" ? (
          <form className="v8-aff-card" onSubmit={setNewPassword} aria-label="Set password">
            <h2>{params?.get("setup") ? "Set your password" : "Choose a new password"}</h2>
            <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>
              {params?.get("setup")
                ? "You’re approved. Pick a password to open the affiliate centre."
                : "This link works for 30 minutes. After you save, you’ll be signed in."}
            </span>
            <label className="v8-aff-field">
              New password
              <input
                type="password"
                autoComplete="new-password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                minLength={8}
                required
              />
            </label>
            <label className="v8-aff-field">
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
                minLength={8}
                required
              />
            </label>
            {err ? (
              <p className="v8-aff-err" role="alert">
                {err}
              </p>
            ) : null}
            <button type="submit" className="v8-aff-cta" disabled={busy || !setupToken}>
              {busy ? "Saving…" : "Save and continue"}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export default function PartnerLogin() {
  return (
    <Suspense fallback={<div className="v8-aff" style={{ minHeight: "100dvh" }} />}>
      <AffiliateLoginInner />
    </Suspense>
  );
}
