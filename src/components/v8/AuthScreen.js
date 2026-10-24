"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SearchifyMarkSvg from "@/components/v8/SearchifyMarkSvg";
import "@/styles/v8-auth.css";

export function passwordIssues(value) {
  if (!value) return "Enter a password.";
  if (value.length < 8) return "Use at least 8 characters.";
  if (!/[a-z]/.test(value)) return "Include a lowercase letter.";
  if (!/[A-Z]/.test(value)) return "Include an uppercase letter.";
  if (!/[0-9]/.test(value)) return "Include a number.";
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return "Include a special character.";
  return "";
}

/** Exact colour cycle from presentation/signin.html */
const PATTERN = "gbgygrbgggybgygrbggybggrgbyggbgybgygbgyb";
const COLORS = { r: "#FF5A4E", y: "#FFC53D", g: "#3DDC84", b: "#4DA3FF" };
const ORDER = ["r", "y", "g", "b"];

function DotBoard() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return undefined;
    const timer = setInterval(() => setStep((value) => (value + 1) % 4), 2200);
    return () => clearInterval(timer);
  }, []);
  const on = ORDER[step];
  return (
    <div className="v8-auth-board" aria-hidden="true">
      {Array.from({ length: 40 }, (_, i) => {
        const c = PATTERN[i % PATTERN.length];
        const lit = c === on;
        return (
          <span
            key={i}
            className={`v8-auth-dot${lit ? " is-on" : ""}`}
            style={{
              background: COLORS[c],
              opacity: lit ? 1 : 0.16,
              boxShadow: lit ? `0 0 16px ${COLORS[c]}` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * V8 presentation/signin.html shell — layout tokens match the estimate 1:1.
 * Children own the form + real API wiring.
 */
export function AuthScreen({
  line1 = "Welcome back.",
  line2 = null,
  sub = "Sign in to pick up where you left off. New here? Your first scan takes about a minute.",
  title = "Sign in",
  children,
  toast,
  toastKind,
  backHref = "/",
  backLabel = "← Back to searchify.io",
  tag = null,
  showBoard = true,
  foot = null,
}) {
  return (
    <div className="v8-auth">
      <div className="v8-auth-wrap">
        <div className="v8-auth-brand">
          <SearchifyMarkSvg size={28} />
          <span>searchify</span>
          {tag ? <span className="v8-auth-tag">{tag}</span> : null}
        </div>

        <div className="v8-auth-signin">
          <div className="v8-auth-intro">
            <h1>
              {line1}
              {line2 ? (
                <>
                  <br />
                  {line2}
                </>
              ) : null}
            </h1>
            {sub ? <p className="v8-auth-lede">{sub}</p> : null}
            {showBoard ? <DotBoard /> : null}
          </div>

          <div className="v8-auth-card">
            {title ? <h2>{title}</h2> : null}
            {toast ? (
              <p className={`v8-auth-toast${toastKind === "ok" ? " is-ok" : ""}`} role="status">
                {toast}
              </p>
            ) : null}
            {children}
            <p className="v8-auth-note">
              <Link href={backHref}>{backLabel}</Link>
            </p>
            {foot}
          </div>
        </div>
      </div>
    </div>
  );
}

function EyeIcon({ off }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {off ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6 0 10 7 10 7a18.4 18.4 0 0 1-3.2 4.1" />
          <path d="M6.1 6.1C3.6 7.8 2 12 2 12s4 7 10 7a10.7 10.7 0 0 0 4.1-.8" />
        </>
      ) : (
        <>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export function AuthField({ label, children, type, ...props }) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password" && !children;
  return (
    <label className="v8-auth-field">
      {label}
      {children || (
        <span className={isPassword ? "v8-auth-passwrap" : undefined}>
          <input type={isPassword && visible ? "text" : type} {...props} />
          {isPassword ? (
            <button
              type="button"
              className="v8-auth-eye"
              aria-label={visible ? "Hide password" : "Show password"}
              aria-pressed={visible}
              onClick={() => setVisible((value) => !value)}
            >
              <EyeIcon off={visible} />
            </button>
          ) : null}
        </span>
      )}
    </label>
  );
}

export function AuthSubmit({ children, disabled }) {
  return (
    <button type="submit" className="v8-auth-submit" disabled={disabled}>
      {children}
    </button>
  );
}
