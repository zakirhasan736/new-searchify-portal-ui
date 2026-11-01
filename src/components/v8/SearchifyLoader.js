import "./searchify-loader.css";

const DOTS = [
  { cx: 9, cy: 12.5, fill: "#FF5A4E", delay: "0s" },
  { cx: 16, cy: 12.5, fill: "#FF9F43", delay: "0.12s" },
  { cx: 23, cy: 12.5, fill: "#FFC53D", delay: "0.24s" },
  { cx: 9, cy: 19.5, fill: "#3DDC84", delay: "0.36s" },
  { cx: 16, cy: 19.5, fill: "#2CC7C0", delay: "0.48s" },
  { cx: 23, cy: 19.5, fill: "#4DA3FF", delay: "0.6s" },
];

/** Shared preloader — animated six dots only (no rounded tile). Used by customer, partner, investor, admin. */
export default function SearchifyLoader({ full = false, label = "Loading" }) {
  return (
    <div className={`sf-mark-loader${full ? " is-full" : ""}`} role="status" aria-live="polite" aria-busy="true" aria-label={label}>
      <div className="sf-mark-loader-lockup">
        <svg className="sf-mark-loader-mark" viewBox="0 0 32 32" aria-hidden="true">
          <defs>
            <filter id="sf-loader-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feDropShadow dx="0" dy="0" stdDeviation="0.7" floodOpacity="0.95" floodColor="currentColor" />
            </filter>
          </defs>
          {DOTS.map((dot) => (
            <circle
              key={dot.fill}
              className="sf-mark-dot"
              cx={dot.cx}
              cy={dot.cy}
              r="2.9"
              fill={dot.fill}
              style={{ color: dot.fill, animationDelay: dot.delay }}
              filter="url(#sf-loader-glow)"
            />
          ))}
        </svg>
        <span className="sf-mark-loader-label sr-only">{label}</span>
      </div>
    </div>
  );
}
