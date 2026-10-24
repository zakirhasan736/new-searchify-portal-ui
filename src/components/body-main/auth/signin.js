"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useNavigate } from "@/lib/navigation";
import { parseJwt, userLogin, userLogout } from "../../../utils/users/Helpers";
import { fetchProjectByUserId } from "../../../utils/users/ProjectUtil";
import { AuthField, AuthScreen, AuthSubmit } from "@/components/v8/AuthScreen";
import { hydrateJourney, normalizeSiteUrl, postLoginPath, seedDraftSite, stashPendingSite } from "@/lib/journey";
import { PARTNER_KEY, PREVIEW_KEY, clearSessionFlag, isAdminUser, writeSessionFlag } from "@/lib/authRoles";


/**
 * Customer sign-in — presentation/signin.html layout 100%.
 * Auth hits /api/v1/auth/signin (real JWT). Demo credentials only unlock /skins preview.
 */
export default function Signin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState("");
  const [toastKind, setToastKind] = useState("");

  const notice = (msg, kind = "") => {
    setToast(msg);
    setToastKind(kind);
  };

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
    userLogin(user);
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
      // Presentation default after sign-in is Connect (Plug in).
      navigate(postLoginPath());
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const mail = params.get("email") || "";
    if (mail) setEmail(mail);
    if (params.get("social") === "error") {
      notice(params.get("detail") || "Social login failed.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return notice("Enter your email.");
    if (!pwd) return notice("Enter your password.");
    setPending(true);
    setToast("");
    try {
      const normalized = email.trim().toLowerCase();
      // Preview wall only — never unlocks /app, /partners, or /admin.
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
        notice(
          typeof result.detail === "string"
            ? result.detail
            : "That email and password don't match. Check both and try again.",
        );
        return;
      }
      await finishLogin(result);
    } catch {
      notice("Sign in could not reach Searchify. Try again in a moment.");
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthScreen
      line1="Welcome back."
      sub="Use the email and password for this workspace."
      title="Sign in"
      toast={toast}
      toastKind={toastKind}
      foot={
        <div className="v8-auth-foot">
          <Link href="/forgot">Forgot password</Link>
          <Link href="/signup">Create access</Link>
          <Link href="/partners/login">Partner centre</Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <AuthField
          label="Email"
          id="email"
          type="email"
          name="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthField
          label="Password"
          id="password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
        <AuthSubmit disabled={pending}>{pending ? "Signing in…" : "Sign in"}</AuthSubmit>
      </form>
    </AuthScreen>
  );
}
