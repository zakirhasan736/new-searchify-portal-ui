"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DOT_COLORS, DOT_KEYS, DOT_LABEL, DOT_META } from "@/lib/dotPriority";
import "@/styles/v8-priority-info.css";

/**
 * Compact colour-legend control.
 * Desktop: anchored popover (end-aligned by default so right-edge buttons stay on-screen).
 * Phone/tablet: fixed bottom sheet so it never blows out the board layout.
 */
export default function PriorityInfoButton({
  active = "red",
  size = 28,
  placement = "bottom",
  align = "end",
  label = "What do Dire and Medium mean?",
}) {
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const rootRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => setSheet(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

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
    const prev = document.body.style.overflow;
    if (sheet) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, sheet]);

  const focus = DOT_META[active] || DOT_META.red;
  const useSheet = open && sheet;

  const panel = (
    <div
      id={panelId}
      role="dialog"
      aria-label="Priority colours explained"
      className={useSheet ? "v8-priority-sheet" : "v8-priority-pop"}
      data-placement={placement}
      data-align={align}
    >
      <div className="v8-priority-sheet-handle" aria-hidden="true" />
      <div className="v8-priority-head">
        <div className="v8-priority-copy">
          <strong>Colours = how urgent the change is</strong>
          <span>
            Dire and Medium are a priority queue for shipping fixes. They are not a grade of how good the title
            already on the page is.
          </span>
        </div>
        <button type="button" className="v8-priority-close" aria-label="Close" onClick={() => setOpen(false)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="v8-priority-focus" style={{ borderColor: `${DOT_COLORS[active] || DOT_COLORS.red}55` }}>
        <span style={{ color: DOT_COLORS[active] || DOT_COLORS.red }}>Showing: {focus.label}</span>
        <span>{focus.meaning}</span>
      </div>

      <ul className="v8-priority-list">
        {DOT_KEYS.map((key) => {
          const meta = DOT_META[key];
          return (
            <li key={key}>
              <span
                aria-hidden="true"
                className="v8-priority-dot"
                style={{
                  background: DOT_COLORS[key],
                  boxShadow: `0 0 8px ${DOT_COLORS[key]}`,
                }}
              />
              <span className="v8-priority-item">
                <strong>{DOT_LABEL[key]}</strong>
                <span>{meta.meaning}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <span ref={rootRef} className="v8-priority-info">
      <button
        type="button"
        className={`v8-priority-trigger${open ? " is-on" : ""}`}
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        title={label}
        onClick={() => setOpen((value) => !value)}
        style={{ width: size, height: size }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 10.5v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="7.5" r="1.1" fill="currentColor" />
        </svg>
      </button>

      {open ? (
        useSheet ? (
          <div className="v8-priority-backdrop" role="presentation" onClick={() => setOpen(false)}>
            <div
              role="presentation"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {panel}
            </div>
          </div>
        ) : (
          panel
        )
      ) : null}
    </span>
  );
}
