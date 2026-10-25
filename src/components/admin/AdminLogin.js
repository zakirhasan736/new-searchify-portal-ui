"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useNavigate } from "@/lib/navigation";
import { AuthField, AuthScreen, AuthSubmit } from "@/components/v8/AuthScreen";
import { PARTNER_KEY, PREVIEW_KEY, clearSessionFlag, isAdminAuthenticated } from "@/lib/authRoles";
import { errorText, forgotPassword, resetPassword } from "@/lib/accountApi";
import { parseJwt, userLogin, userLogout } from "@/utils/users/Helpers";

/** HQ admin sign-in, separate from the customer /login. Views: sign in, forgot, reset (?reset=token). */
export default function AdminLogin() {
  const navigate = useNavigate();
  const [view, setView] = useState("signin");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [token, setToken] = useState("");
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState("");
  const [toastKind, setToastKind] = useState("");

  const notice = (msg, kind = "") => {
    setToast(msg);
    setToastKind(kind);
  };

  const nextPath = () => {
    try {
      const n = new URLSearchParams(window.location.search).get("next") || "";
      if (n.startsWith("/admin") && !n.startsWith("/admin/login")) return n;
    } catch {
      /* ignore */
    }
    return "/admin";
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reset = params.get("reset");
    if (reset) {
      setToken(reset);
      setView("reset");
      return;
    }
    if (params.get("signedout") === "1") notice("You are signed out of HQ.", "ok");
    if (isAdminAuthenticated()) navigate(nextPath());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSession = (result) => {
    const data = parseJwt(result.token) || {};
    userLogout();
    clearSessionFlag(PARTNER_KEY);
    clearSessionFlag(PREVIEW_KEY);
    userLogin({ result: { token: result.token, username: result.username, userType: "admin" }, data });
    navigate(nextPath());
  };

  const signIn = async (e) => {
    e.preventDefault();
    if (!email.trim()) return notice("Enter your admin email.");
    if (!pwd) return notice("Enter your password.");
    setPending(true);
    notice("");
    try {
      const res = await fetch("/api/v1/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email.trim(), password: pwd }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.token) {
        notice(typeof result.detail === "string" ? result.detail : "That email and password don't match an admin account.");
        return;
      }
      if (result.userType !== "admin") {
        notice("This sign-in is for Searchify HQ admins. Customers sign in at /login and partners at /partners/login.");
        return;
      }
      startSession(result);
    } catch {
      notice("Sign in could not reach Searchify. Try again in a moment.");
    } finally {
      setPending(false);
    }
  };

  const sendReset = async (e) => {
    e.preventDefault();
    if (!email.trim()) return notice("Enter your admin email.");
    setPending(true);
    const res = await forgotPassword(email, "admin");
    setPending(false);
    if (!res.ok) return notice(errorText(res, "Could not send a reset link."));
    notice(
      res.data?.emailConfigured === false
        ? "Email isn't set up on the server, so no link can be sent. Set a new ADMIN_PASSWORD in the backend environment and restart to recover access."
        : "If that email is an admin account, a reset link is on its way. It works for 30 minutes.",
      res.data?.emailConfigured === false ? "" : "ok",
    );
  };

  const saveReset = async (e) => {
    e.preventDefault();
    if (pwd.length < 8) return notice("Use at least 8 characters.");
    if (pwd !== pwd2) return notice("The two passwords don't match.");
    setPending(true);
    const res = await resetPassword(token, pwd);
    setPending(false);
    if (!res.ok || !res.data?.token) return notice(errorText(res, "This link has expired or was already used."));
    if (res.data.userType !== "admin") return notice("This link is not for an admin account.");
    try {
      window.history.replaceState(null, "", "/admin/login");
    } catch {
      /* ignore */
    }
    startSession(res.data);
  };

  const foot = (
    <div className="v8-auth-foot">
      {view === "signin" ? (
        <button type="button" className="v8-auth-linkbtn" onClick={() => { setView("forgot"); notice(""); }}>
          Forgot password
        </button>
      ) : (
        <button type="button" className="v8-auth-linkbtn" onClick={() => { setView("signin"); notice(""); }}>
          ← Back to admin sign in
        </button>
      )}
      <Link href="/login">Customer sign in</Link>
    </div>
  );

  return (
    <AuthScreen
      tag="HQ"
      line1="Searchify HQ."
      sub="Admin console for customers, partners, payouts and problems. Admin accounts only."
      title={view === "signin" ? "Admin sign in" : view === "forgot" ? "Reset admin password" : "Choose a new password"}
      toast={toast}
      toastKind={toastKind}
      foot={foot}
    >
      {view === "signin" ? (
        <form onSubmit={signIn} noValidate>
          <AuthField label="Admin email" id="admin-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          <AuthField label="Password" id="admin-password" type="password" autoComplete="current-password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
          <AuthSubmit disabled={pending}>{pending ? "Signing in…" : "Sign in to HQ"}</AuthSubmit>
        </form>
      ) : null}
      {view === "forgot" ? (
        <form onSubmit={sendReset} noValidate>
          <AuthField label="Admin email" id="admin-reset-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          <AuthSubmit disabled={pending}>{pending ? "Sending…" : "Send reset link"}</AuthSubmit>
        </form>
      ) : null}
      {view === "reset" ? (
        <form onSubmit={saveReset} noValidate>
          <AuthField label="New password" id="admin-new" type="password" autoComplete="new-password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
          <AuthField label="Confirm new password" id="admin-new2" type="password" autoComplete="new-password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
          <AuthSubmit disabled={pending}>{pending ? "Saving…" : "Save and open HQ"}</AuthSubmit>
        </form>
      ) : null}
    </AuthScreen>
  );
}
