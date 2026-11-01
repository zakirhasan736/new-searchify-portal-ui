"use client";

import { useId } from "react";
import "./searchify-loader.css";

const DOTS = [
  { cx: 9, cy: 12.5, fill: "#FF5A4E", delay: "0s" },
  { cx: 16, cy: 12.5, fill: "#FF9F43", delay: "0.12s" },
  { cx: 23, cy: 12.5, fill: "#FFC53D", delay: "0.24s" },
  { cx: 9, cy: 19.5, fill: "#3DDC84", delay: "0.36s" },
  { cx: 16, cy: 19.5, fill: "#2CC7C0", delay: "0.48s" },
  { cx: 23, cy: 19.5, fill: "#4DA3FF", delay: "0.6s" },
];

/** Shared preloader — animated Searchify six-dot logo. Used by customer, partner, investor, admin. */
export default function SearchifyLoader({ full = false, label = "Loading" }) {
  const uid = useId().replace(/:/g, "");
  const glowId = `sf-loader-glow-${uid}`;

  return (
    <div className={`sf-mark-loader${full ? " is-full" : ""}`} role="status" aria-live="polite" aria-busy="true" aria-label={label}>
      <div className="sf-mark-loader-lockup">
        <svg className="sf-mark-loader-mark" viewBox="0 0 32 32" aria-hidden="true">
          <defs>
            <filter id={glowId} x="-120%" y="-120%" width="340%" height="340%">
              <feDropShadow dx="0" dy="0" stdDeviation="0.85" floodOpacity="0.95" floodColor="currentColor" />
            </filter>
          </defs>
          <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="#131519" stroke="#2E333B" strokeWidth="0.6" />
          {DOTS.map((dot) => (
            <circle
              key={dot.fill}
              className="sf-mark-dot"
              cx={dot.cx}
              cy={dot.cy}
              r="2.9"
              fill={dot.fill}
              style={{ color: dot.fill, animationDelay: dot.delay }}
              filter={`url(#${glowId})`}
            />
          ))}
        </svg>
        <span className="sf-mark-loader-label sr-only">{label}</span>
      </div>
    </div>
  );
}
