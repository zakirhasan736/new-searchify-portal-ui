"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthField, AuthScreen, AuthSubmit, passwordIssues } from "@/components/v3/AuthScreen";

export default function ResetPassword() {
  const router = useRouter();
  const search = useSearchParams();
  const [username, setUsername] = useState("");
  const [pwd, setPwd] = useState("");
  const [cpwd, setCpwd] = useState("");
  const [show, setShow] = useState(false);
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
    const response = await fetch("/api/v1/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password: pwd }),
    });
    setPending(false);
    if (response.ok) {
      notice("Password updated. Sign in with the new password.", "ok");
      setTimeout(() => router.push("/signin"), 800);
      return;
    }
    const data = await response.json().catch(() => ({}));
    notice(data.detail || "Could not update that password.");
  };

  return (
    <AuthScreen
      label="Reset access"
      line1="CHOOSE A"
      line2="NEW PASSWORD."
      sub={`Set a new password for ${username || "this workspace"}. Then sign in and continue the approve → publish loop.`}
      toast={toast}
      toastKind={toastKind}
    >
      <form onSubmit={handleSubmit}>
        <AuthField
          label="Username or email"
          type="text"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <AuthField label="New password">
          <div className="sf-auth-pass">
            <input
              type={show ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
            />
            <button type="button" className="sf-link" onClick={() => setShow((v) => !v)}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </AuthField>
        <AuthField
          label="Confirm new password"
          type={show ? "text" : "password"}
          name="cpassword"
          autoComplete="new-password"
          placeholder="Repeat password"
          value={cpwd}
          onChange={(e) => setCpwd(e.target.value)}
        />
        <AuthSubmit disabled={pending}>{pending ? "Updating…" : "Update password →"}</AuthSubmit>
        <p className="sf-auth-foot">
          <Link href="/forgotpassword">Change account</Link>
          {" · "}
          <Link href="/signin">Sign in</Link>
        </p>
      </form>
    </AuthScreen>
  );
}
