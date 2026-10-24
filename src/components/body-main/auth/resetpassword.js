"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthField, AuthScreen, AuthSubmit, passwordIssues } from "@/components/v8/AuthScreen";

export default function ResetPassword() {
  const router = useRouter();
  const search = useSearchParams();
  const [username, setUsername] = useState("");
  const [pwd, setPwd] = useState("");
  const [cpwd, setCpwd] = useState("");
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState("");
  const [toastKind, setToastKind] = useState("");

  useEffect(() => {
    const fromQuery = search?.get("user") || "";
    if (fromQuery) setUsername(fromQuery);
  }, [search]);

  const notice = (msg, kind = "") => {
    setToast(msg);
    setToastKind(kind);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      notice("Start from Forgot password so we know which account to update.");
      return;
    }
    const pwdError = passwordIssues(pwd);
    if (pwdError) return notice(pwdError);
    if (pwd !== cpwd) return notice("Password and confirmation must match.");
    setPending(true);
    setToast("");
    try {
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: pwd }),
      });
      if (response.ok) {
        notice("Password updated. Sign in with the new password.", "ok");
        setTimeout(() => router.push("/login"), 800);
        return;
      }
      const data = await response.json().catch(() => ({}));
      notice(data.detail || "Could not update that password.");
    } catch {
      notice("Could not reach Searchify. Try again in a moment.");
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthScreen
      line1="Choose a new password."
      sub={`Set a new password for ${username || "this workspace"}. Then sign in and continue.`}
      title="Reset password"
      toast={toast}
      toastKind={toastKind}
      foot={
        <div className="v8-auth-foot">
          <Link href="/forgot">Change account</Link>
          <Link href="/login">Sign in</Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <AuthField
          label="Email"
          id="email"
          type="text"
          name="username"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <AuthField
          label="New password"
          id="password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
        <AuthField
          label="Confirm new password"
          id="confirm"
          type="password"
          name="cpassword"
          autoComplete="new-password"
          required
          value={cpwd}
          onChange={(e) => setCpwd(e.target.value)}
        />
        <AuthSubmit disabled={pending}>{pending ? "Updating…" : "Update password"}</AuthSubmit>
      </form>
    </AuthScreen>
  );
}
