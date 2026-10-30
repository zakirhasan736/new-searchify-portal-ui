import "./searchify-loader.css";

const DOTS = [
  { cx: 9, cy: 12.5, fill: "#FF5A4E", delay: "0s" },
  { cx: 16, cy: 12.5, fill: "#FF9F43", delay: "0.12s" },
  { cx: 23, cy: 12.5, fill: "#FFC53D", delay: "0.24s" },
  { cx: 9, cy: 19.5, fill: "#3DDC84", delay: "0.36s" },
  { cx: 16, cy: 19.5, fill: "#2CC7C0", delay: "0.48s" },
  { cx: 23, cy: 19.5, fill: "#4DA3FF", delay: "0.6s" },
];

/** Animated six-dot Searchify mark for loaders. `full` covers the viewport. */
export default function SearchifyLoader({ full = false, label = "Loading" }) {
  return (
    <div className={`sf-mark-loader${full ? " is-full" : ""}`} role="status" aria-live="polite" aria-busy="true">
      <div className="sf-mark-loader-lockup">
        <div className="sf-mark-loader-orbit" aria-hidden="true">
          <svg className="sf-mark-loader-mark" viewBox="0 0 32 32">
            <defs>
              <filter id="sf-loader-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feDropShadow dx="0" dy="0" stdDeviation="0.7" floodOpacity="0.95" floodColor="currentColor" />
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
                filter="url(#sf-loader-glow)"
              />
            ))}
          </svg>
        </div>
        <span className="sf-mark-loader-word">searchify</span>
        <span className="sf-mark-loader-label">{label}</span>
      </div>
    </div>
  );
}
