"use client";

import { useEffect } from "react";

const TONE = {
  blue: { ring: "#4DA3FF", fill: "#4DA3FF", glow: "rgba(77,163,255,.75)", edge: "rgba(77,163,255,.6)", shadow: "rgba(77,163,255,.25)" },
  green: { ring: "#3DDC84", fill: "#3DDC84", glow: "rgba(61,220,132,.75)", edge: "rgba(61,220,132,.6)", shadow: "rgba(61,220,132,.25)" },
};

function CheckIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#0A0B0D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: "sfy-draw .5s .35s ease-out forwards" }} />
    </svg>
  );
}

function PlugIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0A0B0D" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 2v6" />
      <path d="M15 2v6" />
      <path d="M6 8h12v3a6 6 0 0 1-12 0z" />
      <path d="M12 17v5" />
    </svg>
  );
}

/**
 * Full-screen check dialog from the presentation: ring, tick, checklist, one primary action.
 */
export default function CheckPopup({
  open,
  titleId = "check-h",
  title,
  tone = "blue",
  icon = "check",
  lead = "",
  checks = [],
  counts = [],
  note = "",
  footnote = "",
  primary,
  secondary,
  onClose,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  const color = TONE[tone] || TONE.blue;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        display: "grid",
        placeItems: "center",
        padding: "20px",
        background: "rgba(10,11,13,.85)",
        animation: "sfy-rise .3s ease both",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          boxSizing: "border-box",
          borderRadius: "28px",
          background: "#101215",
          border: `1.5px solid ${color.edge}`,
          boxShadow: `0 0 60px ${color.shadow}`,
          padding: "38px 30px 28px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          textAlign: "center",
          color: "#F2F4F5",
          fontFamily: "Geist, 'Helvetica Neue', sans-serif",
        }}
      >
        <div style={{ position: "relative", width: "100px", height: "100px", display: "grid", placeItems: "center" }}>
          <span aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${color.ring}`, animation: "sfy-ring 1.8s ease-out infinite" }} />
          <span aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${color.ring}`, animation: "sfy-ring 1.8s .6s ease-out infinite" }} />
          <span
            style={{
              position: "relative",
              width: "74px",
              height: "74px",
              borderRadius: "50%",
              background: color.fill,
              boxShadow: `0 0 34px ${color.glow}`,
              display: "grid",
              placeItems: "center",
              animation: "sfy-pop .6s ease-out both",
            }}
          >
            {icon === "plug" ? <PlugIcon /> : <CheckIcon />}
          </span>
        </div>
        <h2 id={titleId} style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(26px, 3vw, 36px)", lineHeight: 1.1, letterSpacing: "-0.8px", fontWeight: 700 }}>
          {title}
        </h2>
        {lead ? <p style={{ margin: 0, fontSize: "16px", lineHeight: 1.55, color: "#D7DADE" }}>{lead}</p> : null}
        {checks.length ? (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px", textAlign: "left" }}>
            {checks.map((item, index) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  background: "rgba(61,220,132,.07)",
                  animation: `sfy-rise .4s ${0.4 + index * 0.3}s ease both`,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span style={{ fontSize: "15px" }}>{item}</span>
              </div>
            ))}
          </div>
        ) : null}
        {counts.length ? (
          <div style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px", textAlign: "left" }}>
            {counts.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "12px", background: "#0A0B0D", border: "1px solid #1A1D22" }}>
                <span style={{ width: "12px", height: "12px", flex: "none", borderRadius: "50%", background: item.color, boxShadow: `0 0 10px ${item.color}` }} />
                <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "22px", fontWeight: 800, color: item.color }}>{item.n}</span>
                <span style={{ fontSize: "13px", color: "#D7DADE", lineHeight: 1.3 }}>{item.label}</span>
              </div>
            ))}
          </div>
        ) : null}
        {note ? (
          <div style={{ width: "100%", boxSizing: "border-box", display: "flex", gap: "12px", alignItems: "flex-start", padding: "14px 16px", borderRadius: "14px", background: "rgba(255,197,61,.08)", border: "1px solid rgba(255,197,61,.45)", textAlign: "left" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFC53D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none", marginTop: "1px" }}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span style={{ fontSize: "14px", lineHeight: 1.55, color: "#D7DADE" }}>{note}</span>
          </div>
        ) : null}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
          {primary ? (
            <button
              type="button"
              onClick={primary.onClick}
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: "54px",
                padding: "0 28px",
                borderRadius: "14px",
                border: 0,
                background: color.fill,
                color: "#0A0B0D",
                fontSize: "16px",
                fontWeight: 600,
                boxShadow: `0 0 24px ${color.shadow}`,
              }}
            >
              {primary.label}
            </button>
          ) : null}
          {secondary ? (
            <button
              type="button"
              onClick={secondary.onClick}
              style={{
                minHeight: "54px",
                padding: "0 18px",
                borderRadius: "14px",
                border: "1px solid #262A31",
                background: "transparent",
                color: "#F2F4F5",
                fontSize: "15px",
              }}
            >
              {secondary.label}
            </button>
          ) : null}
        </div>
        {footnote ? <span style={{ fontSize: "13px", color: "#7D848E" }}>{footnote}</span> : null}
      </div>
    </div>
  );
}
