"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthField, AuthScreen, AuthSubmit } from "@/components/v8/AuthScreen";

export default function ForgotPassword() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [toast, setToast] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = username.trim();
    if (!value) {
      setToast("Enter the username or email for this workspace.");
      return;
    }
    router.push(`/reset-password?user=${encodeURIComponent(value)}`);
  };

  return (
    <AuthScreen
      line1="Forgot password."
      sub="Enter the workspace email. Next you choose a new password."
      title="Recover access"
      toast={toast}
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
          type="text"
          name="username"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <AuthSubmit>Continue</AuthSubmit>
      </form>
    </AuthScreen>
  );
}
