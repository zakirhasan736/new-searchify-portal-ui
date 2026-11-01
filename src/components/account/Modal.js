"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

/** Accessible popup used for account actions (Esc and the backdrop close it). Renders in document.body so MotionStage/GSAP never traps the fields. */
export default function Modal({ open, title, onClose, children, width = 480 }) {
  const box = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Prefer the first real field; never steal focus onto the close button.
    const first = box.current?.querySelector("input:not([type=hidden]):not([readonly]), textarea, select");
    window.requestAnimationFrame(() => first?.focus?.());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="presentation"
      data-no-reveal="1"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(5,6,8,.72)",
        display: "grid",
        placeItems: "center",
        padding: 16,
        pointerEvents: "auto",
      }}
    >
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-no-reveal="1"
        onMouseDown={(e) => e.stopPropagation()}
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
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2 id={titleId} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid #262A31",
              background: "transparent",
              color: "#9AA1AB",
              fontSize: 18,
              lineHeight: 1,
              cursor: "pointer",
              flex: "none",
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
