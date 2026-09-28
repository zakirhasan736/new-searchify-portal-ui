"use client";

import { useState } from "react";
import Link from "next/link";
import { useNavigate } from "@/lib/navigation";
import { AuthField, AuthScreen, AuthSubmit, passwordIssues } from "@/components/v3/AuthScreen";
import SocialLoginButtons from "./SocialLoginButtons";

export default function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [pwd, setPwd] = useState("");
  const [cpwd, setCpwd] = useState("");
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState("");
  const [toastKind, setToastKind] = useState("");

  const notice = (msg, kind = "") => {
    setToast(msg);
    setToastKind(kind);
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
    const res = await fetch("/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.trim(),
        password: pwd,
        email: email.trim(),
        roles: ["ROLE_CLIENT"],
      }),
    });
    setPending(false);
    if (res.ok) {
      notice("Account created. Sign in to open the workspace.", "ok");
      setTimeout(() => navigate("/signin"), 700);
      return;
    }
    const data = await res.json().catch(() => ({}));
    notice(data.detail || "Could not create that account.");
  };

  return (
    <AuthScreen
      label="New workspace"
      line1="CREATE"
      line2="ACCESS."
      sub="Agencies use Searchify to review WordPress title and description updates before they go live."
      toast={toast}
      toastKind={toastKind}
    >
      <form onSubmit={handleSubmit}>
        <AuthField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@agency.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthField
          label="Username"
          type="text"
          name="username"
          autoComplete="username"
          placeholder="agency-name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <AuthField label="Password">
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
          label="Confirm password"
          type={show ? "text" : "password"}
          name="cpassword"
          autoComplete="new-password"
          placeholder="Repeat password"
          value={cpwd}
          onChange={(e) => setCpwd(e.target.value)}
        />
        <AuthSubmit disabled={pending}>{pending ? "Creating…" : "Create access →"}</AuthSubmit>
        <SocialLoginButtons onError={notice} />
        <p className="sf-auth-foot">
          Already have access? <Link href="/signin">Sign in</Link>
        </p>
      </form>
    </AuthScreen>
  );
}
