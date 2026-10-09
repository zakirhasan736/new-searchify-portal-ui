"use client";

import BrandMark from "@/components/v3/BrandMark";
import "@/styles/searchify-v3.css";

export function passwordIssues(value) {
  if (!value) return "Enter a password.";
  if (value.length < 8) return "Use at least 8 characters.";
  if (!/[a-z]/.test(value)) return "Include a lowercase letter.";
  if (!/[A-Z]/.test(value)) return "Include an uppercase letter.";
  if (!/[0-9]/.test(value)) return "Include a number.";
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return "Include a special character.";
  return "";
}

export function AuthScreen({ label, line1, line2, sub, children, toast, toastKind }) {
  return (
    <div className="sf-auth-inner sf-auth-enter">
      <header className="sf-auth-head">
        <div className="sf-auth-brandrow">
          <BrandMark className="sf-auth-logo" />
          <div className="sf-auth-kicker">
            <span className="sf-label">{label}</span>
            <span className="sf-hero-index">SEARCHIFY · ACCESS</span>
          </div>
        </div>
        <section className="sf-hero">
          <h1>
            {line1}
            <br />
            <span>{line2}</span>
          </h1>
          {sub ? <p className="sf-auth-lead">{sub}</p> : null}
        </section>
      </header>
      <div className="sf-auth-stage">
        {toast ? (
          <div className={`sf-auth-toast${toastKind === "ok" ? " sf-auth-ok" : ""}`} role="status">
            {toast}
          </div>
        ) : null}
        <div className="sf-box sf-auth-card">{children}</div>
      </div>
    </div>
  );
}

export function AuthField({ label, children, ...props }) {
  return (
    <label className="sf-field">
      {label}
      {children || <input {...props} />}
    </label>
  );
}

export function AuthSubmit({ children, disabled }) {
  return (
    <button type="submit" className="sf-btn sf-primary sf-auth-submit" disabled={disabled}>
      {children}
    </button>
  );
}
