"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthField, AuthScreen, AuthSubmit } from "@/components/v8/AuthScreen";
import { errorText, forgotPassword } from "@/lib/accountApi";

/** Customer forgot password: emails a single-use reset link (30 minutes). */
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState("");
  const [toastKind, setToastKind] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      setToastKind("");
      setToast("Enter the email for this workspace.");
      return;
    }
    setPending(true);
    const res = await forgotPassword(value, "customer");
    setPending(false);
    if (!res.ok) {
      setToastKind("");
      setToast(errorText(res, "Could not send a reset link. Try again."));
      return;
    }
    setSent(true);
    if (res.data?.emailConfigured === false) {
      setToastKind("");
      setToast("Email isn't set up on this Searchify server yet, so no link can be sent. Contact support to reset your password.");
      return;
    }
    setToastKind("ok");
    setToast("If that email has a workspace, a reset link is on its way. It works for 30 minutes. Check spam if it doesn't arrive.");
  };

  return (
    <AuthScreen
      line1="Forgot password."
      sub="Enter the workspace email. We send a link to choose a new password."
      title="Recover access"
      toast={toast}
      toastKind={toastKind}
      foot={
        <div className="v8-auth-foot">
          <Link href="/login">← Back to sign in</Link>
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
        <AuthSubmit disabled={pending}>{pending ? "Sending…" : sent ? "Send again" : "Send reset link"}</AuthSubmit>
      </form>
    </AuthScreen>
  );
}
