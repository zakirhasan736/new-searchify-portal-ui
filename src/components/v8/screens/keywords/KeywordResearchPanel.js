"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkline } from "./charts";

// One research panel under the tracker, in tabs, so the page stays calm:
// Suggested · Competitor gap · Your organic keywords · Cannibalization.

const FEATURE = {
  featured_snippet: "Snippet",
  local_pack: "Map pack",
  people_also_ask: "PAA",
  ai_overview: "AI overview",
  images: "Images",
  video: "Video",
  top_stories: "News",
  knowledge_graph: "Knowledge",
  shopping: "Shopping",
  popular_products: "Products",
  discussions_and_forums: "Forums",
};

const SUGGEST_FILTERS = [
  { id: "all", label: "All" },
  { id: "questions", label: "Questions" },
  { id: "longtail", label: "Long-tail" },
  { id: "related", label: "Related" },
  { id: "category", label: "Category" },
  { id: "site", label: "From your site" },
];

const PAGE = 50;

function num(n) {
  if (n == null || n === "" || Number.isNaN(Number(n))) return "—";
  return Math.round(Number(n)).toLocaleString("en-US");
}

function path(url) {
  if (!url) return "";
  try {
    return new URL(String(url).includes("://") ? url : `https://${url}`).pathname || "/";
  } catch {
    return String(url);
  }
}

function spot(n) {
  return n == null || n === "" ? "—" : `#${Math.round(Number(n))}`;
}

function Chip({ on, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={on ? "true" : "false"}
      onClick={onClick}
      style={{
        minHeight: "32px",
        padding: "0 12px",
        borderRadius: "999px",
        border: on ? "1px solid #F2F4F5" : "1px solid #262A31",
        background: on ? "#F2F4F5" : "transparent",
        color: on ? "#0A0B0D" : "#D7DADE",
        fontSize: "13px",
        fontWeight: on ? 600 : 400,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function Pill({ children, tone = "green" }) {
  const tones = {
    green: ["#3DDC84", "rgba(61,220,132,.12)"],
    blue: ["#4DA3FF", "rgba(77,163,255,.12)"],
    gray: ["#9AA1AB", "#1A1D22"],
    amber: ["#FFB547", "rgba(255,181,71,.12)"],
  };
  const [c, bg] = tones[tone] || tones.gray;
  return (
    <span style={{ marginLeft: "6px", fontSize: "11px", padding: "2px 7px", borderRadius: "8px", color: c, background: bg, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div style={{ flex: "1 1 130px", minWidth: 0, borderRadius: "14px", background: "#0E1013", border: "1px solid #1A1D22", padding: "12px 14px" }}>
      <div style={{ fontSize: "12px", color: "#7D848E" }}>{label}</div>
      <div style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "24px", fontWeight: 700, lineHeight: 1.15 }}>{value}</div>
      {hint ? <div style={{ fontSize: "11px", color: "#7D848E" }}>{hint}</div> : null}
    </div>
  );
}

function TrackButton({ row, tracking, tracked, onTrack, extra, primary = true, label }) {
  const key = String(row.keyword || "").toLowerCase();
  if (tracked.has(key)) return <span style={{ fontSize: "12px", color: "#3DDC84" }}>Tracked</span>;
  const busy = tracking === key;
  return (
    <button
      type="button"
      disabled={Boolean(tracking)}
      onClick={() => onTrack(row.keyword, extra)}
      style={{ ...(primary ? S.primary : S.ghost), opacity: tracking && !busy ? 0.6 : 1 }}
    >
      {busy ? "Working…" : label}
    </button>
  );
}

function Volume({ row, local }) {
  return (
    <>
      {num(row.volume)}
      {local?.available && row.localVolume != null ? (
        <div style={{ fontSize: "11px", color: "#7D848E", whiteSpace: "nowrap" }}>
          {num(row.localVolume)} in {String(local.location).split(",")[0]}
        </div>
      ) : null}
    </>
  );
}

export default function KeywordResearchPanel({
  suggestions = [],
  current = [],
  organicSummary = null,
  cannibalization = [],
  competitors = [],
  localVolume = null,
  business = null,
  suggestMeta = null,
  scConnected = false,
  hostname = "",
  trackedTerms = new Set(),
  tracking = "",
  onTrack,
  onRefresh,
  onReadSite,
  reading = false,
}) {
  const [tab, setTab] = useState("suggested");
  const [filter, setFilter] = useState("all");
  const [rival, setRival] = useState("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);

  const gapRows = useMemo(() => suggestions.filter((r) => r.gapDomain), [suggestions]);
  const suggested = useMemo(() => {
    const rows = suggestions.filter((r) => r.kind !== "gap");
    if (filter === "all") return rows;
    if (filter === "questions") return rows.filter((r) => r.question);
    return rows.filter((r) => r.kind === filter);
  }, [suggestions, filter]);
  const gap = useMemo(() => (rival === "all" ? gapRows : gapRows.filter((r) => r.gapDomain === rival)), [gapRows, rival]);
  const organic = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? current.filter((r) => String(r.keyword).toLowerCase().includes(q)) : current;
  }, [current, query]);
  const counts = useMemo(() => {
    const out = { all: 0, questions: 0 };
    suggestions.forEach((r) => {
      if (r.kind === "gap") return;
      out.all += 1;
      if (r.question) out.questions += 1;
      out[r.kind] = (out[r.kind] || 0) + 1;
    });
    return out;
  }, [suggestions]);

  const tabs = [
    { id: "suggested", label: "Suggested", n: counts.all },
    { id: "gap", label: "Competitor gap", n: gapRows.length },
    { id: "organic", label: "Your organic keywords", n: organicSummary?.keywords ?? current.length },
    ...(cannibalization.length ? [{ id: "cannibal", label: "Cannibalization", n: cannibalization.length }] : []),
  ];

  return (
    <section aria-labelledby="research-h" style={S.panel}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
          <h2 id="research-h" style={S.h2}>
            Keyword research
          </h2>
          <span style={{ fontSize: "13px", color: "#9AA1AB", lineHeight: 1.45 }}>
            {business?.category
              ? `DataForSEO data, kept only where it fits what ${business.brand || hostname || "this site"} sells — ${business.category}.`
              : "DataForSEO data for this website."}
            {suggestMeta?.judged === "ai" ? " Checked against the AI read of every page." : ""}
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button type="button" onClick={onRefresh} style={S.ghost}>
            Refresh from DataForSEO
          </button>
          <button type="button" onClick={onReadSite} disabled={reading} style={S.ghost}>
            {reading ? "Reading website…" : "Re-read website"}
          </button>
        </div>
      </div>

      {business?.error ? <p style={{ margin: 0, fontSize: 14, color: "#FF5A4E" }}>{business.error}</p> : null}
      {suggestMeta?.needsSiteScan ? (
        <p style={{ margin: 0, fontSize: 14, color: "#D7DADE", lineHeight: 1.45 }}>
          The website has not been read yet, so suggestions come straight from DataForSEO without a business check. Use “Re-read
          website” to match them to what the business sells.
        </p>
      ) : null}

      <div role="tablist" aria-label="Keyword research" style={{ display: "flex", gap: "4px", borderBottom: "1px solid #1A1D22", overflowX: "auto" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id ? "true" : "false"}
            onClick={() => {
              setTab(t.id);
              setShown(PAGE);
            }}
            style={{
              padding: "10px 12px",
              border: 0,
              borderBottom: tab === t.id ? "2px solid #4DA3FF" : "2px solid transparent",
              background: "none",
              color: tab === t.id ? "#F2F4F5" : "#9AA1AB",
              fontSize: "14px",
              fontWeight: tab === t.id ? 600 : 400,
              whiteSpace: "nowrap",
            }}
          >
            {t.label} <span style={{ color: "#7D848E", fontWeight: 400 }}>{num(t.n)}</span>
          </button>
        ))}
      </div>

      {tab === "suggested" ? (
        <>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {SUGGEST_FILTERS.filter((f) => f.id === "all" || counts[f.id]).map((f) => (
              <Chip key={f.id} on={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label} · {counts[f.id] || 0}
              </Chip>
            ))}
          </div>
          {suggested.length ? (
            <div style={S.scroll}>
              <table style={S.table}>
                <thead>
                  <tr style={S.headRow}>
                    <th style={S.th}>KEYWORD</th>
                    <th style={S.th}>PART OF THE BUSINESS · PAGE</th>
                    <th style={{ ...S.th, textAlign: "right" }}>SEARCHES/MO</th>
                    <th style={S.th}>12 MONTHS</th>
                    <th style={{ ...S.th, textAlign: "right" }}>DIFFICULTY</th>
                    <th style={S.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {suggested.slice(0, shown).map((row) => {
                    const page = path(row.page);
                    return (
                      <tr key={row.keyword} style={S.row}>
                        <td style={S.td}>
                          <span style={{ fontWeight: 600 }}>{row.keyword}</span>
                          {row.fit === "core" ? <Pill>core</Pill> : null}
                          {row.question ? <Pill tone="blue">question</Pill> : null}
                          {row.gapDomain ? <Pill tone="amber">{row.gapDomain} ranks</Pill> : null}
                        </td>
                        <td style={{ ...S.td, color: "#9AA1AB" }}>
                          {row.concept || "—"}
                          <div style={S.mono}>{page || "no page covers this yet"}</div>
                        </td>
                        <td style={{ ...S.td, textAlign: "right" }}>
                          <Volume row={row} local={localVolume} />
                        </td>
                        <td style={S.td}>
                          <Sparkline values={row.trend} />
                        </td>
                        <td style={{ ...S.td, textAlign: "right" }}>{num(row.difficulty)}</td>
                        <td style={{ ...S.td, textAlign: "right", whiteSpace: "nowrap" }}>
                          <TrackButton
                            row={row}
                            tracking={tracking}
                            tracked={trackedTerms}
                            onTrack={onTrack}
                            extra={{ page: row.page, concept: row.concept, source: "suggestion", apply: Boolean(page) }}
                            label={page ? "Track + update page" : "Track"}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={S.empty}>{suggestMeta ? "No new business searches in this group." : "Suggestions appear after the first DataForSEO check."}</p>
          )}
          {suggested.length > shown ? (
            <button type="button" onClick={() => setShown((n) => n + PAGE)} style={{ ...S.ghost, alignSelf: "center" }}>
              Show {Math.min(PAGE, suggested.length - shown)} more
            </button>
          ) : null}
        </>
      ) : null}

      {tab === "gap" ? (
        <>
          {competitors.length ? (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Chip on={rival === "all"} onClick={() => setRival("all")}>
                All competitors
              </Chip>
              {competitors.map((c) => (
                <Chip key={c.domain} on={rival === c.domain} onClick={() => setRival(c.domain)}>
                  {c.domain}
                  <span style={{ color: rival === c.domain ? "#3A3F47" : "#7D848E" }}>
                    {" "}
                    · {num(c.shared)} shared
                    {c.gapKeywords != null ? ` · ${num(c.gapKeywords)} gaps` : ""}
                  </span>
                </Chip>
              ))}
            </div>
          ) : null}
          <span style={{ fontSize: "13px", color: "#9AA1AB" }}>
            Searches your competitors rank for in Google&apos;s top 20 and this website does not. Only searches that fit the business are kept.
          </span>
          {gap.length ? (
            <div style={S.scroll}>
              <table style={S.table}>
                <thead>
                  <tr style={S.headRow}>
                    <th style={S.th}>KEYWORD</th>
                    <th style={S.th}>COMPETITOR · THEIR SPOT</th>
                    <th style={{ ...S.th, textAlign: "right" }}>SEARCHES/MO</th>
                    <th style={{ ...S.th, textAlign: "right" }}>DIFFICULTY</th>
                    <th style={S.th}>YOUR PAGE</th>
                    <th style={S.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {gap.slice(0, shown).map((row) => {
                    const page = path(row.page);
                    return (
                      <tr key={row.keyword} style={S.row}>
                        <td style={S.td}>
                          <span style={{ fontWeight: 600 }}>{row.keyword}</span>
                          {row.question ? <Pill tone="blue">question</Pill> : null}
                        </td>
                        <td style={{ ...S.td, color: "#9AA1AB" }}>
                          {row.gapDomain} · <span style={{ color: "#F2F4F5" }}>{spot(row.gapPosition)}</span>
                          <div style={S.mono}>{path(row.gapUrl)}</div>
                        </td>
                        <td style={{ ...S.td, textAlign: "right" }}>
                          <Volume row={row} local={localVolume} />
                        </td>
                        <td style={{ ...S.td, textAlign: "right" }}>{num(row.difficulty)}</td>
                        <td style={{ ...S.td, ...S.mono, fontSize: "12px" }}>{page || "none yet"}</td>
                        <td style={{ ...S.td, textAlign: "right", whiteSpace: "nowrap" }}>
                          <TrackButton
                            row={row}
                            tracking={tracking}
                            tracked={trackedTerms}
                            onTrack={onTrack}
                            extra={{ page: row.page, concept: row.concept, source: "suggestion", apply: Boolean(page) }}
                            label={page ? "Track + update page" : "Track"}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={S.empty}>
              {competitors.length
                ? "No business searches where these competitors rank and you don't."
                : "No organic competitors found in DataForSEO for this website yet."}
            </p>
          )}
          {gap.length > shown ? (
            <button type="button" onClick={() => setShown((n) => n + PAGE)} style={{ ...S.ghost, alignSelf: "center" }}>
              Show {Math.min(PAGE, gap.length - shown)} more
            </button>
          ) : null}
        </>
      ) : null}

      {tab === "organic" ? (
        <>
          {organicSummary ? (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Stat
                label="Keywords ranking"
                value={num(organicSummary.keywords)}
                hint={
                  organicSummary.loaded < organicSummary.keywords
                    ? `Top ${num(organicSummary.loaded)} by position listed below`
                    : "Google top 100 · DataForSEO"
                }
              />
              <Stat label="Est. visits / month" value={num(organicSummary.traffic)} hint="From positions × searches" />
              <Stat label="In top 3" value={num(organicSummary.top3)} />
              <Stat label="In top 10" value={num(organicSummary.top10)} />
            </div>
          ) : null}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShown(PAGE);
              }}
              placeholder="Filter keywords"
              aria-label="Filter your organic keywords"
              style={S.input}
            />
            <span style={{ fontSize: "12px", color: "#7D848E" }}>
              DataForSEO ranks first
              {scConnected ? ", Search Console clicks added." : ". "}
              {scConnected ? null : (
                <Link href="/app/connections" style={{ color: "#4DA3FF" }}>
                  Connect Search Console
                </Link>
              )}
            </span>
          </div>
          {organic.length ? (
            <div style={S.scroll}>
              <table style={S.table}>
                <thead>
                  <tr style={S.headRow}>
                    <th style={S.th}>KEYWORD</th>
                    <th style={{ ...S.th, textAlign: "right" }}>SPOT</th>
                    <th style={{ ...S.th, textAlign: "right" }}>VISITS/MO</th>
                    <th style={{ ...S.th, textAlign: "right" }}>SEARCHES/MO</th>
                    <th style={S.th}>12 MONTHS</th>
                    <th style={S.th}>ON GOOGLE</th>
                    <th style={{ ...S.th, textAlign: "right" }}>CLICKS</th>
                    <th style={S.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {organic.slice(0, shown).map((row) => {
                    const owned = new Set(row.ownedFeatures || []);
                    const feats = [...new Set([...(row.ownedFeatures || []), ...(row.serpFeatures || [])])].filter((f) => FEATURE[f]);
                    return (
                      <tr key={row.keyword} style={S.row}>
                        <td style={S.td}>
                          {row.keyword}
                          {row.otherUrls?.length ? <Pill tone="amber">{row.otherUrls.length + 1} pages</Pill> : null}
                          <div style={S.mono}>{path(row.url)}</div>
                        </td>
                        <td style={{ ...S.td, textAlign: "right" }}>
                          {spot(row.position)}
                          {row.previous != null && row.position != null && row.previous !== row.position ? (
                            <div style={{ fontSize: "11px", color: row.position < row.previous ? "#3DDC84" : "#FF5A4E" }}>
                              {row.position < row.previous ? "▲" : "▼"} {Math.abs(row.previous - row.position)}
                            </div>
                          ) : null}
                        </td>
                        <td style={{ ...S.td, textAlign: "right" }}>{num(row.traffic)}</td>
                        <td style={{ ...S.td, textAlign: "right" }}>
                          <Volume row={row} local={localVolume} />
                        </td>
                        <td style={S.td}>
                          <Sparkline values={row.trend} />
                        </td>
                        <td style={S.td}>
                          <span style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {feats.length
                              ? feats.slice(0, 4).map((f) => (
                                  <span
                                    key={f}
                                    title={owned.has(f) ? "This website appears here" : "On the results page"}
                                    style={{
                                      fontSize: "11px",
                                      padding: "2px 6px",
                                      borderRadius: "6px",
                                      color: owned.has(f) ? "#3DDC84" : "#9AA1AB",
                                      background: owned.has(f) ? "rgba(61,220,132,.12)" : "#1A1D22",
                                    }}
                                  >
                                    {owned.has(f) ? "✓ " : ""}
                                    {FEATURE[f]}
                                  </span>
                                ))
                              : <span style={{ color: "#7D848E" }}>—</span>}
                          </span>
                        </td>
                        <td style={{ ...S.td, textAlign: "right" }}>{num(row.clicks)}</td>
                        <td style={{ ...S.td, textAlign: "right" }}>
                          <TrackButton
                            row={row}
                            tracking={tracking}
                            tracked={trackedTerms}
                            onTrack={onTrack}
                            extra={{ page: row.url || "", source: "current", apply: false }}
                            primary={false}
                            label="Track"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={S.empty}>{query ? "No keyword matches that filter." : "DataForSEO has not seen this website rank yet."}</p>
          )}
          {organic.length > shown ? (
            <button type="button" onClick={() => setShown((n) => n + PAGE)} style={{ ...S.ghost, alignSelf: "center" }}>
              Show {Math.min(PAGE, organic.length - shown)} more of {num(organic.length)}
            </button>
          ) : null}
        </>
      ) : null}

      {tab === "cannibal" ? (
        <>
          <span style={{ fontSize: "13px", color: "#9AA1AB", lineHeight: 1.45 }}>
            More than one page of this website ranks for the same search, so they compete with each other. Pick one page to own the
            search and point the others to it.
          </span>
          <div style={S.scroll}>
            <table style={S.table}>
              <thead>
                <tr style={S.headRow}>
                  <th style={S.th}>KEYWORD</th>
                  <th style={S.th}>PAGES COMPETING</th>
                  <th style={{ ...S.th, textAlign: "right" }}>BEST SPOT</th>
                  <th style={{ ...S.th, textAlign: "right" }}>SEARCHES/MO</th>
                </tr>
              </thead>
              <tbody>
                {cannibalization.map((row) => (
                  <tr key={row.keyword} style={S.row}>
                    <td style={{ ...S.td, fontWeight: 600 }}>{row.keyword}</td>
                    <td style={S.td}>
                      <div style={{ ...S.mono, color: "#F2F4F5" }}>{path(row.url)} · ranking</div>
                      {(row.otherUrls || []).map((u) => (
                        <div key={u} style={S.mono}>
                          {path(u)}
                        </div>
                      ))}
                    </td>
                    <td style={{ ...S.td, textAlign: "right" }}>{spot(row.position)}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>{num(row.volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}

const S = {
  panel: {
    maxWidth: "1120px",
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
    borderRadius: "22px",
    background: "#101215",
    border: "1px solid #1A1D22",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  h2: { margin: 0, fontSize: "16px", fontWeight: 600, color: "#F2F4F5" },
  scroll: { overflowX: "auto", maxHeight: "620px", overflowY: "auto", scrollbarColor: "#262A31 transparent", scrollbarWidth: "thin" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px", color: "#F2F4F5" },
  headRow: { color: "#7D848E", fontFamily: "'Geist Mono', monospace", fontSize: "11px", textAlign: "left", position: "sticky", top: 0, background: "#101215" },
  th: { padding: "6px 8px", fontWeight: 500, whiteSpace: "nowrap" },
  td: { padding: "10px 8px", verticalAlign: "top" },
  row: { borderTop: "1px solid #1A1D22" },
  mono: { fontFamily: "'Geist Mono', monospace", fontSize: "11px", color: "#7D848E", wordBreak: "break-all" },
  empty: { margin: 0, fontSize: 14, color: "#9AA1AB" },
  input: {
    flex: "0 1 280px",
    minWidth: 0,
    minHeight: "38px",
    padding: "0 12px",
    borderRadius: "10px",
    border: "1px solid #262A31",
    background: "#0A0B0D",
    color: "#F2F4F5",
    font: "inherit",
    fontSize: "14px",
  },
  primary: {
    minHeight: "36px",
    padding: "0 14px",
    borderRadius: "10px",
    border: "0",
    background: "#4DA3FF",
    color: "#0A0B0D",
    fontSize: "13px",
    fontWeight: 600,
  },
  ghost: {
    minHeight: "36px",
    padding: "0 14px",
    borderRadius: "10px",
    border: "1px solid #262A31",
    background: "transparent",
    color: "#D7DADE",
    fontSize: "13px",
  },
};
