"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadFeatures } from "@/lib/clientApi";
import { authHeaders } from "@/utils/users/Helpers";
import { StudioPanels } from "@/components/studio/charts";

const SECTIONS = [
  ["overview", "Overview"],
  ["vitals", "Core Web Vitals"],
  ["opportunities", "Opportunities"],
  ["diagnostics", "Diagnostics"],
  ["seo", "SEO audits"],
  ["a11y", "Accessibility"],
  ["best", "Best practices"],
  ["perf", "Performance"],
  ["gsc", "Search Console"],
  ["crux", "CrUX field"],
];

function PanelTable({ title, columns, rows, empty }) {
  if (!rows?.length) {
    return (
      <article className="rounded-2xl border border-line bg-panel p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">{title}</p>
        <p className="mt-3 text-sm text-white/45">{empty || "No rows for this section yet. Run a full audit."}</p>
      </article>
    );
  }
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="border-b border-white/5 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">{title}</p>
        <p className="mt-1 text-xs text-white/40">{rows.length} items</p>
      </div>
      <div className="studio-scroll overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.08em] text-white/40">
            <tr>
              {(columns || []).map((column) => (
                <th key={column} className="px-4 py-2 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-white/5 align-top">
                {(columns || []).map((_, cell) => {
                  const value = row[cell] || "—";
                  const fail = /fail|poor|deep|low ctr/i.test(String(value));
                  const pass = /pass|good|complete/i.test(String(value));
                  return (
                    <td key={cell} className={`px-4 py-2.5 ${fail ? "text-rose-200" : pass ? "text-emerald-200" : ""}`}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function findPanel(tablePanels, needle) {
  return (tablePanels || []).find((p) => String(p.title || "").toLowerCase().includes(needle));
}

export default function SiteAuditStudio() {
  const [records, setRecords] = useState([]);
  const [section, setSection] = useState("overview");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = async () => {
    const rows = await loadFeatures("site-audit");
    setRecords(rows);
    const live = rows.find((r) => r.payload?.seedVersion === "google-live-v1");
    if (live?.payload?.finalUrl || live?.payload?.url) {
      setUrl(live.payload.finalUrl || live.payload.url);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const live = records.find((r) => r.payload?.seedVersion === "google-live-v1");
  const payload = live?.payload || records.find((r) => r.payload?.rows)?.payload || {};
  const connected = payload.seedVersion === "google-live-v1";
  const kpis = payload.kpis || [];
  const counts = payload.counts || {};
  const tablePanels = payload.tablePanels || [];
  const chartPanels = payload.panels && !Array.isArray(payload.panels) ? payload.panels : null;
  const overviewRows = payload.rows || [];

  const sectionPanel = useMemo(() => {
    if (section === "vitals") return findPanel(tablePanels, "core web vitals · mobile") || findPanel(tablePanels, "core web vitals");
    if (section === "opportunities") return findPanel(tablePanels, "opportunities · mobile") || findPanel(tablePanels, "opportunities");
    if (section === "diagnostics") return findPanel(tablePanels, "diagnostics");
    if (section === "seo") return findPanel(tablePanels, "seo audits");
    if (section === "a11y") return findPanel(tablePanels, "accessibility");
    if (section === "best") return findPanel(tablePanels, "best practices");
    if (section === "perf") return findPanel(tablePanels, "performance audits");
    if (section === "gsc") return findPanel(tablePanels, "search console");
    if (section === "crux") return findPanel(tablePanels, "chrome ux") || findPanel(tablePanels, "crux");
    return null;
  }, [section, tablePanels]);

  const runAudit = async () => {
    setBusy(true);
    setMessage("Running full PageSpeed audit (mobile + desktop). This can take up to a minute…");
    const response = await fetch("/api/v1/oauth/google/pagespeed", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ url: url || undefined, strategy: "mobile" }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage(data.detail || "Audit failed. Connect Google / set PageSpeed key, or provide a URL.");
      return;
    }
    setMessage(
      `Audit saved · SEO fails ${data.payload?.counts?.seoFails ?? "—"} · Opportunities ${data.payload?.counts?.opportunities ?? "—"} · GSC findings ${data.payload?.counts?.gscFindings ?? "—"}`,
    );
    await refresh();
    setSection("overview");
  };

  const syncAll = async () => {
    setBusy(true);
    setMessage("Syncing GSC + GA4 + full Site Audit…");
    const response = await fetch("/api/v1/oauth/google/sync", { method: "POST", headers: authHeaders() });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage(data.detail || "Sync failed. Connect Google first.");
      return;
    }
    setMessage(`Sync done · PageSpeed ${data.synced?.pagespeed ? "on" : "off"} · GSC ${data.synced?.gsc ? "on" : "off"}`);
    await refresh();
  };

  return (
    <section className="mx-auto max-w-6xl pb-10">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Site</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${connected ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/50"}`}>
          {connected ? "live audit" : "demo / empty"}
        </span>
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] uppercase text-white/45">PageSpeed + GSC</span>
      </div>

      <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-tight sm:text-3xl">Site Audit</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
            {payload.summary || "Full Lighthouse report: category scores, Core Web Vitals, opportunities, diagnostics, SEO/a11y audits, plus related Search Console findings."}
          </p>
          {payload.finalUrl ? <p className="mt-2 text-xs text-brand">Final URL: {payload.finalUrl}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={runAudit} className="h-10 rounded-full bg-gradient-to-r from-blush to-brand px-4 text-sm font-semibold disabled:opacity-50">
            Run full audit
          </button>
          <button type="button" disabled={busy} onClick={syncAll} className="h-10 rounded-full border border-line px-4 text-sm disabled:opacity-50">
            Sync Google
          </button>
          <Link href="/site/on-page" className="inline-flex h-10 items-center rounded-full border border-brand/40 px-4 text-sm text-brand">
            On-page SEO
          </Link>
          <Link href="/market/organic-search" className="inline-flex h-10 items-center rounded-full border border-line px-4 text-sm text-white/70">
            GSC queries
          </Link>
        </div>
      </div>

      <form
        className="mt-5 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          runAudit();
        }}
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/ — leave blank to use connected GSC site"
          className="h-11 flex-1 rounded-xl border border-line bg-panel px-3 text-sm"
        />
        <button type="submit" disabled={busy} className="h-11 rounded-full bg-brand/30 px-5 text-sm font-medium text-brand disabled:opacity-50">
          Audit URL
        </button>
      </form>

      {message ? <p className="mt-3 text-sm text-brand">{message}</p> : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(kpis.length ? kpis : [["Rows", String(overviewRows.length)], ["Source", connected ? "Live" : "Demo"]]).slice(0, 6).map((kpi) => (
          <article key={kpi[0]} className="rounded-2xl border border-line bg-panel p-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{kpi[0]}</p>
            <p className="mt-2 font-sans text-xl font-semibold text-brand">{kpi[1]}</p>
          </article>
        ))}
      </div>

      {(counts.seoFails != null || counts.opportunities != null) && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/50">
          <span className="rounded-full bg-white/5 px-3 py-1">SEO fails: {counts.seoFails ?? "—"}</span>
          <span className="rounded-full bg-white/5 px-3 py-1">A11y fails: {counts.a11yFails ?? "—"}</span>
          <span className="rounded-full bg-white/5 px-3 py-1">Opportunities: {counts.opportunities ?? "—"}</span>
          <span className="rounded-full bg-white/5 px-3 py-1">Diagnostics: {counts.diagnostics ?? "—"}</span>
          <span className="rounded-full bg-white/5 px-3 py-1">GSC findings: {counts.gscFindings ?? "—"}</span>
        </div>
      )}

      {chartPanels ? <StudioPanels panels={chartPanels} /> : null}

      <div className="mt-6 flex gap-1 overflow-x-auto pb-1">
        {SECTIONS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${section === id ? "bg-brand text-white" : "bg-white/5 text-white/60"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {section === "overview" ? (
          <>
            <PanelTable title="Audit overview" columns={payload.columns || ["Item", "Mobile", "Desktop", "Note"]} rows={overviewRows} />
            <div className="grid gap-4">
              {tablePanels.slice(0, 3).map((panel) => (
                <PanelTable key={panel.title} title={panel.title} columns={panel.columns} rows={panel.rows} />
              ))}
            </div>
          </>
        ) : (
          <PanelTable
            title={sectionPanel?.title || SECTIONS.find((s) => s[0] === section)?.[1] || "Section"}
            columns={sectionPanel?.columns}
            rows={sectionPanel?.rows}
            empty={
              section === "gsc"
                ? "No GSC findings yet. Sync Search Console, then re-run the audit."
                : "Run a full audit to fill this section."
            }
          />
        )}

        {section === "overview" && tablePanels.length > 3 ? (
          <details className="rounded-2xl border border-line bg-panel p-4">
            <summary className="cursor-pointer text-sm text-brand">Show all audit tables ({tablePanels.length})</summary>
            <div className="mt-4 grid gap-4">
              {tablePanels.slice(3).map((panel) => (
                <PanelTable key={panel.title} title={panel.title} columns={panel.columns} rows={panel.rows} />
              ))}
            </div>
          </details>
        ) : null}
      </div>

      <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["/market/top-pages", "Top Pages (GSC)"],
          ["/market/organic-search", "Organic Search"],
          ["/links/backlinks", "Backlinks"],
          ["/site/on-page", "On-page SEO"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="rounded-2xl border border-line bg-panel px-4 py-3 text-sm hover:border-brand/40">
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}
