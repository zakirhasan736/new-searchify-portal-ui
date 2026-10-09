"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthField, AuthScreen, AuthSubmit } from "@/components/v3/AuthScreen";

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
      label="Account recovery"
      line1="FORGOT"
      line2="PASSWORD."
      sub="Confirm the workspace username. Next you will choose a new password."
      toast={toast}
    >
      <form onSubmit={handleSubmit}>
        <AuthField
          label="Username or email"
          type="text"
          name="username"
          autoComplete="username"
          placeholder="workspace username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <AuthSubmit>Continue →</AuthSubmit>
        <p className="sf-auth-foot">
          Remembered it? <Link href="/login">Back to sign in</Link>
        </p>
      </form>
    </AuthScreen>
  );
}
