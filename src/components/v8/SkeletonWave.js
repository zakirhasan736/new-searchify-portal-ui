import "./skeleton-wave.css";

export function Skel({ w = "100%", h = 12, radius = 10, light = false, style }) {
  return (
    <span
      className={`v8-skel${light ? " is-light" : ""}`}
      style={{ width: w, height: h, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonCard({ lines = 3, light = false }) {
  return (
    <div className={`v8-skel-card${light ? " is-light" : ""}`} aria-hidden="true">
      <Skel w="42%" h={14} light={light} />
      <Skel w="86%" h={18} radius={12} light={light} />
      {Array.from({ length: lines }).map((_, index) => (
        <Skel key={index} w={index === lines - 1 ? "62%" : "100%"} h={12} light={light} />
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 3, lines = 3, light = false }) {
  return (
    <div className="v8-skel-grid" role="status" aria-live="polite" aria-busy="true">
      <span className="v8-skel-sr">Loading</span>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} lines={lines} light={light} />
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 5 }) {
  return (
    <div className="v8-skel-rows" role="status" aria-live="polite" aria-busy="true">
      <span className="v8-skel-sr">Loading</span>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="v8-skel-row">
          <Skel w={36} h={36} radius={999} />
          <div className="v8-skel-row-copy">
            <Skel w="44%" h={14} />
            <Skel w="72%" h={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SkeletonPage() {
  return (
    <div className="v8-skel-page" role="status" aria-live="polite" aria-busy="true">
      <span className="v8-skel-sr">Loading this page</span>
      <Skel w={128} h={14} />
      <Skel w="min(560px, 86%)" h={40} radius={14} />
      <Skel w="min(380px, 64%)" h={14} />
      <div className="v8-skel-stats">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="v8-skel-card">
            <Skel w="48%" h={12} />
            <Skel w="64%" h={26} radius={12} />
          </div>
        ))}
      </div>
      <SkeletonCards count={3} lines={3} />
    </div>
  );
}
