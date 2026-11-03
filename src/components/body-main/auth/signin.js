"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useNavigate } from "@/lib/navigation";
import { parseJwt, userLogin, userLogout } from "../../../utils/users/Helpers";
import { fetchProjectByUserId } from "../../../utils/users/ProjectUtil";
import {
  adoptPlanFromBilling,
  hydrateJourney,
  normalizeSiteUrl,
  postLoginPath,
  resolveSiteContinue,
  seedDraftSite,
  stashPendingSite,
} from "@/lib/journey";
import { getBillingAccount } from "@/lib/billingApi";
import { runSiteScan } from "@/lib/v1Api";
import { PARTNER_KEY, PREVIEW_KEY, clearSessionFlag, isAdminUser, writeSessionFlag } from "@/lib/authRoles";
import { errorText, forgotPassword } from "@/lib/accountApi";
import "@/styles/v8-signin.css";

/** Dot colour cycle from screens/SignIn.dc.html */
const DOT_COLORS = {
  r: ["#FF5A4E", "rgba(255,90,78,.5)"],
  y: ["#FFC53D", "rgba(255,197,61,.45)"],
  g: ["#3DDC84", "rgba(61,220,132,.45)"],
  b: ["#4DA3FF", "rgba(77,163,255,.55)"],
};
const DOT_PATTERN = "ggbgygrbggyggbgbggygbgggbgrgbg";

function SearchifyMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" role="img" aria-label="Searchify">
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="#131519" stroke="#2E333B" />
      <circle cx="9" cy="12.5" r="2.9" fill="#FF5A4E" />
      <circle cx="16" cy="12.5" r="2.9" fill="#FF9F43" />
      <circle cx="23" cy="12.5" r="2.9" fill="#FFC53D" />
      <circle cx="9" cy="19.5" r="2.9" fill="#3DDC84" />
      <circle cx="16" cy="19.5" r="2.9" fill="#2CC7C0" />
      <circle cx="23" cy="19.5" r="2.9" fill="#4DA3FF" />
    </svg>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" fill="#4DA3FF" />
      <path d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="#3DDC84" />
      <path d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9z" fill="#FFC53D" />
      <path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z" fill="#FF5A4E" />
    </svg>
  );
}

function DotBoard() {
  const dots = useMemo(
    () =>
      DOT_PATTERN.split("").map((k, i) => ({
        c: DOT_COLORS[k][0],
        g: DOT_COLORS[k][1],
        delay: `${(-(i * 0.37) % 3).toFixed(2)}s`,
        dur: `${(2.4 + (i % 5) * 0.35).toFixed(2)}s`,
      })),
    [],
  );
  return (
    <div className="v8-signin-board" aria-hidden="true">
      {dots.map((d, i) => (
        <span
          key={i}
          className="si-dot"
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: d.c,
            boxShadow: `0 0 10px ${d.g}`,
            animationDelay: d.delay,
            animationDuration: d.dur,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Customer sign-in + reset — presentation/SignIn.html + screens/SignIn.dc.html 100%.
 * Auth: /api/v1/auth/signin, Google OAuth, /api/v1/auth/forgot.
 */
export default function Signin({ initialView = "signin" } = {}) {
  const navigate = useNavigate();
  const [view, setView] = useState(initialView === "reset" ? "reset" : "signin");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [remember, setRemember] = useState(true);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const safeNext = () => {
    if (typeof window === "undefined") return "";
    try {
      const n = new URLSearchParams(window.location.search).get("next") || "";
      if (n.startsWith("/") && !n.startsWith("//")) return n;
    } catch {
      /* ignore */
    }
    return "";
  };

  const finishLogin = async (result) => {
    const data = parseJwt(result.token);
    const user = { data, result };
    clearSessionFlag(PARTNER_KEY);
    clearSessionFlag(PREVIEW_KEY);
    userLogin(user, { remember });
    try {
      const resProject = await fetchProjectByUserId(user.data.sub);
      const resultProject = await resProject.json().catch(() => ({}));
      localStorage.setItem("project", JSON.stringify(resultProject));
    } catch {
      localStorage.setItem("project", "{}");
    }
    const next = safeNext();
    if (next === "/skins" || next.startsWith("/skins?")) {
      writeSessionFlag(PREVIEW_KEY, true);
      navigate(next);
      return;
    }
    if (next.startsWith("/partners")) {
      navigate("/partners/login");
      return;
    }
    if (next.startsWith("/admin") && !isAdminUser(user) && result.userType !== "admin") {
      navigate("/app");
      return;
    }
    if (next) {
      try {
        const site = normalizeSiteUrl(new URLSearchParams(window.location.search).get("site") || "");
        if (site) {
          await hydrateJourney({ force: true });
          const bill = await getBillingAccount().catch(() => ({ ok: false }));
          if (bill?.ok) adoptPlanFromBilling(bill.data || bill);
          const resolved = resolveSiteContinue(site);
          if (resolved.existing) {
            runSiteScan({ site, force: true }).catch(() => {});
            navigate(next.startsWith("/app/start") ? resolved.path : next);
            return;
          }
          stashPendingSite(site);
          if (next.startsWith("/app/start")) seedDraftSite(site);
        }
      } catch {
        /* ignore */
      }
      navigate(next);
      return;
    }
    if (result.userType === "admin" || isAdminUser(user)) navigate("/admin");
    else {
      await hydrateJourney({ force: true });
      const bill = await getBillingAccount().catch(() => ({ ok: false }));
      if (bill?.ok) adoptPlanFromBilling(bill.data || bill);
      navigate(postLoginPath());
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const mail = params.get("email") || "";
    if (mail) {
      setEmail(mail);
      setResetEmail(mail);
    }
    if (params.get("view") === "reset" || params.get("reset") === "1" || initialView === "reset") {
      setView("reset");
    }
    if (params.get("social") === "error") {
      setErr(true);
      setErrMsg(params.get("detail") || "Social login failed.");
      return;
    }
    const token = params.get("token");
    if (params.get("social") === "1" && token) {
      setPending(true);
      finishLogin({
        token,
        userType: params.get("userType") || "client",
        username: params.get("username") || "",
      }).finally(() => setPending(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startGoogle = async () => {
    setGoogleBusy(true);
    setErr(false);
    setErrMsg("");
    try {
      const response = await fetch("/api/v1/auth/oauth/google/start");
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.authUrl) {
        setErr(true);
        setErrMsg(typeof data.detail === "string" ? data.detail : "Google sign-in is not available right now.");
        setGoogleBusy(false);
        return;
      }
      window.location.href = data.authUrl;
    } catch {
      setErr(true);
      setErrMsg("Could not start Google sign-in. Try again.");
      setGoogleBusy(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!email.trim() || !pwd) {
      setErr(true);
      setErrMsg("Enter your email and password to sign in.");
      return;
    }
    setPending(true);
    setErr(false);
    setErrMsg("");
    try {
      const normalized = email.trim().toLowerCase();
      if (normalized === "demo@searchify.io" && pwd === "Northline-2026") {
        userLogout();
        clearSessionFlag(PARTNER_KEY);
        writeSessionFlag(PREVIEW_KEY, true);
        const next = safeNext();
        navigate(next === "/skins" || next.startsWith("/skins") ? next : "/skins");
        return;
      }
      const res = await fetch("/api/v1/auth/signin", {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ username: email.trim(), password: pwd }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.token) {
        setErr(true);
        setErrMsg(
          typeof result.detail === "string"
            ? result.detail
            : "That email and password don't match. Check both and try again.",
        );
        return;
      }
      await finishLogin(result);
    } catch {
      setErr(true);
      setErrMsg("Sign in could not reach Searchify. Try again in a moment.");
    } finally {
      setPending(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    const value = (resetEmail || email).trim();
    if (!value) {
      setErr(true);
      setErrMsg("Enter the email you signed up with.");
      return;
    }
    setPending(true);
    setErr(false);
    setErrMsg("");
    setOkMsg("");
    const res = await forgotPassword(value, "customer");
    setPending(false);
    if (!res.ok) {
      setErr(true);
      setErrMsg(errorText(res, "Could not send a reset link. Try again."));
      return;
    }
    setResetSent(true);
    if (res.data?.emailConfigured === false) {
      setErr(true);
      setErrMsg(
        "Email isn't set up on this Searchify server yet, so no link can be sent. Contact support to reset your password.",
      );
      return;
    }
    setOkMsg(
      "If that email has a Searchify account, a reset link is on its way. Check your spam folder if it hasn't arrived in a few minutes.",
    );
  };

  const toReset = () => {
    setView("reset");
    setResetSent(false);
    setErr(false);
    setErrMsg("");
    setOkMsg("");
    setResetEmail(email);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("view", "reset");
      window.history.replaceState(null, "", url.pathname + url.search);
    } catch {
      /* ignore */
    }
  };

  const toSignIn = () => {
    setView("signin");
    setResetSent(false);
    setErr(false);
    setErrMsg("");
    setOkMsg("");
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("view");
      url.searchParams.delete("reset");
      window.history.replaceState(null, "", url.pathname + url.search);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="v8-signin">
      <header className="v8-signin-head">
        <Link href="/" className="v8-signin-brand">
          <SearchifyMark />
          <span>searchify</span>
        </Link>
        <Link href="/" className="v8-signin-back">
          ← Back to searchify.io
        </Link>
      </header>

      <div className="v8-signin-body">
        <div className="v8-signin-intro">
          <h1>Welcome back.</h1>
          <p>Your board is waiting. Sign in to see what moved this week and what&apos;s ready for your OK.</p>
          <DotBoard />
        </div>

        {view === "signin" ? (
          <form className="v8-signin-card" onSubmit={handleSignIn} noValidate>
            <h2>Sign in to Searchify</h2>
            <button
              type="button"
              className="v8-signin-google si-google"
              onClick={startGoogle}
              disabled={googleBusy || pending}
            >
              <GoogleGlyph />
              {googleBusy ? "Opening Google…" : "Continue with Google"}
            </button>
            <div className="v8-signin-or" aria-hidden="true">
              <span />
              or with email
              <span />
            </div>
            <label className="v8-signin-field">
              Email
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="v8-signin-field">
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
              />
            </label>
            <div className="v8-signin-row">
              <label className="v8-signin-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Keep me signed in
              </label>
              <button type="button" className="v8-signin-linkbtn" onClick={toReset}>
                Forgot your password?
              </button>
            </div>
            {err ? (
              <p className="v8-signin-err" role="alert">
                {errMsg || "Enter your email and password to sign in."}
              </p>
            ) : null}
            <button type="submit" className="v8-signin-submit" disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </button>
            <div className="v8-signin-foot">
              <span>
                New to Searchify? <Link href="/free-analysis">Scan your site free</Link> or{" "}
                <Link href="/pricing">start your free month</Link>.
              </span>
              <span className="is-affiliate">
                Referring customers? <Link href="/partners/login">Affiliate sign in</Link>
              </span>
            </div>
          </form>
        ) : (
          <form className="v8-signin-card" onSubmit={handleReset} noValidate>
            <h2>Reset your password</h2>
            {!resetSent ? (
              <div className="v8-signin-reset-stack">
                <span className="v8-signin-reset-copy">
                  Enter the email you signed up with. We&apos;ll send a link that works for 30 minutes.
                </span>
                <label className="v8-signin-field">
                  Email
                  <input
                    type="email"
                    autoComplete="username"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </label>
                {err ? (
                  <p className="v8-signin-err" role="alert">
                    {errMsg}
                  </p>
                ) : null}
                <button type="submit" className="v8-signin-submit is-secondary" disabled={pending}>
                  {pending ? "Sending…" : "Send reset link"}
                </button>
              </div>
            ) : (
              <>
                <p className="v8-signin-ok" role="status">
                  {okMsg ||
                    "If that email has a Searchify account, a reset link is on its way. Check your spam folder if it hasn't arrived in a few minutes."}
                </p>
                {err ? (
                  <p className="v8-signin-err" role="alert">
                    {errMsg}
                  </p>
                ) : null}
              </>
            )}
            <button type="button" className="v8-signin-linkbtn is-back" onClick={toSignIn}>
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
