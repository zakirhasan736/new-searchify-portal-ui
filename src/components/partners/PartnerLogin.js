"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SearchifyMarkSvg from "@/components/v8/SearchifyMarkSvg";
import { PARTNER_KEY, PREVIEW_KEY, clearSessionFlag, writeSessionFlag } from "@/lib/authRoles";
import { partnerApply, partnerResetPassword, partnerSetPassword, partnerSignIn } from "@/lib/partnerApi";
import { parseJwt, userLogin, userLogout } from "@/utils/users/Helpers";

const LOGIN_CSS = `
.partner-login-root{margin:0;background:#0A0B0D}
.partner-login-root a{color:#D5F879;text-decoration:none}
.partner-login-root a:hover{color:#ECFFB8}
.partner-login-root button{font-family:inherit;cursor:pointer}
.partner-login-root input:focus-visible,.partner-login-root button:focus-visible,.partner-login-root a:focus-visible{outline:2px solid #4DA3FF;outline-offset:2px}
.partner-login-root input[type=checkbox]{accent-color:#D5F879;width:18px;height:18px;flex:none}
@keyframes sfy-rise-login{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){.partner-login-root *{animation:none !important;transition:none !important}}
`;

const cardAnim = { animation: "sfy-rise-login .35s ease both" };

const inputStyle = {
  minHeight: 50,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid #262A31",
  background: "#0A0B0D",
  color: "#F2F4F5",
  font: "inherit",
  fontSize: 16,
};

const inputStyleApply = { ...inputStyle, minHeight: 48, fontSize: 15 };

export default function PartnerLogin() {
  const router = useRouter();
  const [view, setView] = useState("signin");
  const [err, setErr] = useState(false);
  const [applied, setApplied] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [applyName, setApplyName] = useState("");
  const [applyEmail, setApplyEmail] = useState("");
  const [applyChannel, setApplyChannel] = useState("");
  const [applyCountry, setApplyCountry] = useState("United States");
  const [resetEmail, setResetEmail] = useState("");
  const [errMsg, setErrMsg] = useState("");
  // Set-password links from the approval email (?setup=) or a reset email (?reset=).
  const [linkToken, setLinkToken] = useState("");
  const [linkKind, setLinkKind] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPass2, setNewPass2] = useState("");
  const [setErrText, setSetErrText] = useState("");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const setup = params.get("setup");
      const reset = params.get("reset");
      if (setup || reset) {
        setLinkToken(setup || reset);
        setLinkKind(setup ? "setup" : "reset");
        setView("set");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const finishSignedIn = (tokenPayload) => {
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
    router.push("/partners");
  };

  const signIn = async () => {
    setBusy(true);
    setErr(false);
    setErrMsg("");
    const res = await partnerSignIn(email, pass);
    setBusy(false);
    if (!res.ok || !res.data?.token) {
      setErr(true);
      setErrMsg(res.data?.detail || "That email and password don't match a partner account.");
      return;
    }
    if (String(res.data.userType || "").toLowerCase() !== "partner") {
      setErr(true);
      setErrMsg("That account is not a partner login. Agency workspaces use /login.");
      return;
    }
    const decoded = parseJwt(res.data.token) || {};
    userLogout();
    userLogin({
      result: { token: res.data.token, username: res.data.username, userType: "partner" },
      data: { ...decoded, exp: decoded.exp, role: decoded.role || "ROLE_PARTNER", userType: "partner" },
    });
    finishSignedIn(res.data);
  };

  const sendApply = async () => {
    if (!agreed) return;
    setBusy(true);
    setErrMsg("");
    const res = await partnerApply({
      name: applyName,
      email: applyEmail,
      channel: applyChannel,
      country: applyCountry,
      agreed: true,
    });
    setBusy(false);
    if (res.ok) setApplied(true);
    else setErrMsg(typeof res.data?.detail === "string" ? res.data.detail : "Could not send application.");
  };

  const savePassword = async () => {
    setSetErrText("");
    if (newPass.length < 8) {
      setSetErrText("Use at least 8 characters.");
      return;
    }
    if (newPass !== newPass2) {
      setSetErrText("The two passwords don't match.");
      return;
    }
    setBusy(true);
    const res = await partnerSetPassword(linkToken, newPass);
    setBusy(false);
    if (!res.ok || !res.data?.token) {
      setSetErrText(typeof res.data?.detail === "string" ? res.data.detail : "This link has expired or was already used.");
      return;
    }
    const decoded = parseJwt(res.data.token) || {};
    userLogout();
    userLogin({
      result: { token: res.data.token, username: res.data.username, userType: "partner" },
      data: { ...decoded, exp: decoded.exp, role: decoded.role || "ROLE_PARTNER", userType: "partner" },
    });
    try {
      window.history.replaceState(null, "", "/partners/login");
    } catch {
      /* ignore */
    }
    finishSignedIn(res.data);
  };

  const sendReset = async () => {
    setBusy(true);
    await partnerResetPassword(resetEmail || email);
    setBusy(false);
    setSent(true);
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <style>{LOGIN_CSS}</style>
      <div
        className="partner-login-root"
        style={{
          minHeight: 900,
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
        <header
          style={{
            maxWidth: 1180,
            width: "100%",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#F2F4F5" }}>
            <SearchifyMarkSvg size={30} />
            <span
              style={{
                fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                fontWeight: 800,
                fontSize: 19,
                letterSpacing: "-0.4px",
              }}
            >
              searchify
            </span>
            <span
              style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 6,
                border: "1px solid #D5F879",
                color: "#D5F879",
              }}
            >
              PARTNERS
            </span>
          </Link>
          <Link href="/" style={{ fontSize: 14, color: "#9AA1AB", textDecoration: "none" }}>
            ← Back to searchify.io
          </Link>
        </header>

        <div
          style={{
            maxWidth: 1180,
            width: "100%",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            gap: 48,
            alignItems: "center",
          }}
        >
          <div style={{ flex: "1 1 420px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                fontSize: "clamp(40px, 5.2vw, 68px)",
                lineHeight: 0.98,
                letterSpacing: "-2px",
                fontWeight: 700,
              }}
            >
              Earn 30% of every payment you refer.
            </h1>
            <p style={{ margin: 0, fontSize: 17, color: "#9AA1AB", lineHeight: 1.55, maxWidth: 520 }}>
              Share your link with agencies and site owners. For the first 12 months of each customer you send, you earn 30% of what they pay, every month, paid out on the 15th.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, maxWidth: 560 }}>
              {[
                ["30%", "of each payment, for 12 months", true],
                ["60 days", "link tracking after a click", false],
                ["$50", "minimum payout", false],
              ].map(([val, sub, lime]) => (
                <div
                  key={val}
                  style={{
                    borderRadius: 16,
                    padding: 14,
                    background: "#101215",
                    border: "1px solid #1A1D22",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                      fontSize: 26,
                      fontWeight: 800,
                      color: lime ? "#D5F879" : undefined,
                    }}
                  >
                    {val}
                  </span>
                  <span style={{ fontSize: 12, color: "#9AA1AB" }}>{sub}</span>
                </div>
              ))}
            </div>
            <span style={{ fontSize: 13, color: "#7D848E" }}>
              Example: refer one agency on Premium ($399 / month) and earn $119.70 a month for a year.
            </span>
          </div>

          {view === "signin" ? (
            <div
              style={{
                flex: "1 1 360px",
                maxWidth: 440,
                minWidth: 0,
                boxSizing: "border-box",
                borderRadius: 24,
                background: "#131519",
                border: "1px solid #262A31",
                padding: 28,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                ...cardAnim,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Partner sign in</h2>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                Email
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  style={inputStyle}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setView("reset");
                  setSent(false);
                  setErr(false);
                }}
                style={{
                  alignSelf: "flex-end",
                  marginTop: -8,
                  padding: 0,
                  border: 0,
                  background: "none",
                  color: "#9AA1AB",
                  fontSize: 13,
                  textDecoration: "underline",
                }}
              >
                Forgot your password?
              </button>
              {err ? (
                <p style={{ margin: 0, color: "#FF5A4E", fontSize: 14 }}>
                  {errMsg || "That email and password don't match a partner account. Check both and try again."}
                </p>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={signIn}
                style={{
                  minHeight: 54,
                  borderRadius: 14,
                  border: 0,
                  background: "#4DA3FF",
                  color: "#0A0B0D",
                  fontSize: 16,
                  fontWeight: 600,
                  boxShadow: "0 0 24px rgba(77,163,255,.45)",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? "Signing in…" : "Sign in to the partner centre"}
              </button>
              <span style={{ fontSize: 14, color: "#9AA1AB" }}>
                Not a partner yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setView("apply");
                    setErr(false);
                  }}
                  style={{
                    padding: 0,
                    border: 0,
                    background: "none",
                    color: "#D5F879",
                    fontSize: 14,
                    textDecoration: "underline",
                  }}
                >
                  Apply in two minutes
                </button>
              </span>
              <span style={{ fontSize: 13, color: "#7D848E", lineHeight: 1.5 }}>
                Agency workspace? Use{" "}
                <Link href="/login" style={{ color: "#9AA1AB", textDecoration: "underline" }}>
                  /login
                </Link>{" "}
                — not this page.
              </span>
            </div>
          ) : null}

          {view === "apply" ? (
            <div
              style={{
                flex: "1 1 360px",
                maxWidth: 440,
                minWidth: 0,
                boxSizing: "border-box",
                borderRadius: 24,
                background: "#131519",
                border: "1px solid #262A31",
                padding: 28,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                ...cardAnim,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Apply to become a partner</h2>
              {!applied ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {errMsg ? <p style={{ margin: 0, color: "#FF5A4E", fontSize: 14 }}>{errMsg}</p> : null}
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                    Your name
                    <input type="text" value={applyName} onChange={(e) => setApplyName(e.target.value)} style={inputStyleApply} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                    Email
                    <input type="email" value={applyEmail} onChange={(e) => setApplyEmail(e.target.value)} style={inputStyleApply} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                    Where will you share Searchify? (website, channel or community)
                    <input type="text" value={applyChannel} onChange={(e) => setApplyChannel(e.target.value)} style={inputStyleApply} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                    Country you live in
                    <select
                      value={applyCountry}
                      onChange={(e) => setApplyCountry(e.target.value)}
                      style={{
                        ...inputStyleApply,
                        padding: "0 10px",
                      }}
                    >
                      <option>United States</option>
                      <option>Canada</option>
                      <option>United Kingdom</option>
                      <option>Australia</option>
                      <option>Another country</option>
                    </select>
                  </label>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, lineHeight: 1.5, color: "#D7DADE" }}>
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      style={{ marginTop: 3 }}
                    />
                    I agree to the Partner Program Terms, including saying I earn a commission whenever I share my link.
                  </label>
                  <button
                    type="button"
                    disabled={!agreed || busy}
                    onClick={sendApply}
                    style={{
                      opacity: agreed && !busy ? 1 : 0.45,
                      minHeight: 52,
                      borderRadius: 14,
                      border: 0,
                      background: "#4DA3FF",
                      color: "#0A0B0D",
                      fontSize: 16,
                      fontWeight: 600,
                      boxShadow: "0 0 24px rgba(77,163,255,.45)",
                    }}
                  >
                    {busy ? "Sending…" : "Send application"}
                  </button>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 15, color: "#3DDC84", lineHeight: 1.5 }}>
                  Application sent. We reply within 2 business days with your partner link.
                </p>
              )}
              <button
                type="button"
                onClick={() => setView("signin")}
                style={{
                  alignSelf: "flex-start",
                  padding: 0,
                  border: 0,
                  background: "none",
                  color: "#9AA1AB",
                  fontSize: 14,
                  textDecoration: "underline",
                }}
              >
                Already a partner? Sign in
              </button>
            </div>
          ) : null}

          {view === "reset" ? (
            <div
              style={{
                flex: "1 1 360px",
                maxWidth: 440,
                minWidth: 0,
                boxSizing: "border-box",
                borderRadius: 24,
                background: "#131519",
                border: "1px solid #262A31",
                padding: 28,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                ...cardAnim,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Reset your password</h2>
              {!sent ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>
                    Enter the email you signed up with. We{"'ll"} send a link that works for 30 minutes.
                  </span>
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                    Email
                    <input type="email" autoComplete="username" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} style={inputStyle} />
                  </label>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={sendReset}
                    style={{
                      minHeight: 52,
                      borderRadius: 14,
                      border: 0,
                      background: "#4DA3FF",
                      color: "#0A0B0D",
                      fontSize: 16,
                      fontWeight: 600,
                      opacity: busy ? 0.7 : 1,
                    }}
                  >
                    {busy ? "Sending…" : "Send reset link"}
                  </button>
                </div>
              ) : (
                <p role="status" style={{ margin: 0, fontSize: 15, color: "#3DDC84", lineHeight: 1.5 }}>
                  If that email has a partner account, a reset link is on its way. Check your spam folder if it hasn{"'t"} arrived in a few minutes.
                </p>
              )}
              <button
                type="button"
                onClick={() => setView("signin")}
                style={{
                  alignSelf: "flex-start",
                  padding: 0,
                  border: 0,
                  background: "none",
                  color: "#9AA1AB",
                  fontSize: 14,
                  textDecoration: "underline",
                }}
              >
                Back to sign in
              </button>
            </div>
          ) : null}

          {view === "set" ? (
            <div
              style={{
                flex: "1 1 360px",
                maxWidth: 440,
                minWidth: 0,
                boxSizing: "border-box",
                borderRadius: 24,
                background: "#131519",
                border: "1px solid #262A31",
                padding: 28,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                ...cardAnim,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>
                {linkKind === "setup" ? "Welcome. Set your password" : "Choose a new password"}
              </h2>
              <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>
                {linkKind === "setup"
                  ? "Your partner application is approved. Pick a password to open the partner centre."
                  : "Pick a new password for your partner account."}
              </span>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                New password
                <input type="password" autoComplete="new-password" value={newPass} onChange={(e) => setNewPass(e.target.value)} style={inputStyle} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" }}>
                Type it again
                <input type="password" autoComplete="new-password" value={newPass2} onChange={(e) => setNewPass2(e.target.value)} style={inputStyle} />
              </label>
              {setErrText ? (
                <p role="alert" style={{ margin: 0, fontSize: 14, color: "#FF5A4E", lineHeight: 1.5 }}>
                  {setErrText}
                </p>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={savePassword}
                style={{
                  minHeight: 52,
                  borderRadius: 14,
                  border: 0,
                  background: "#4DA3FF",
                  color: "#0A0B0D",
                  fontSize: 16,
                  fontWeight: 600,
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? "Saving…" : "Save password and open the partner centre"}
              </button>
              <button
                type="button"
                onClick={() => setView("reset")}
                style={{
                  alignSelf: "flex-start",
                  padding: 0,
                  border: 0,
                  background: "none",
                  color: "#9AA1AB",
                  fontSize: 14,
                  textDecoration: "underline",
                }}
              >
                Link expired? Send a new one
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
