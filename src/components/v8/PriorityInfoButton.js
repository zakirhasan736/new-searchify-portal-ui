"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DOT_COLORS, DOT_KEYS, DOT_LABEL, DOT_META } from "@/lib/dotPriority";

/**
 * Info control that explains board colours = change urgency, not title quality.
 */
export default function PriorityInfoButton({
  active = "red",
  size = 28,
  placement = "bottom",
  label = "What do Dire and Medium mean?",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const focus = DOT_META[active] || DOT_META.red;

  return (
    <span ref={rootRef} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        title={label}
        onClick={() => setOpen((value) => !value)}
        style={{
          width: size,
          height: size,
          padding: 0,
          borderRadius: "50%",
          border: "1px solid #262A31",
          background: open ? "rgba(77,163,255,.14)" : "#131519",
          color: open ? "#4DA3FF" : "#9AA1AB",
          display: "grid",
          placeItems: "center",
          flex: "none",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 10.5v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="7.5" r="1.1" fill="currentColor" />
        </svg>
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Priority colours explained"
          style={{
            position: "absolute",
            zIndex: 40,
            top: placement === "top" ? "auto" : "calc(100% + 10px)",
            bottom: placement === "top" ? "calc(100% + 10px)" : "auto",
            left: 0,
            width: "min(360px, calc(100vw - 32px))",
            padding: "14px 16px",
            borderRadius: "16px",
            border: "1px solid #262A31",
            background: "#101215",
            boxShadow: "0 18px 48px rgba(0,0,0,.45)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <strong style={{ fontSize: 14, color: "#F2F4F5" }}>Colours = how urgent the change is</strong>
            <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.45 }}>
              Dire and Medium are a priority queue for shipping fixes. They are not a grade of how good the title
              already on the page is.
            </span>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: "12px",
              background: "rgba(77,163,255,.08)",
              border: "1px solid rgba(77,163,255,.28)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: DOT_COLORS[active] || DOT_COLORS.red }}>
              Showing: {focus.label}
            </span>
            <span style={{ fontSize: 13, color: "#D7DADE", lineHeight: 1.45 }}>{focus.meaning}</span>
          </div>

          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {DOT_KEYS.map((key) => {
              const meta = DOT_META[key];
              return (
                <li
                  key={key}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    paddingTop: 8,
                    borderTop: "1px solid #1A1D22",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 10,
                      height: 10,
                      marginTop: 4,
                      borderRadius: "50%",
                      background: DOT_COLORS[key],
                      boxShadow: `0 0 8px ${DOT_COLORS[key]}`,
                      flex: "none",
                    }}
                  />
                  <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <strong style={{ fontSize: 13, color: "#F2F4F5" }}>{DOT_LABEL[key]}</strong>
                    <span style={{ fontSize: 12, color: "#9AA1AB", lineHeight: 1.45 }}>{meta.meaning}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </span>
  );
}
