"use client";

// Small charts for the keyword tracker. Plain SVG, same dark palette as the tracker.

export function Sparkline({ values, width = 72, height = 22, color = "#4DA3FF", label = "" }) {
  const nums = (values || []).map((v) => (v == null || Number.isNaN(Number(v)) ? null : Number(v)));
  const real = nums.filter((v) => v != null);
  if (real.length < 2) return <span style={{ color: "#7D848E" }}>—</span>;
  const max = Math.max(...real);
  const min = Math.min(...real);
  const span = max - min || 1;
  const step = width / Math.max(1, nums.length - 1);
  const pts = nums
    .map((v, i) => (v == null ? null : `${(i * step).toFixed(1)},${(height - 2 - ((v - min) / span) * (height - 4)).toFixed(1)}`))
    .filter(Boolean)
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label || "12-month search trend"}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function shortDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Daily Google position over time. #1 at the top. Days where the site was not in the top 100
 * sit on the bottom line as hollow dots.
 */
export function RankChart({ series, active = "desktop" }) {
  const W = 640;
  const H = 180;
  const PAD = { l: 40, r: 12, t: 12, b: 26 };
  const lines = Object.entries(series || {}).filter(([, s]) => (s?.history || []).length);
  const all = lines.flatMap(([, s]) => s.history);
  if (!all.length) return null;
  const dates = [...new Set(all.map((p) => p.date))].sort();
  const positions = all.map((p) => p.position).filter((p) => p != null);
  const worst = Math.max(10, ...positions.map(Number));
  const floor = Math.min(100, Math.ceil(worst / 10) * 10);
  const x = (date) => {
    const i = dates.indexOf(date);
    return PAD.l + (dates.length === 1 ? (W - PAD.l - PAD.r) / 2 : (i / (dates.length - 1)) * (W - PAD.l - PAD.r));
  };
  const y = (pos) => PAD.t + ((Math.min(pos ?? floor, floor) - 1) / Math.max(1, floor - 1)) * (H - PAD.t - PAD.b);
  const ticks = [1, Math.round(floor / 2), floor];
  const colors = { desktop: "#4DA3FF", mobile: "#C8A2FF" };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Google position over time" style={{ display: "block" }}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#1A1D22" strokeWidth="1" />
          <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#7D848E" fontFamily="'Geist Mono', monospace">
            #{t}
          </text>
        </g>
      ))}
      {lines.map(([device, s]) => {
        const on = device === active;
        const pts = s.history.filter((p) => p.position != null).map((p) => `${x(p.date).toFixed(1)},${y(p.position).toFixed(1)}`);
        return (
          <g key={device} opacity={on ? 1 : 0.35}>
            {pts.length > 1 ? (
              <polyline points={pts.join(" ")} fill="none" stroke={colors[device] || "#9AA1AB"} strokeWidth={on ? 2.2 : 1.5} strokeLinejoin="round" />
            ) : null}
            {s.history.map((p) => (
              <circle
                key={p.date}
                cx={x(p.date)}
                cy={y(p.position)}
                r={on ? 3.2 : 2.4}
                fill={p.position == null ? "#0A0B0D" : colors[device] || "#9AA1AB"}
                stroke={colors[device] || "#9AA1AB"}
                strokeWidth="1.4"
              >
                <title>{`${shortDate(p.date)} · ${device} · ${p.position == null ? "not in top 100" : `#${p.position}`}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
      <text x={PAD.l} y={H - 6} fontSize="11" fill="#7D848E">
        {shortDate(dates[0])}
      </text>
      {dates.length > 1 ? (
        <text x={W - PAD.r} y={H - 6} fontSize="11" fill="#7D848E" textAnchor="end">
          {shortDate(dates[dates.length - 1])}
        </text>
      ) : null}
    </svg>
  );
}
