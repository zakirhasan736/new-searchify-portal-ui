"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useNavigate } from "@/lib/navigation";
import { AuthField, AuthScreen, AuthSubmit, passwordIssues } from "@/components/v8/AuthScreen";
import { PARTNER_KEY, PREVIEW_KEY, clearSessionFlag } from "@/lib/authRoles";
import { hydrateJourney, normalizeSiteUrl, postLoginPath, seedDraftSite, stashPendingSite } from "@/lib/journey";
import { parseJwt, userLogin } from "@/utils/users/Helpers";
import { fetchProjectByUserId } from "@/utils/users/ProjectUtil";

/**
 * Create access — same V8 auth shell as presentation/signin.html.
 * Posts to /api/v1/auth/signup, then signs in with the same credentials so the
 * workspace opens on a real JWT (no second manual sign-in).
 * Honours ?email=&plan=&billing=&next=&site= from /pricing and landing scan.
 */
export default function SignUp() {
  const navigate = useNavigate();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [pwd, setPwd] = useState("");
  const [cpwd, setCpwd] = useState("");
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState("");
  const [toastKind, setToastKind] = useState("");

  useEffect(() => {
    const mail = params.get("email");
    if (mail) setEmail(mail);
    const site = normalizeSiteUrl(params.get("site") || "");
    if (site) stashPendingSite(site);
  }, [params]);

  const notice = (msg, kind = "") => {
    setToast(msg);
    setToastKind(kind);
  };

  const openWorkspace = async (result, site, nextPath) => {
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
    if (site) {
      stashPendingSite(site);
      seedDraftSite(site);
    }
    if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
      navigate(nextPath);
      return;
    }
    await hydrateJourney({ force: true });
    navigate(postLoginPath());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return notice("Enter your email.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return notice("Enter a valid email.");
    if (!username.trim()) return notice("Choose a username.");
    const pwdError = passwordIssues(pwd);
    if (pwdError) return notice(pwdError);
    if (pwd !== cpwd) return notice("Password and confirmation must match.");
    setPending(true);
    setToast("");
    const mail = email.trim();
    const site = normalizeSiteUrl(params.get("site") || "");
    const next = params.get("next") || (site ? "/app/start" : "");
    try {
      const res = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: pwd,
          email: mail,
          roles: ["ROLE_CLIENT"],
        }),
      });
      const created = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = created.detail;
        const message =
          typeof detail === "string"
            ? detail
            : detail?.message || "Could not create that account.";
        notice(message);
        return;
      }
      let result = created;
      if (!result.token) {
        const signin = await fetch("/api/v1/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: mail, password: pwd }),
        });
        result = await signin.json().catch(() => ({}));
        if (!signin.ok) result = {};
      }
      if (result.token) {
        notice("Access created. Opening your workspace…", "ok");
        await openWorkspace(
          {
            token: result.token,
            userType: result.userType || "client",
            username: result.username || username.trim(),
          },
          site,
          next,
        );
        return;
      }
      // Account exists; fall back to sign-in with email prefilled.
      notice("Account created. Sign in to open the workspace.", "ok");
      const q = new URLSearchParams({ email: mail });
      if (next) q.set("next", next);
      if (site) q.set("site", site);
      const plan = params.get("plan") || "";
      const billing = params.get("billing") || "";
      if (plan) q.set("plan", plan);
      if (billing) q.set("billing", billing);
      setTimeout(() => navigate(`/login?${q}`), 700);
    } catch {
      notice("Could not reach Searchify. Try again in a moment.");
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthScreen
      line1="Create access."
      sub="Use your email. You can connect the site right after this."
      title="Create access"
      toast={toast}
      toastKind={toastKind}
      foot={
        <div className="v8-auth-foot">
          <Link href="/login">Already have access? Sign in</Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <AuthField
          label="Email"
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthField
          label="Username"
          id="username"
          type="text"
          name="username"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <AuthField
          label="Password"
          id="password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
        <AuthField
          label="Confirm password"
          id="confirm"
          type="password"
          name="confirm"
          autoComplete="new-password"
          required
          value={cpwd}
          onChange={(e) => setCpwd(e.target.value)}
        />
        <AuthSubmit disabled={pending}>{pending ? "Creating…" : "Create access"}</AuthSubmit>
      </form>
    </AuthScreen>
  );
}
