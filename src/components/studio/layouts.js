const MODE = {
  "website-overview": "dashboard",
  "seo-dashboard": "google-dash",
  "domain-snapshot": "google-dash",
  "visibility-overview": "google-dash",
  "traffic-home": "ga4-overview",
  "traffic-analytics": "ga4-overview",
  "traffic-distribution": "ga4-channels",
  "market-overview": "share",
  "ai-traffic": "share",
  "organic-social": "share",
  "paid-search": "keywords",
  "keyword-gap": "gap",
  "competitor-research": "gap",
  "competitor-monitoring": "gap",
  "local-competitors": "places",
  "local-dashboard": "google-dash",
  "keyword-manager": "lists",
  "position-tracking": "ranks",
  "local-map-ranks": "ranks",
  "keyword-ranking": "keywords",
  "website-keywords": "gsc-queries",
  "generate-keywords": "keywords",
  "keyword-analyze": "keywords",
  "keyword-metrics": "keywords",
  "organic-research": "gsc-queries",
  "organic-search": "gsc-queries",
  "top-pages": "gsc-pages",
  "ga4-landing-pages": "ga4-landings",
  "gsc-countries": "gsc-geo",
  "gsc-devices": "gsc-device",
  referral: "ga4-referral",
  "topic-research": "keywords",
  "topic-finder": "keywords",
  "brand-questions": "ai",
  "brand-performance": "domain",
  "brand-perception": "share",
  "brand-narrative": "share",
  "backlink-analytics": "links",
  backlinks: "links",
  "referring-domains": "links",
  "link-building": "pipeline",
  "backlink-audit": "audit",
  "site-audit": "pagespeed",
  "on-page-seo": "pagespeed",
  "ai-search-audit": "audit",
  "local-gbp": "checklist",
  "local-automations": "pipeline",
  "local-listings": "pipeline",
  "local-reviews": "pipeline",
  "local-ai-agent": "pipeline",
  "local-map-ranks": "ranks",
  "ai-search": "ai",
  "ai-visibility-report": "ai",
  "ai-analysis": "ai",
  "prompt-research": "ai",
  "prompt-tracking": "ai",
  "get-started": "checklist",
  "google-services": "hub",
  "content-dashboard": "pipeline",
  "my-content": "pipeline",
  "content-creation": "pipeline",
  "content-repurposing": "pipeline",
  "seo-writing": "editor",
  "seo-content-template": "editor",
  "ai-article": "editor",
  "content-optimizer": "editor",
  "seo-brief": "editor",
};

import { StudioPanels } from "@/components/studio/charts";

function valueOf(row, index) {
  return row[index] || "—";
}

function shareWidth(value, max) {
  const number = parseFloat(String(value).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(number) || !max) return 8;
  return Math.max(8, Math.min(100, (number / max) * 100));
}

function TablePanels({ panels }) {
  if (!Array.isArray(panels) || !panels.length) return null;
  return (
    <div className="mt-6 grid gap-4">
      {panels.map((panel) => (
        <article key={panel.title || panel.columns?.join("-")} className="overflow-hidden rounded-2xl border border-line bg-panel">
          <div className="border-b border-white/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">{panel.title || "Panel"}</p>
          </div>
          <div className="studio-scroll overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.08em] text-white/40">
                <tr>
                  {(panel.columns || []).map((column) => (
                    <th key={column} className="px-4 py-2 font-medium">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(panel.rows || []).map((row, index) => (
                  <tr key={index} className="border-t border-white/5">
                    {(panel.columns || []).map((_, cell) => (
                      <td key={cell} className="px-4 py-2.5">
                        {row[cell] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ))}
    </div>
  );
}

function KpiStrip({ kpis }) {
  if (!Array.isArray(kpis) || !kpis.length) return null;
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <article key={kpi[0]} className="rounded-2xl border border-line bg-panel p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-white/45">{kpi[0]}</p>
          <p className="mt-2 font-sans text-2xl font-semibold text-brand">{kpi[1]}</p>
        </article>
      ))}
    </div>
  );
}

export function ServiceLayout({ kind, columns, rows, panels, kpis, tablePanels }) {
  const mode = MODE[kind] || "keywords";
  const chartPanels = Array.isArray(panels) ? null : panels;
  const extraTables = tablePanels || (Array.isArray(panels) ? panels : null);
  const autoTrend =
    !chartPanels?.trend && (mode === "ga4-overview" || mode === "gsc-queries")
      ? rows.slice(0, 12).map((row, index) => [String(row[0]).slice(0, 16), Number(String(row[1] || index + 1).replace(/[^0-9.]/g, "")) || index + 1])
      : null;
  const mergedPanels = chartPanels || autoTrend ? { ...(chartPanels || {}), ...(autoTrend ? { trend: autoTrend, trendLabels: [columns[1] || "Value"] } : {}) } : null;
  const visuals = mergedPanels ? <StudioPanels panels={mergedPanels} /> : null;
  const extras = (
    <>
      <KpiStrip kpis={kpis} />
      <TablePanels panels={extraTables} />
    </>
  );
  if (!rows.length)
    return (
      <>
        {visuals}
        {extras}
      </>
    );

  if (mode === "hub") {
    return (
      <>
        {extras}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <article key={`${row[0]}-${row[1]}`} className="rounded-2xl border border-line bg-panel p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.12em] text-white/45">{row[0]}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase ${/connected|synced|on/i.test(String(row[1])) ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/50"}`}>
                  {row[1]}
                </span>
              </div>
              <p className="mt-3 text-sm text-white/70">{row[2] || "—"}</p>
              {row[3] ? <p className="mt-1 text-xs text-white/35">{row[3]}</p> : null}
            </article>
          ))}
        </div>
      </>
    );
  }

  if (mode === "gsc-queries") {
    const top = rows.slice(0, 6);
    return (
      <>
        {visuals}
        {extras}
        <div className="mt-6 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-line bg-panel p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-brand">Top queries · clicks</p>
            <ul className="mt-4 space-y-3">
              {top.map((row) => (
                <li key={row[0]} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{row[0]}</span>
                  <span className="shrink-0 font-semibold text-brand">{row[1]}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl border border-line bg-panel p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-white/45">Position snapshot</p>
            <div className="mt-4 grid gap-3">
              {top.slice(0, 4).map((row) => (
                <div key={`pos-${row[0]}`} className="rounded-xl bg-white/5 px-3 py-2">
                  <p className="truncate text-sm">{row[0]}</p>
                  <p className="mt-1 text-xs text-white/50">
                    Pos {row[4] || "—"} · CTR {row[3] || "—"}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </>
    );
  }

  if (mode === "gsc-pages" || mode === "ga4-landings") {
    const max = Math.max(...rows.map((row) => parseFloat(String(row[1])) || 0), 1);
    return (
      <>
        {visuals}
        {extras}
        <div className="mt-6 grid gap-3">
          {rows.slice(0, 8).map((row) => (
            <article key={row[0]} className="rounded-2xl border border-line bg-panel px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="max-w-[70%] truncate font-medium">{row[0]}</span>
                <span className="text-brand">{row[1]} {mode === "ga4-landings" ? "sessions" : "clicks"}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="bar-grow h-full rounded-full bg-gradient-to-r from-blush to-brand" style={{ width: `${shareWidth(row[1], max)}%` }} />
              </div>
              <p className="mt-2 text-xs text-white/45">{row.slice(2).join(" · ")}</p>
            </article>
          ))}
        </div>
      </>
    );
  }

  if (mode === "gsc-geo") {
    const max = Math.max(...rows.map((row) => parseFloat(String(row[1])) || 0), 1);
    return (
      <>
        {visuals}
        {extras}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <article key={row[0]} className="rounded-2xl border border-line bg-panel p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{row[0]}</p>
                <p className="text-brand">{row[1]} clicks</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="bar-grow h-full rounded-full bg-brand" style={{ width: `${shareWidth(row[1], max)}%` }} />
              </div>
              <p className="mt-2 text-xs text-white/45">
                {row[2]} impr · {row[3]} CTR · pos {row[4]}
              </p>
            </article>
          ))}
        </div>
      </>
    );
  }

  if (mode === "gsc-device") {
    const max = Math.max(...rows.map((row) => parseFloat(String(row[1])) || 0), 1);
    return (
      <>
        {visuals}
        {extras}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {rows.map((row) => (
            <article key={row[0]} className="rounded-2xl border border-line bg-panel p-5 text-center">
              <p className="text-xs uppercase tracking-[0.12em] text-white/45">{row[0]}</p>
              <p className="mt-3 font-sans text-3xl font-semibold text-brand">{row[1]}</p>
              <p className="mt-1 text-xs text-white/50">clicks</p>
              <div className="mx-auto mt-3 h-2 w-24 overflow-hidden rounded-full bg-white/10">
                <div className="bar-grow h-full rounded-full bg-blush" style={{ width: `${shareWidth(row[1], max)}%` }} />
              </div>
              <p className="mt-3 text-xs text-white/40">{row[3]} CTR · pos {row[4]}</p>
            </article>
          ))}
        </div>
      </>
    );
  }

  if (mode === "ga4-overview") {
    const max = Math.max(...rows.map((row) => parseFloat(String(row[1])) || 0), 1);
    return (
      <>
        {visuals}
        {extras}
        <div className="mt-6 rounded-2xl border border-line bg-panel p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-brand">Daily sessions</p>
          <div className="mt-4 flex items-end gap-1.5 overflow-x-auto pb-1">
            {rows.slice(-21).map((row) => (
              <div key={row[0]} className="flex min-w-[18px] flex-1 flex-col items-center justify-end">
                <div
                  className="bar-rise w-full rounded-t-md bg-gradient-to-t from-blush to-brand"
                  style={{ height: `${20 + Math.round((shareWidth(row[1], max) / 100) * 100)}px` }}
                />
                <span className="mt-1 text-[9px] text-white/35">{String(row[0]).slice(-5)}</span>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (mode === "ga4-channels" || mode === "ga4-referral") {
    const max = Math.max(...rows.map((row) => parseFloat(String(row[1])) || 0), 1);
    return (
      <>
        {visuals}
        {extras}
        <div className="mt-6 grid gap-3">
          {rows.map((row) => (
            <div key={row[0]} className="rounded-2xl border border-line bg-panel px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span>{row[0]}</span>
                <span className="text-brand">{row[1]} sessions</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="bar-grow h-full rounded-full bg-gradient-to-r from-blush to-brand" style={{ width: `${shareWidth(row[1], max)}%` }} />
              </div>
              {row.length > 2 ? <p className="mt-2 text-xs text-white/40">{row.slice(2).join(" · ")}</p> : null}
            </div>
          ))}
        </div>
      </>
    );
  }

  if (mode === "pagespeed") {
    const strategyStyle = columns.length >= 4;
    return (
      <>
        {visuals}
        {extras}
        {strategyStyle ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {rows.map((row) => (
              <article key={row[0]} className="rounded-2xl border border-line bg-panel p-5">
                <p className="text-xs uppercase tracking-[0.12em] text-white/45">{row[0]}</p>
                <div className="mt-4 flex flex-wrap gap-4">
                  <div>
                    <p className="text-[10px] uppercase text-white/40">Performance</p>
                    <p className="font-sans text-3xl font-semibold text-brand">{row[1]}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-white/40">{columns[2] || "SEO"}</p>
                    <p className="font-sans text-2xl font-semibold">{row[2]}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-white/50">{row.slice(3).join(" · ")}</p>
              </article>
            ))}
          </div>
        ) : (
          <ul className="mt-6 grid gap-3">
            {rows.map((row) => (
              <li key={row[0]} className="flex items-center justify-between rounded-2xl border border-line bg-panel px-4 py-3">
                <span>{row[0]}</span>
                <span className="rounded-full bg-brand/20 px-3 py-1 text-sm text-brand">{row[1]}</span>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }

  if (mode === "places") {
    return (
      <>
        {visuals}
        {extras}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {rows.slice(0, 8).map((row) => (
            <article key={`${row[0]}-${row[1]}`} className="rounded-2xl border border-line bg-panel p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-sans text-lg font-semibold leading-snug">{row[0]}</h3>
                <span className="shrink-0 rounded-full bg-brand/20 px-2.5 py-1 text-xs text-brand">{row[2]} ★</span>
              </div>
              <p className="mt-2 text-sm text-white/55">{row[1]}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/45">
                <span>{row[3]} reviews</span>
                {row[4] ? <span className="truncate text-brand">{row[4]}</span> : null}
              </div>
            </article>
          ))}
        </div>
      </>
    );
  }

  if (mode === "google-dash") {
    return (
      <>
        {visuals}
        {extras}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rows.slice(0, 8).map((row) => (
            <article key={`${row[0]}-${row[1]}`} className="rounded-2xl border border-line bg-panel p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-white/45">{row[0]}</p>
              <p className="mt-3 font-sans text-2xl font-semibold">{row[2] || row[1]}</p>
              <p className="mt-1 text-xs text-white/40">{row[3] || row[1]}</p>
            </article>
          ))}
        </div>
      </>
    );
  }

  if (mode === "dashboard" || mode === "domain") {
    const lead = rows[0];
    return (
      <>
      {visuals}
      {extras}
      <div className="mt-6 grid gap-3 lg:grid-cols-4">
        <article className="rounded-2xl border border-line bg-panel p-5 lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.12em] text-white/45">{columns[0]}</p>
          <p className="mt-3 font-sans text-4xl font-semibold">{valueOf(lead, 1)}</p>
          <p className="mt-2 text-sm text-white/60">{lead[0]}</p>
        </article>
        {rows.slice(1, 4).map((row) => (
          <article key={row[0]} className="rounded-2xl border border-line bg-panel p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-white/45">{row[0]}</p>
            <p className="mt-3 font-sans text-2xl font-semibold">{valueOf(row, 1)}</p>
          </article>
        ))}
      </div>
      </>
    );
  }

  if (mode === "traffic") {
    const max = Math.max(...rows.map((row) => parseFloat(row[1]) || 0), 1);
    return (
      <>
        {visuals}
        {extras}
        <div className="mt-6 rounded-2xl border border-line bg-panel p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-brand">Sessions</p>
        <div className="mt-4 flex items-end gap-3">
          {rows.map((row) => (
            <div key={row[0]} className="flex flex-1 flex-col justify-end">
              <div
                className="bar-rise w-full rounded-t-lg bg-gradient-to-t from-blush to-brand"
                style={{ height: `${24 + Math.round((shareWidth(row[1], max) / 100) * 96)}px` }}
              />
              <span className="mt-2 text-center text-[10px] text-white/45">{String(row[0]).slice(5)}</span>
            </div>
          ))}
        </div>
        </div>
      </>
    );
  }

  if (mode === "share") {
    const max = Math.max(...rows.map((row) => parseFloat(String(row[1]).replace("%", "")) || 0), 1);
    return (
      <>
        {visuals}
        {extras}
        <div className="mt-6 grid gap-3">
        {rows.map((row) => (
          <div key={row[0]} className="rounded-2xl border border-line bg-panel px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span>{row[0]}</span>
              <span className="text-brand">{row[1]}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="bar-grow h-full rounded-full bg-gradient-to-r from-blush to-brand" style={{ width: `${shareWidth(row[1], max)}%` }} />
            </div>
          </div>
        ))}
        </div>
      </>
    );
  }

  if (mode === "gap") {
    const rivals = [...new Set(rows.map((row) => row[1]).filter(Boolean))];
    return (
      <>
        {visuals}
        {extras}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-line bg-panel p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/45">Missing keywords</p>
          <p className="mt-2 font-sans text-3xl font-semibold">{rows.length}</p>
        </article>
        <article className="rounded-2xl border border-line bg-panel p-5 sm:col-span-2">
          <p className="text-xs uppercase tracking-[0.12em] text-white/45">Compared with</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {rivals.map((rival) => (
              <span key={rival} className="rounded-full bg-brand/20 px-3 py-1 text-sm">{rival}</span>
            ))}
          </div>
        </article>
        </div>
      </>
    );
  }

  if (mode === "ranks") {
    return (
      <>
        {visuals}
        {extras}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {rows.slice(0, 3).map((row) => {
          const change = String(row[2] || "0");
          const up = change.startsWith("+");
          return (
            <article key={row[0]} className="rounded-2xl border border-line bg-panel p-5">
              <p className="text-sm text-white/70">{row[0]}</p>
              <p className="mt-2 font-sans text-3xl font-semibold">{row[1]}</p>
              <p className={`mt-1 text-sm ${up ? "text-emerald-300" : change.startsWith("-") ? "text-rose-300" : "text-white/50"}`}>{change}</p>
            </article>
          );
        })}
        </div>
      </>
    );
  }

  if (mode === "links") {
    return (
      <>
        {visuals}
        {extras}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-line bg-panel p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/45">Backlinks</p>
          <p className="mt-2 font-sans text-3xl font-semibold">{rows.length}</p>
        </article>
        <article className="rounded-2xl border border-line bg-panel p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/45">Referring domains</p>
          <p className="mt-2 font-sans text-3xl font-semibold">{new Set(rows.map((row) => String(row[0]).split("/")[0])).size}</p>
        </article>
        <article className="rounded-2xl border border-line bg-panel p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/45">Anchors</p>
          <p className="mt-2 font-sans text-3xl font-semibold">{new Set(rows.map((row) => row[2])).size}</p>
        </article>
        </div>
      </>
    );
  }

  if (mode === "audit") {
    return (
      <>
        {visuals}
        {extras}
        <ul className="mt-6 grid gap-3">
        {rows.map((row) => {
          const text = row.join(" ").toLowerCase();
          const passed = /present|ready|passed/.test(text);
          const warn = /review|pending|slow|missing/.test(text);
          return (
            <li key={row[0]} className="flex items-center justify-between rounded-2xl border border-line bg-panel px-4 py-3">
              <span>{row[0]}</span>
              <span className={`rounded-full px-3 py-1 text-xs ${/error|missing|broken/.test(String(row[1]).toLowerCase() + text) ? "bg-rose-400/15 text-rose-200" : /warning|slow|redirect/.test(String(row[1]).toLowerCase() + text) ? "bg-amber-300/15 text-amber-100" : passed ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/70"}`}>
                {row.length > 2 ? `${row[1]} · ${row[2]}` : row[1] || "Open"}
              </span>
            </li>
          );
        })}
      </ul>
      </>
    );
  }

  if (mode === "ai") {
    return (
      <>
        {visuals}
        {extras}
        <div className="mt-6 grid gap-3">
        {rows.map((row) => (
          <article key={row[0]} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel px-4 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-white/40">Prompt</p>
              <p className="mt-1">{row[0]}</p>
            </div>
            <span className="rounded-full bg-brand/20 px-3 py-1 text-sm">{row[1] || "Stored"}</span>
          </article>
        ))}
      </div>
      </>
    );
  }

  if (mode === "checklist") {
    return (
      <>
        {visuals}
        {extras}
        <ol className="mt-6 grid gap-3">
        {rows.map((row, index) => (
          <li key={`${row[0]}-${row[1]}-${index}`} className="flex items-center gap-4 rounded-2xl border border-line bg-panel px-4 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-sm">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{row[1] || row[0]}</p>
              <p className="text-sm text-white/55">{row.length > 3 ? `${row[2]} · ${row[3]}` : row[2] || row[0]}</p>
            </div>
            {row[2] ? (
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] uppercase ${/connected|synced|done|on/i.test(String(row[2])) ? "bg-emerald-400/15 text-emerald-200" : /error|skip/i.test(String(row[2])) ? "bg-amber-300/15 text-amber-100" : "bg-white/10 text-white/50"}`}>
                {row[2]}
              </span>
            ) : null}
          </li>
        ))}
        </ol>
      </>
    );
  }

  if (mode === "pipeline" || mode === "lists") {
    return (
      <>
        {visuals}
        {extras}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <article key={row.join("-")} className="rounded-2xl border border-line bg-panel p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-brand">{row[row.length - 1]}</p>
            <h2 className="mt-2 font-sans text-xl">{row[0]}</h2>
            {row.length > 2 ? <p className="mt-2 text-sm text-white/60">{row.slice(1, -1).join(" · ")}</p> : null}
          </article>
        ))}
        </div>
      </>
    );
  }

  if (mode === "editor") {
    const row = rows[0];
    return (
      <>
        {visuals}
        {extras}
        <div className="mt-6 grid gap-3 lg:grid-cols-[1.4fr_0.8fr]">
        <article className="rounded-2xl border border-line bg-panel p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/45">Draft</p>
          <h2 className="mt-2 font-sans text-2xl">{row[0]}</h2>
          <p className="mt-3 text-sm leading-6 text-white/65">A person still reviews this before it is published. The brief and keyword rows stay stored on the project.</p>
        </article>
        <article className="rounded-2xl border border-line bg-panel p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/45">Status</p>
          <p className="mt-2 text-lg">{row[1]}</p>
        </article>
        </div>
      </>
    );
  }

  return (
    <>
      {visuals}
      {extras}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
      {rows.slice(0, 3).map((row) => (
        <article key={row[0]} className="rounded-2xl border border-line bg-panel p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/45">{columns[0]}</p>
          <h2 className="mt-2 font-sans text-xl">{row[0]}</h2>
          <p className="mt-2 text-sm text-white/65">{row.slice(1).join(" · ")}</p>
        </article>
      ))}
    </div>
    </>
  );
}
