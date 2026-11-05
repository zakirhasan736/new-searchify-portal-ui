"use client";

import "./searchify-loader.css";

const DOTS = [
  { cx: 144, cy: 200, fill: "#FF5A4E", delay: "0s" },
  { cx: 256, cy: 200, fill: "#FF9F43", delay: "0.14s" },
  { cx: 368, cy: 200, fill: "#FFC53D", delay: "0.28s" },
  { cx: 144, cy: 312, fill: "#3DDC84", delay: "0.42s" },
  { cx: 256, cy: 312, fill: "#2CC7C0", delay: "0.56s" },
  { cx: 368, cy: 312, fill: "#4DA3FF", delay: "0.7s" },
];

/** Shared preloader — crisp six-dot mark (same geometry as searchify-mark-512). */
export default function SearchifyLoader({ full = false, label = "Loading" }) {
  return (
    <div className={`sf-mark-loader${full ? " is-full" : ""}`} role="status" aria-live="polite" aria-busy="true" aria-label={label}>
      <div className="sf-mark-loader-lockup">
        <svg className="sf-mark-loader-mark" viewBox="0 0 512 512" width="512" height="512" aria-hidden="true" shapeRendering="geometricPrecision">
          <rect x="8" y="8" width="496" height="496" rx="112" fill="#131519" stroke="#2E333B" strokeWidth="3" />
          {DOTS.map((dot) => (
            <circle key={dot.fill} className="sf-mark-dot" cx={dot.cx} cy={dot.cy} r="46" fill={dot.fill} style={{ animationDelay: dot.delay }} />
          ))}
        </svg>
        <span className="sf-mark-loader-label sr-only">{label}</span>
      </div>
    </div>
  );
}
