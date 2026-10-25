"use client";

import { useState } from "react";
import { changePassword, errorText, forgotPassword, replaceSessionToken } from "@/lib/accountApi";
import { getUser } from "@/utils/users/Helpers";

const field = {
  minHeight: 46,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid #262A31",
  background: "#0A0B0D",
  color: "#F2F4F5",
  font: "inherit",
  fontSize: 15,
  width: "100%",
  boxSizing: "border-box",
};

const label = { display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#9AA1AB" };

function PasswordInput({ id, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "block" }}>
      <input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...field, paddingRight: 64 }}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        style={{ position: "absolute", right: 8, top: 8, minHeight: 30, padding: "0 10px", borderRadius: 8, border: 0, background: "#1A1D22", color: "#9AA1AB", fontSize: 12 }}
      >
        {show ? "Hide" : "Show"}
      </button>
    </span>
  );
}

/**
 * Change password for the signed-in account: current, new, confirm.
 * area decides where a "forgot current password" link lands (customer | partner | admin).
 */
export default function PasswordChangeForm({ area = "customer", onDone }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setOk(false);
    if (!current) return setMsg("Enter your current password.");
    if (next.length < 8) return setMsg("Use at least 8 characters for the new password.");
    if (next !== confirm) return setMsg("The new password and the confirmation don't match.");
    if (next === current) return setMsg("Choose a password you are not already using.");
    setBusy(true);
    setMsg("");
    const res = await changePassword(current, next);
    setBusy(false);
    if (!res.ok) return setMsg(errorText(res, "The password could not be changed. Try again."));
    replaceSessionToken(res.data.token, res.data.userType, res.data.username);
    setCurrent("");
    setNext("");
    setConfirm("");
    setOk(true);
    setMsg("Password changed. Other devices signed in to this account were signed out.");
    onDone?.();
  };

  const emailReset = async () => {
    const email = getUser()?.data?.email || getUser()?.result?.email || "";
    setBusy(true);
    const res = await forgotPassword(email || getUser()?.result?.username || "", area);
    setBusy(false);
    setOk(res.ok);
    setMsg(res.ok ? "A reset link is on its way to your email. It works for 30 minutes." : errorText(res, "Could not send a reset link."));
  };

  return (
    <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 440 }}>
      <label style={label} htmlFor={`${area}-pw-current`}>
        Current password
        <PasswordInput id={`${area}-pw-current`} value={current} onChange={setCurrent} autoComplete="current-password" />
      </label>
      <label style={label} htmlFor={`${area}-pw-new`}>
        New password
        <PasswordInput id={`${area}-pw-new`} value={next} onChange={setNext} autoComplete="new-password" />
      </label>
      <label style={label} htmlFor={`${area}-pw-confirm`}>
        Confirm new password
        <PasswordInput id={`${area}-pw-confirm`} value={confirm} onChange={setConfirm} autoComplete="new-password" />
      </label>
      <span style={{ fontSize: 12, color: "#7D848E" }}>At least 8 characters. Changing it signs out your other devices.</span>
      {msg ? (
        <p role={ok ? "status" : "alert"} style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: ok ? "#3DDC84" : "#FF5A4E" }}>
          {msg}
        </p>
      ) : null}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="submit"
          disabled={busy}
          style={{ minHeight: 46, padding: "0 18px", borderRadius: 12, border: 0, background: "#4DA3FF", color: "#0A0B0D", fontSize: 15, fontWeight: 600, opacity: busy ? 0.7 : 1 }}
        >
          {busy ? "Saving…" : "Change password"}
        </button>
        <button
          type="button"
          onClick={emailReset}
          disabled={busy}
          style={{ padding: 0, border: 0, background: "none", color: "#9AA1AB", fontSize: 13, textDecoration: "underline" }}
        >
          Forgot your current password? Email me a reset link
        </button>
      </div>
    </form>
  );
}
