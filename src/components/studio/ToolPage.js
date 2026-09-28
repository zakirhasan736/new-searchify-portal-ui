"use client";

import { useEffect, useMemo, useState } from "react";
import { enrichFromGoogle, loadFeatures, saveFeature } from "@/lib/clientApi";
import { ServiceLayout } from "@/components/studio/layouts";
import ResearchBar from "@/components/studio/ResearchBar";
import { groupFor } from "@/lib/tools";
import { featuresFor } from "@/lib/pageFeatures";
import { guideFor, relatedFor } from "@/lib/toolGuides";
import Link from "next/link";
import { googleMeta } from "@/lib/googleTools";

const RANGES = ["Last 7 days", "Last 28 days", "Last 3 months", "Last 12 months"];
const PLACES = ["Worldwide", "United States", "United Kingdom", "Nigeria", "Canada"];
const CHANNELS = ["All", "Organic", "Paid"];
const COMPARES = ["None", "competitor.example", "rival.example", "amazon.com", "walmart.com"];
const SUGGESTED_DOMAINS = ["ebuy.com", "amazon.com", "walmart.com", "pinterest.com", "youtube.com"];
const DEVICES = ["Desktop + Mobile", "Desktop", "Mobile"];
const DATABASES = ["Google", "Bing", "Yahoo"];

const ENRICH_KINDS = new Set([
  "topic-research",
  "topic-finder",
  "generate-keywords",
  "prompt-research",
  "prompt-tracking",
  "ai-analysis",
  "ai-visibility-report",
  "brand-narrative",
]);

const POPUP_KINDS = {
  "keyword-manager": ["keyword-list", "keyword-share"],
  "keyword-analyze": ["keyword-group"],
  "website-keywords": ["website-keyword-list"],
  "generate-keywords": ["website-keyword-list"],
  "keyword-ranking": ["keyword-group"],
  "keyword-metrics": ["keyword-group"],
  "position-tracking": ["keyword-group"],
  "local-map-ranks": ["keyword-group"],
  "organic-research": ["website-keyword-list"],
  "organic-search": ["website-keyword-list"],
  "paid-search": ["website-keyword-list"],
  "prompt-research": ["keyword-group"],
  "prompt-tracking": ["keyword-group"],
  "brand-questions": ["keyword-group"],
  "traffic-home": ["competitor-list"],
  "traffic-analytics": ["competitor-list"],
  "keyword-gap": ["competitor-list"],
  "competitor-monitoring": ["competitor-list"],
  "competitor-research": ["competitor-list"],
  "market-overview": ["competitor-list"],
  "local-competitors": ["competitor-list"],
  "domain-snapshot": ["competitor-list"],
  "backlink-analytics": ["competitor-list"],
  "link-building": ["keyword-list"],
};

const ACTIONS = {
  "keyword-manager": [
    ["share", "Share"],
    ["list", "Create list"],
  ],
  "keyword-analyze": [["group", "New list"]],
  "website-keywords": [["web-list", "Save keyword list"]],
  "generate-keywords": [["web-list", "Save idea list"]],
  "keyword-ranking": [["group", "Save ranking group"]],
  "keyword-metrics": [["group", "Save metrics"]],
  "position-tracking": [["group", "Save tracking group"]],
  "local-map-ranks": [["group", "Save map set"]],
  "organic-research": [["web-list", "Save keyword list"]],
  "organic-search": [["web-list", "Save query list"]],
  "paid-search": [["web-list", "Save paid list"]],
  "prompt-research": [["group", "Save prompts"]],
  "prompt-tracking": [["group", "Save tracked set"]],
  "brand-questions": [["group", "Save questions"]],
  "traffic-home": [["competitors", "Create list"]],
  "traffic-analytics": [["competitors", "Create list"]],
  "keyword-gap": [["competitors", "Compare list"]],
  "competitor-monitoring": [["competitors", "Create list"]],
  "competitor-research": [["competitors", "Compare list"]],
  "market-overview": [["competitors", "Create list"]],
  "local-competitors": [["competitors", "Compare"]],
  "domain-snapshot": [["competitors", "Compare domains"]],
  "backlink-analytics": [["competitors", "Compare"]],
  "link-building": [["list", "Create prospect list"]],
  "top-pages": [["web-list", "Save page list"]],
};

function Menu({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 items-center gap-2 rounded-xl border border-line bg-white/5 px-3 text-sm"
      >
        <span className="text-white/45">{label}</span>
        <span>{value}</span>
      </button>
      {open ? (
        <ul className="studio-scroll absolute left-0 z-30 mt-2 max-h-64 w-56 overflow-y-auto rounded-xl border border-line bg-panel py-1 shadow-2xl">
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-white/5"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Dialog({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[10vh]" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-line bg-panel p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-sans text-xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full border border-line px-3 py-1 text-sm text-white/70">
            Close
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export default function ToolPage({ kind, title, description, group = "Workspace", initialTab = "overview" }) {
  const [tab, setTab] = useState(initialTab);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [records, setRecords] = useState([]);
  const [saved, setSaved] = useState([]);
  const [popup, setPopup] = useState("");
  const [message, setMessage] = useState("");
  const [range, setRange] = useState("Last 28 days");
  const [place, setPlace] = useState("Worldwide");
  const [channel, setChannel] = useState("All");
  const [compare, setCompare] = useState("None");
  const [device, setDevice] = useState("Desktop + Mobile");
  const [database, setDatabase] = useState("Google");
  const [access, setAccess] = useState("All");
  const [listName, setListName] = useState("");
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("Viewer");
  const [keywordDraft, setKeywordDraft] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [domainDraft, setDomainDraft] = useState("");
  const [domains, setDomains] = useState([]);
  const [domainMenu, setDomainMenu] = useState(false);
  const [feed, setFeed] = useState({});
  const [view, setView] = useState("");
  const [site, setSite] = useState("All sites");
  const [enriching, setEnriching] = useState(false);
  const kit = featuresFor(kind);

  useEffect(() => {
    setView(featuresFor(kind).views[0] || "Overview");
    setSite("All sites");
  }, [kind]);

  useEffect(() => {
    loadFeatures(kind).then(setRecords);
    const extras = POPUP_KINDS[kind] || [];
    Promise.all(extras.map((extra) => loadFeatures(extra).then((rows) => rows.map((row) => ({ ...row, kind: extra }))))).then((groups) =>
      setSaved(groups.flat())
    );
  }, [kind]);

  const live = records.find((record) => record.payload?.seedVersion === "google-live-v1");
  const columns = (() => {
    if (live?.payload?.columns) return live.payload.columns;
    const seeded = records.find((record) => record.payload?.seedVersion && record.payload?.columns);
    return seeded?.payload.columns || records.find((record) => record.payload?.columns)?.payload.columns || ["Item", "Detail"];
  })();
  const panels = (() => {
    const raw =
      live?.payload?.panels ||
      records.find((record) => record.payload?.seedVersion && record.payload?.panels)?.payload.panels ||
      records.find((record) => record.payload?.panels)?.payload.panels ||
      null;
    return Array.isArray(raw) ? null : raw;
  })();
  const tablePanels = (() => {
    const fromKey =
      live?.payload?.tablePanels ||
      records.find((record) => record.payload?.seedVersion && record.payload?.tablePanels)?.payload.tablePanels ||
      records.find((record) => record.payload?.tablePanels)?.payload.tablePanels ||
      null;
    if (Array.isArray(fromKey) && fromKey.length) return fromKey;
    const raw =
      live?.payload?.panels ||
      records.find((record) => record.payload?.seedVersion && record.payload?.panels)?.payload.panels ||
      records.find((record) => record.payload?.panels)?.payload.panels ||
      null;
    return Array.isArray(raw) ? raw : null;
  })();
  const kpis =
    live?.payload?.kpis ||
    records.find((record) => record.payload?.seedVersion && record.payload?.kpis)?.payload.kpis ||
    records.find((record) => record.payload?.kpis)?.payload.kpis ||
    null;
  const rows = (() => {
    if (live && Array.isArray(live.payload?.rows)) return live.payload.rows;
    const seeded = records.filter((record) => record.payload?.seedVersion && Array.isArray(record.payload?.rows));
    const custom = records.filter((record) => !record.payload?.seedVersion && Array.isArray(record.payload?.rows));
    const pool = seeded.length ? [...seeded, ...custom] : records;
    return pool.flatMap((record) => record.payload?.rows || []);
  })();
  const summary =
    live?.payload?.summary ||
    records.find((record) => record.payload?.seedVersion && record.payload?.summary)?.payload.summary ||
    records.find((record) => record.payload?.summary)?.payload.summary ||
    description;
  const siteIndex = columns.findIndex((column) => /^site$/i.test(column));
  const siteOptions = ["All sites", ...[...new Set(rows.map((row) => (siteIndex >= 0 ? row[siteIndex] : "")).filter(Boolean))]];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      const text = row.join(" ").toLowerCase();
      if (site !== "All sites" && siteIndex >= 0 && row[siteIndex] !== site) return false;
      if (needle && !text.includes(needle)) return false;
      if (channel !== "All" && !text.includes(channel.toLowerCase())) return false;
      if (compare !== "None" && !text.includes(compare.toLowerCase())) return false;
      if (place !== "Worldwide" && text.includes(place.toLowerCase()) === false && columns.some((column) => /country|location/i.test(column))) return false;
      if (kind === "keyword-manager" && access === "Mine" && !text.includes("owner")) return false;
      if (kind === "keyword-manager" && access === "Shared" && !text.includes("viewer") && !text.includes("editor")) return false;
      if (/^\d{4}-\d{2}-\d{2}$/.test(row[0] || "")) {
        const days = range === "Last 7 days" ? 7 : range === "Last 28 days" ? 28 : range === "Last 3 months" ? 92 : 370;
        const then = Date.now() - days * 86400000;
        if (new Date(row[0]).getTime() < then) return false;
      }
      return true;
    });
  }, [rows, query, channel, compare, place, columns, kind, access, range, site, siteIndex]);

  const refreshSaved = async () => {
    const extras = POPUP_KINDS[kind] || [];
    const groups = await Promise.all(extras.map((extra) => loadFeatures(extra).then((items) => items.map((item) => ({ ...item, kind: extra })))));
    setSaved(groups.flat());
  };

  const finish = async (ok, detail) => {
    setMessage(ok ? "Saved to your project." : detail || "Sign in to save this.");
    if (!ok) return;
    setPopup("");
    setListName("");
    setEmail("");
    setKeywords([]);
    setDomains([]);
    setRecords(await loadFeatures(kind));
    await refreshSaved();
    setTab("table");
  };

  const addFeed = async (event) => {
    event.preventDefault();
    const values = columns.map((column) => (feed[column] || "").trim());
    if (!values.some(Boolean)) return;
    const response = await saveFeature(kind, values[0] || title, { summary: description, columns, rows: [values] });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.detail || "Sign in to save this feed.");
      return;
    }
    setFeed({});
    setMessage("Feed saved to your project.");
    setRecords(await loadFeatures(kind));
    setTab("table");
  };

  const createList = async () => {
    if (listName.trim().length <= 3) return;
    const response = await saveFeature("keyword-list", listName.trim(), {
      list: listName.trim(),
      limit: "0/100",
      updated: "Just now",
    });
    const data = await response.json().catch(() => ({}));
    finish(response.ok, data.detail);
  };

  const shareList = async () => {
    if (!email.includes("@") || listName.trim().length <= 3) return;
    const response = await saveFeature("keyword-share", listName.trim(), {
      list: listName.trim(),
      email,
      permission,
    });
    const data = await response.json().catch(() => ({}));
    finish(response.ok, data.detail);
  };

  const saveGroup = async () => {
    if (!keywords.length || keywords.length > 200) return;
    const response = await saveFeature("keyword-group", listName.trim() || "Keyword group", {
      name: listName.trim() || "Keyword group",
      keyword: keywords,
    });
    const data = await response.json().catch(() => ({}));
    finish(response.ok, data.detail);
  };

  const saveWebsiteList = async () => {
    if (listName.trim().length <= 3 || !keywords.length) return;
    const response = await saveFeature("website-keyword-list", listName.trim(), {
      name: listName.trim(),
      keyword: keywords.join(", "),
    });
    const data = await response.json().catch(() => ({}));
    finish(response.ok, data.detail);
  };

  const saveCompetitors = async () => {
    if (listName.trim().length <= 3 || !domains.length || domains.length > 20) return;
    const response = await saveFeature("competitor-list", listName.trim(), {
      name: listName.trim(),
      location: place,
      domains,
    });
    const data = await response.json().catch(() => ({}));
    finish(response.ok, data.detail);
  };

  const addKeyword = () => {
    const next = keywordDraft
      .split(/[\n,]/)
      .map((part) => part.trim())
      .filter(Boolean);
    const merged = [...new Set([...keywords, ...next])];
    if (merged.length > 200) {
      setMessage("A keyword group holds up to 200 keywords.");
      return;
    }
    setKeywords(merged);
    setKeywordDraft("");
  };

  const addDomain = (value) => {
    const domain = value.trim().toLowerCase();
    if (!domain || domains.includes(domain)) return;
    if (domains.length >= 20) {
      setMessage("A competitor list holds up to 20 domains.");
      return;
    }
    setDomains([...domains, domain]);
    setDomainDraft("");
    setDomainMenu(false);
  };

  const searchHits = rows.filter((row) => row.join(" ").toLowerCase().includes(draft.trim().toLowerCase())).slice(0, 8);
  const actions = ACTIONS[kind] || kit.actions || [];
  const viewed = useMemo(() => {
    if (!view || view === "Overview" || view === kit.views[0]) return filtered;
    const needle = view.toLowerCase();
    const matched = filtered.filter((row) => row.join(" ").toLowerCase().includes(needle));
    return matched.length ? matched : filtered;
  }, [filtered, view, kit.views]);

  const guide = guideFor(kind);
  const related = relatedFor(kind);
  const google = googleMeta(kind);
  const statusLabel = (() => {
    if (live?.payload?.seedVersion === "google-live-v1") return "connected";
    if (records.some((record) => record.status === "stored" && record.payload?.source?.startsWith?.("google"))) return "connected";
    if (/waiting_for_provider/i.test(summary) || /waiting for google/i.test(summary)) return "waiting_for_provider";
    return "stored";
  })();
  const sourceLabel = live?.payload?.source
    ? String(live.payload.source).replace(/_/g, " ")
    : google
      ? `${google.source} · sync to load`
      : null;

  const exportCsv = () => {
    const lines = [columns.join(",")].concat(
      viewed.map((row) =>
        columns
          .map((_, index) => {
            const cell = String(row[index] ?? "");
            return /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
          })
          .join(","),
      ),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${kind}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("CSV exported from the filtered table.");
  };

  const runEnrich = async () => {
    setEnriching(true);
    setMessage("Enriching from live GSC queries via OpenAI…");
    const response = await enrichFromGoogle();
    const data = await response.json().catch(() => ({}));
    setEnriching(false);
    if (!response.ok) {
      setMessage(data.detail || "Enrich failed — Sync Google first.");
      return;
    }
    const e = data.enriched || {};
    setMessage(
      e.note
        ? e.note
        : `Enriched · topics:${e.topics ? "✓" : "—"} keywords:${e.keywords ? "✓" : "—"} prompts:${e.prompts ? "✓" : "—"} narratives:${e.narratives ? "✓" : "—"}`,
    );
    loadFeatures(kind).then(setRecords);
  };

  const narrativeDraft = live?.payload?.draft || records.find((r) => r.payload?.draft)?.payload?.draft;

  return (
    <section className="mx-auto max-w-6xl pb-10">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">{groupFor(kind)}</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] ${statusLabel === "waiting_for_provider" ? "bg-blush/20 text-blush" : "bg-brand/20 text-brand"}`}>{statusLabel}</span>
        {google ? (
          <span className="rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-white/55">
            {google.label}
          </span>
        ) : null}
        {sourceLabel ? <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40">{sourceLabel}</span> : null}
      </div>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-sans text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">{summary}</p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {actions.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                if (id === "feed") {
                  setTab("table");
                  setMessage("Use Add feed below to save a new row.");
                  return;
                }
                setPopup(id);
              }}
              className="h-11 flex-1 rounded-full bg-gradient-to-r from-blush to-brand px-4 text-sm font-semibold sm:h-10 sm:flex-none"
            >
              {label}
            </button>
          ))}
          <button type="button" onClick={exportCsv} className="h-11 flex-1 rounded-full border border-line bg-white/5 px-4 text-sm text-white/80 sm:h-10 sm:flex-none">
            Export CSV
          </button>
          {ENRICH_KINDS.has(kind) ? (
            <button
              type="button"
              disabled={enriching}
              onClick={runEnrich}
              className="h-11 flex-1 rounded-full border border-brand/40 px-4 text-sm text-brand disabled:opacity-50 sm:h-10 sm:flex-none"
            >
              {enriching ? "Enriching…" : "Refresh from GSC + AI"}
            </button>
          ) : null}
          <button type="button" onClick={() => setSearchOpen(true)} className="h-11 flex-1 rounded-full border border-line bg-white/5 px-4 text-sm text-white/80 sm:h-10 sm:flex-none">
            Search
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-brand/10 px-4 py-3 text-sm text-white/75">
        <p>{guide.tip}</p>
        <p className="mt-1 text-xs text-brand">{guide.next}</p>
        {google && statusLabel !== "connected" ? (
          <p className="mt-2 text-xs">
            This tool uses live {google.source} data.{" "}
            <Link href="/market/google-services" className="underline underline-offset-2">
              Connect & Sync Google
            </Link>{" "}
            to replace demo rows.
          </p>
        ) : null}
        {google && statusLabel === "connected" ? (
          <p className="mt-2 text-xs text-emerald-200/80">Showing live {google.source} data from your last Google Sync.</p>
        ) : null}
      </div>

      <ResearchBar
        kind={kind}
        mode={kit.search === "keyword" ? "keyword" : "domain"}
        onPick={(value) => {
          setQuery(value);
          setTab("table");
          setMessage(`Showing results for “${value}”.`);
        }}
      />

      <div className="mt-5 flex flex-wrap gap-2">
        {siteOptions.length > 1 ? <Menu label="Site" value={site} options={siteOptions} onChange={setSite} /> : null}
        <Menu label="Range" value={range} options={RANGES} onChange={setRange} />
        <Menu label="Location" value={place} options={PLACES} onChange={setPlace} />
        <Menu label="Channel" value={channel} options={CHANNELS} onChange={setChannel} />
        <Menu label="Compare" value={compare} options={COMPARES} onChange={setCompare} />
        <Menu label="Device" value={device} options={DEVICES} onChange={setDevice} />
        <Menu label="Database" value={database} options={DATABASES} onChange={setDatabase} />
        {kind === "keyword-manager" ? <Menu label="Lists" value={access} options={["All", "Mine", "Shared"]} onChange={setAccess} /> : null}
      </div>

      {(query || channel !== "All" || compare !== "None" || place !== "Worldwide" || site !== "All sites") ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {site !== "All sites" ? (
            <button type="button" onClick={() => setSite("All sites")} className="rounded-full bg-brand/20 px-3 py-1">
              Site: {site} ×
            </button>
          ) : null}
          {query ? (
            <button type="button" onClick={() => setQuery("")} className="rounded-full bg-brand/20 px-3 py-1">
              Search: {query} ×
            </button>
          ) : null}
          {channel !== "All" ? (
            <button type="button" onClick={() => setChannel("All")} className="rounded-full bg-brand/20 px-3 py-1">
              {channel} ×
            </button>
          ) : null}
          {compare !== "None" ? (
            <button type="button" onClick={() => setCompare("None")} className="rounded-full bg-brand/20 px-3 py-1">
              Compare {compare} ×
            </button>
          ) : null}
          {place !== "Worldwide" ? (
            <button type="button" onClick={() => setPlace("Worldwide")} className="rounded-full bg-brand/20 px-3 py-1">
              {place} ×
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-panel px-4 py-3">
        <p className="text-sm text-white/70">
          <span className="font-semibold text-white">{viewed.length}</span> {kit.resultLabel}
          {query ? (
            <>
              {" "}
              for <span className="text-brand">{query}</span>
            </>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-2">
          {kit.views.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setView(name);
                setTab(name === kit.views[0] || name === "Overview" ? "overview" : "table");
              }}
              className={`rounded-full px-3 py-1.5 text-xs ${view === name ? "bg-brand text-white" : "bg-white/5 text-white/65"}`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex gap-1 overflow-x-auto pb-1 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0">
        {[
          ["overview", "Overview"],
          ["table", "Results"],
          ["saved", "Saved"],
        ].map(([id, name]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`shrink-0 rounded-full px-4 py-2 text-sm ${tab === id ? "bg-brand text-white" : "bg-white/5 text-white/70"}`}>
            {name}
          </button>
        ))}
      </div>
      {message ? <p className="mt-3 text-sm text-brand">{message}</p> : null}

      {tab === "overview" ? <ServiceLayout kind={kind} columns={columns} rows={viewed} panels={panels} tablePanels={tablePanels} kpis={kpis} /> : null}

      {narrativeDraft ? (
        <div className="mt-6 rounded-2xl border border-line bg-panel p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-white/45">AI narrative</p>
          <pre className="studio-scroll mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap font-body text-sm leading-6 text-white/75">{narrativeDraft}</pre>
        </div>
      ) : null}

      {tab !== "saved" ? (
        <div className="studio-scroll mt-6 overflow-x-auto rounded-2xl border border-line bg-panel">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.08em] text-brand">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-4 py-3 font-medium">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {viewed.map((row, index) => (
                <tr key={index} className="border-t border-white/5">
                  {columns.map((column, cell) => (
                    <td key={column} className="px-4 py-3">{row[cell] || "—"}</td>
                  ))}
                </tr>
              ))}
              {!viewed.length ? (
                <tr>
                  <td className="px-4 py-10 text-white/50" colSpan={columns.length}>
                    <p className="font-medium text-white/70">No rows for this filter.</p>
                    <p className="mt-2 text-sm">Try another keyword/domain, clear filters, or add a feed below. Live providers stay waiting until connected.</p>
                    <button type="button" className="mt-4 rounded-full bg-brand/25 px-4 py-2 text-sm text-brand" onClick={() => setTab("table")}>
                      Add feed on Results
                    </button>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-white/5 overflow-hidden rounded-2xl border border-line bg-panel">
          {saved.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="px-4 py-3">
              <p className="text-xs uppercase tracking-[0.12em] text-brand">{item.kind}</p>
              <p className="mt-1">{item.title}</p>
            </li>
          ))}
          {!saved.length ? <li className="px-4 py-8 text-sm text-white/50">Nothing saved from the popups yet.</li> : null}
        </ul>
      )}

      <form onSubmit={addFeed} className="mt-4 rounded-2xl border border-line bg-panel p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Add feed</p>
        <p className="mt-1 text-sm text-white/55">This row is stored in the project database and shows in the table after you save.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {columns.map((column) => (
            <input
              key={column}
              value={feed[column] || ""}
              onChange={(event) => setFeed((current) => ({ ...current, [column]: event.target.value }))}
              placeholder={column}
              className="h-11 rounded-xl border border-line bg-ink px-3"
            />
          ))}
        </div>
        <button type="submit" className="mt-3 h-11 rounded-full bg-gradient-to-r from-blush to-brand px-5 font-semibold">Save feed</button>
      </form>

      {searchOpen ? (
        <Dialog title="Search this page" onClose={() => setSearchOpen(false)}>
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Keyword, domain, or metric"
            className="h-11 w-full rounded-xl border border-line bg-ink px-3"
          />
          <ul className="studio-scroll mt-3 max-h-72 overflow-y-auto">
            {searchHits.map((row, index) => (
              <li key={index}>
                <button
                  type="button"
                  className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-white/5"
                  onClick={() => {
                    setQuery(row[0]);
                    setSearchOpen(false);
                    setTab("table");
                  }}
                >
                  <span className="block">{row[0]}</span>
                  <span className="text-white/50">{row.slice(1).join(" · ")}</span>
                </button>
              </li>
            ))}
            {draft && !searchHits.length ? <li className="px-3 py-4 text-sm text-white/50">No rows match.</li> : null}
          </ul>
        </Dialog>
      ) : null}

      {popup === "list" ? (
        <Dialog title="Create list" onClose={() => setPopup("")}>
          <input value={listName} onChange={(event) => setListName(event.target.value)} placeholder="List name" className="h-11 w-full rounded-xl border border-line bg-ink px-3" />
          <p className="mt-2 text-xs text-white/50">Use more than 3 characters.</p>
          <button type="button" disabled={listName.trim().length <= 3} onClick={createList} className="mt-4 h-11 rounded-full bg-gradient-to-r from-blush to-brand px-5 font-semibold disabled:opacity-40">
            Save list
          </button>
        </Dialog>
      ) : null}

      {popup === "share" ? (
        <Dialog title="Share list" onClose={() => setPopup("")}>
          <div className="grid gap-3">
            <input value={listName} onChange={(event) => setListName(event.target.value)} placeholder="List name" className="h-11 rounded-xl border border-line bg-ink px-3" />
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="h-11 rounded-xl border border-line bg-ink px-3" />
            <Menu label="Access" value={permission} options={["Viewer", "Editor"]} onChange={setPermission} />
            <button type="button" disabled={listName.trim().length <= 3 || !email.includes("@")} onClick={shareList} className="h-11 rounded-full bg-gradient-to-r from-blush to-brand px-5 font-semibold disabled:opacity-40">
              Share
            </button>
          </div>
        </Dialog>
      ) : null}

      {popup === "group" || popup === "web-list" ? (
        <Dialog title={popup === "group" ? "Save keyword group" : "Save keyword list"} onClose={() => setPopup("")}>
          <div className="grid gap-3">
            <input value={listName} onChange={(event) => setListName(event.target.value)} placeholder="Group name" className="h-11 rounded-xl border border-line bg-ink px-3" />
            <div className="flex gap-2">
              <input value={keywordDraft} onChange={(event) => setKeywordDraft(event.target.value)} placeholder="Keyword, or paste several" className="h-11 flex-1 rounded-xl border border-line bg-ink px-3" />
              <button type="button" onClick={addKeyword} className="h-11 rounded-full border border-line px-4">Add</button>
            </div>
            <p className="text-xs text-white/50">{keywords.length}/200</p>
            <div className="flex flex-wrap gap-2">
              {keywords.map((item) => (
                <button key={item} type="button" onClick={() => setKeywords(keywords.filter((word) => word !== item))} className="rounded-full bg-white/10 px-3 py-1 text-sm">
                  {item} ×
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={!keywords.length || (popup === "web-list" && listName.trim().length <= 3)}
              onClick={popup === "group" ? saveGroup : saveWebsiteList}
              className="h-11 rounded-full bg-gradient-to-r from-blush to-brand px-5 font-semibold disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </Dialog>
      ) : null}

      {popup === "competitors" ? (
        <Dialog title="Create competitor list" onClose={() => setPopup("")}>
          <div className="grid gap-3">
            <input value={listName} onChange={(event) => setListName(event.target.value)} placeholder="List name" className="h-11 rounded-xl border border-line bg-ink px-3" />
            <Menu label="Location" value={place} options={PLACES} onChange={setPlace} />
            <div className="relative">
              <input
                value={domainDraft}
                onChange={(event) => {
                  setDomainDraft(event.target.value);
                  setDomainMenu(event.target.value.length > 1);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addDomain(domainDraft);
                  }
                }}
                placeholder="Domain, subdomain, or folder"
                className="h-11 w-full rounded-xl border border-line bg-ink px-3"
              />
              {domainMenu ? (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-line bg-ink">
                  {SUGGESTED_DOMAINS.filter((item) => item.includes(domainDraft.toLowerCase())).map((item) => (
                    <li key={item}>
                      <button type="button" className="w-full px-3 py-2 text-left text-sm hover:bg-white/5" onClick={() => addDomain(item)}>
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <p className="text-xs text-white/50">{domains.length}/20</p>
            <div className="flex flex-wrap gap-2">
              {domains.map((item) => (
                <button key={item} type="button" onClick={() => setDomains(domains.filter((domain) => domain !== item))} className="rounded-full bg-white/10 px-3 py-1 text-sm">
                  {item} ×
                </button>
              ))}
            </div>
            <button type="button" disabled={listName.trim().length <= 3 || !domains.length} onClick={saveCompetitors} className="h-11 rounded-full bg-gradient-to-r from-blush to-brand px-5 font-semibold disabled:opacity-40">
              Save list
            </button>
          </div>
        </Dialog>
      ) : null}

      {related.length ? (
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">Related tools</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <Link key={item.path} href={item.path} className="rounded-2xl border border-line bg-panel px-4 py-3 hover:border-brand/40">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-[11px] text-brand">{item.section || item.group || "Continue"}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
