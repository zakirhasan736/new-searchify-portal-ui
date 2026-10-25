"use client";

import { useEffect, useRef } from "react";

/** Accessible popup used for account actions (Esc and the backdrop close it). */
export default function Modal({ open, title, onClose, children, width = 480 }) {
  const box = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const first = box.current?.querySelector("input, button");
    first?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(5,6,8,.72)", display: "grid", placeItems: "center", padding: 16 }}
    >
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: "100%",
          maxWidth: width,
          maxHeight: "calc(100vh - 32px)",
          overflow: "auto",
          boxSizing: "border-box",
          borderRadius: 20,
          background: "#131519",
          border: "1px solid #262A31",
          padding: 24,
          color: "#F2F4F5",
          fontFamily: "Geist, 'Helvetica Neue', sans-serif",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #262A31", background: "transparent", color: "#9AA1AB", fontSize: 18, lineHeight: 1, cursor: "pointer" }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
