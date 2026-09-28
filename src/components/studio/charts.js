function maxOf(series, index) {
  return Math.max(...series.map((point) => Number(point[index]) || 0), 1);
}

function AreaChart({ points, labels }) {
  if (!points?.length) return null;
  const width = 640;
  const height = 180;
  const left = maxOf(points, 1);
  const right = points[0].length > 2 ? maxOf(points, 2) : 0;
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const line = (index, max) =>
    points
      .map((point, i) => {
        const y = height - 16 - ((Number(point[index]) || 0) / max) * (height - 32);
        return `${i === 0 ? "M" : "L"} ${i * step} ${y}`;
      })
      .join(" ");
  const area = `${line(1, left)} L ${width} ${height} L 0 ${height} Z`;
  return (
    <article className="rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.12em] text-white/45">Trend</p>
        <div className="flex gap-3 text-xs text-white/60">
          <span className="text-brand">{labels?.[0] || "Series"}</span>
          {labels?.[1] ? <span className="text-blush">{labels[1]}</span> : null}
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-44 w-full">
        <path d={area} fill="rgba(146,107,255,0.18)" />
        <path d={line(1, left)} fill="none" stroke="#926BFF" strokeWidth="3" className="chart-line" pathLength="1" />
        {right ? <path d={line(2, right)} fill="none" stroke="#E85782" strokeWidth="3" className="chart-line" pathLength="1" /> : null}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-white/40">
        {points.map((point) => (
          <span key={point[0]}>{point[0]}</span>
        ))}
      </div>
    </article>
  );
}

function Countries({ rows }) {
  if (!rows?.length) return null;
  const max = Math.max(...rows.map((row) => parseFloat(String(row[1])) || 0), 1);
  return (
    <article className="rounded-2xl border border-line bg-panel p-5">
      <p className="text-xs uppercase tracking-[0.12em] text-white/45">Top countries</p>
      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row[0]}>
            <div className="flex items-center justify-between text-sm">
              <span>{row[0]}</span>
              <span className="text-white/60">{row[2] ? `${row[1]} · ${row[2]}` : row[1]}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="bar-grow h-full rounded-full bg-gradient-to-r from-blush to-brand" style={{ width: `${Math.max(8, (parseFloat(row[1]) / max) * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Devices({ rows }) {
  if (!rows?.length) return null;
  return (
    <article className="rounded-2xl border border-line bg-panel p-5">
      <p className="text-xs uppercase tracking-[0.12em] text-white/45">Devices</p>
      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row[0]} className="flex items-center justify-between text-sm">
            <span>{row[0]}</span>
            <span className="font-semibold text-brand">{row[1]}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Score({ value, label, audit }) {
  if (value == null) return null;
  const radius = 42;
  const dash = 2 * Math.PI * radius;
  const offset = dash - (Math.min(100, Number(value) || 0) / 100) * dash;
  return (
    <article className="rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="h-24 w-24">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#926BFF" strokeWidth="8" strokeDasharray={dash} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 50 50)" />
          <text x="50" y="56" textAnchor="middle" fill="white" fontSize="22" fontFamily="Poppins, sans-serif">{value}</text>
        </svg>
        <div>
          <p className="text-xs uppercase tracking-[0.12em] text-white/45">{label || "Score"}</p>
          <ul className="mt-2 space-y-1 text-sm text-white/70">
            {(audit || []).map((item) => (
              <li key={item[0]} className="flex justify-between gap-6">
                <span>{item[0]}</span>
                <span>{item[1]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function Kpis({ rows }) {
  if (!rows?.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {rows.map((row) => (
        <article key={row[0]} className="rounded-2xl border border-line bg-panel p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/45">{row[0]}</p>
          <p className="mt-2 font-sans text-2xl font-semibold">{row[1]}</p>
        </article>
      ))}
    </div>
  );
}

const HEAT = ["bg-white/5", "bg-brand/20", "bg-brand/40", "bg-brand/70", "bg-blush"];

function Heatmap({ rows, buckets }) {
  if (!rows?.length) return null;
  return (
    <article className="studio-scroll overflow-x-auto rounded-2xl border border-line bg-panel p-5">
      <p className="text-xs uppercase tracking-[0.12em] text-white/45">Ranking heatmap</p>
      <div className="mt-4 min-w-[520px]">
        <div className="grid grid-cols-[160px_repeat(5,1fr)] gap-2 text-[10px] uppercase tracking-[0.08em] text-white/40">
          <span />
          {(buckets || []).map((bucket) => (
            <span key={bucket} className="text-center">{bucket}</span>
          ))}
        </div>
        {rows.map((row) => (
          <div key={row[0]} className="mt-2 grid grid-cols-[160px_repeat(5,1fr)] items-center gap-2">
            <span className="truncate text-sm">{row[0]}</span>
            {(row[1] || []).map((cell, index) => (
              <span key={`${row[0]}-${index}`} className={`h-8 rounded-md ${HEAT[Math.max(0, Math.min(4, Number(cell) || 0))]}`} />
            ))}
          </div>
        ))}
      </div>
    </article>
  );
}

function Bars({ title, rows }) {
  if (!rows?.length) return null;
  const max = Math.max(...rows.map((row) => parseFloat(String(row[1])) || 0), 1);
  return (
    <article className="rounded-2xl border border-line bg-panel p-5">
      <p className="text-xs uppercase tracking-[0.12em] text-white/45">{title}</p>
      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row[0]}>
            <div className="flex justify-between text-sm">
              <span>{row[0]}</span>
              <span className="text-white/60">{row[1]}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="bar-grow h-full rounded-full bg-brand" style={{ width: `${Math.max(8, (parseFloat(row[1]) / max) * 100)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function StudioPanels({ panels }) {
  if (!panels) return null;
  return (
    <div className="mt-6 grid gap-3">
      {panels.kpis ? <Kpis rows={panels.kpis} /> : null}
      <div className="grid gap-3 xl:grid-cols-[1.4fr_0.8fr]">
        {panels.trend ? <AreaChart points={panels.trend} labels={panels.trendLabels} /> : null}
        {panels.score != null ? <Score value={panels.score} label={panels.scoreLabel} audit={panels.audit} /> : null}
        {panels.countries ? <Countries rows={panels.countries} /> : null}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {panels.devices ? <Devices rows={panels.devices} /> : null}
        {panels.anchors ? <Bars title="Anchors" rows={panels.anchors} /> : null}
        {panels.distribution ? <Bars title="Position distribution" rows={panels.distribution} /> : null}
        {panels.pages ? <Bars title="Top pages" rows={panels.pages} /> : null}
      </div>
      {panels.heatmap ? <Heatmap rows={panels.heatmap} buckets={panels.buckets} /> : null}
    </div>
  );
}
