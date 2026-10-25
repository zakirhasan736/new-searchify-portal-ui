"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useNavigate } from "@/lib/navigation";
import { AuthField, AuthScreen, AuthSubmit } from "@/components/v8/AuthScreen";
import { errorText, resetPassword } from "@/lib/accountApi";
import { PARTNER_KEY, PREVIEW_KEY, clearSessionFlag } from "@/lib/authRoles";
import { parseJwt, userLogin, userLogout } from "@/utils/users/Helpers";

/** Opened from the emailed link (?token=). Sets the new password and signs the customer in. */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [pwd, setPwd] = useState("");
  const [cpwd, setCpwd] = useState("");
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState("");
  const [toastKind, setToastKind] = useState("");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token") || "";
    setToken(t);
    if (!t) setToast("Open the link from the reset email, or ask for a new one.");
  }, []);

  const notice = (msg, kind = "") => {
    setToast(msg);
    setToastKind(kind);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return notice("Open the link from the reset email, or ask for a new one.");
    if (pwd.length < 8) return notice("Use at least 8 characters.");
    if (pwd !== cpwd) return notice("Password and confirmation must match.");
    setPending(true);
    const res = await resetPassword(token, pwd);
    setPending(false);
    if (!res.ok || !res.data?.token) return notice(errorText(res, "This link has expired or was already used."));
    const area = res.data.area;
    const data = parseJwt(res.data.token) || {};
    userLogout();
    clearSessionFlag(PARTNER_KEY);
    clearSessionFlag(PREVIEW_KEY);
    userLogin({ result: { token: res.data.token, username: res.data.username, userType: res.data.userType }, data });
    notice("Password updated. Opening your workspace…", "ok");
    navigate(area === "admin" ? "/admin" : area === "partner" ? "/partners" : "/app");
  };

  return (
    <AuthScreen
      line1="Choose a new password."
      sub="Set a new password for your workspace. The link works once, for 30 minutes."
      title="Reset password"
      toast={toast}
      toastKind={toastKind}
      foot={
        <div className="v8-auth-foot">
          <Link href="/forgot">Send a new link</Link>
          <Link href="/login">← Back to sign in</Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <AuthField label="New password" id="password" type="password" name="password" autoComplete="new-password" required value={pwd} onChange={(e) => setPwd(e.target.value)} />
        <AuthField label="Confirm password" id="cpassword" type="password" name="cpassword" autoComplete="new-password" required value={cpwd} onChange={(e) => setCpwd(e.target.value)} />
        <AuthSubmit disabled={pending || !token}>{pending ? "Saving…" : "Save new password"}</AuthSubmit>
      </form>
    </AuthScreen>
  );
}
