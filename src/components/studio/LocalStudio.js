"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadFeatures, saveFeature, createAiDraft } from "@/lib/clientApi";
import { authHeaders } from "@/utils/users/Helpers";
import { ServiceLayout } from "@/components/studio/layouts";

const LOCAL_NAV = [
  { kind: "local-dashboard", title: "Dashboard", path: "/local" },
  { kind: "local-listings", title: "Listing Management", path: "/local/listings" },
  { kind: "local-reviews", title: "Review Management", path: "/local/reviews" },
  { kind: "local-gbp", title: "GBP Optimization", path: "/local/gbp" },
  { kind: "local-automations", title: "Automations", path: "/local/automations" },
  { kind: "local-ai-agent", title: "GBP AI Agent", path: "/local/ai-agent" },
  { kind: "local-competitors", title: "Competitive Analysis", path: "/local/competitors" },
  { kind: "local-map-ranks", title: "Map Rank Tracker", path: "/local/map-ranks" },
];

const META = {
  "local-dashboard": {
    title: "Local Dashboard",
    blurb: "Visibility KPIs from Places sync — competitors, ratings, and listing health.",
    accent: "Overview",
  },
  "local-listings": {
    title: "Listing Management",
    blurb: "Directory accuracy plus competitor Places entries. Add or correct listings here.",
    accent: "Directories",
  },
  "local-reviews": {
    title: "Review Management",
    blurb: "Review volume and ratings. Queue AI replies for waiting items.",
    accent: "Reputation",
  },
  "local-gbp": {
    title: "GBP Optimization",
    blurb: "Google Business Profile checklist. Toggle items as you complete them.",
    accent: "Checklist",
  },
  "local-automations": {
    title: "Automations",
    blurb: "Scheduled local tasks including Google Sync. Pause or activate each job.",
    accent: "Schedule",
  },
  "local-ai-agent": {
    title: "GBP AI Agent",
    blurb: "Suggested review replies. Generate with Astra/Luna, approve before send.",
    accent: "AI drafts",
  },
  "local-competitors": {
    title: "Competitive Analysis",
    blurb: "Live Google Places rivals near your brand. Refresh anytime.",
    accent: "Places",
  },
  "local-map-ranks": {
    title: "Map Rank Tracker",
    blurb: "Map-pack style positions derived from Places order. Save keyword sets.",
    accent: "Map pack",
  },
};

export default function LocalStudio({ kind }) {
  const meta = META[kind] || META["local-dashboard"];
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftValue, setDraftValue] = useState("");

  const refresh = async () => {
    setRecords(await loadFeatures(kind));
  };

  useEffect(() => {
    refresh();
  }, [kind]);

  const live = records.find((r) => r.payload?.seedVersion === "google-live-v1");
  const payload = live?.payload || records.find((r) => r.payload?.rows)?.payload || {};
  const columns = payload.columns || ["Item", "Detail"];
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const kpis = payload.kpis || [];
  const panels = payload.panels && !Array.isArray(payload.panels) ? payload.panels : null;
  const connected = payload.seedVersion === "google-live-v1";

  const stats = useMemo(() => {
    if (kpis?.length) return kpis;
    return [
      ["Rows", String(rows.length)],
      ["Source", connected ? "Google live" : "Demo"],
      ["Tool", meta.accent],
    ];
  }, [kpis, rows.length, connected, meta.accent]);

  const syncGoogle = async () => {
    setBusy(true);
    setMessage("Syncing Google + Places into Local tools…");
    const response = await fetch("/api/v1/oauth/google/sync", { method: "POST", headers: authHeaders() });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage(data.detail || "Connect Google first from Get Started, then Sync.");
      return;
    }
    setMessage(
      `Synced · Places ${data.synced?.places ? "on" : "off"} · GSC ${data.synced?.gsc ? "on" : "off"} · GA4 ${data.synced?.ga4 ? "on" : "off"}`,
    );
    await refresh();
  };

  const refreshPlaces = async () => {
    setBusy(true);
    setMessage("Refreshing Places…");
    const response = await fetch("/api/v1/oauth/google/places", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage(data.detail || "Places refresh failed.");
      return;
    }
    setMessage(`Places refreshed · ${data.count || 0} results`);
    await refresh();
  };

  const toggleRowStatus = async (index, nextStatus) => {
    const next = rows.map((row, i) => {
      if (i !== index) return row;
      const copy = [...row];
      if (kind === "local-gbp") copy[1] = nextStatus;
      else if (kind === "local-automations") copy[1] = nextStatus;
      else if (kind === "local-ai-agent") copy[2] = nextStatus;
      else if (kind === "local-listings") copy[1] = nextStatus;
      return copy;
    });
    setBusy(true);
    const response = await saveFeature(kind, live?.title || meta.title, {
      ...payload,
      rows: next,
      seedVersion: payload.seedVersion || "local-edit-v1",
      source: payload.source || "local_studio",
    });
    setBusy(false);
    if (!response.ok) {
      setMessage("Sign in to save changes.");
      return;
    }
    setMessage("Saved.");
    await refresh();
  };

  const addRow = async () => {
    if (!draftName.trim()) return;
    const extra =
      kind === "local-listings"
        ? [draftName.trim(), "Needs update", draftValue || "—", "No", "No"]
        : kind === "local-map-ranks"
          ? [draftName.trim(), draftValue || "10", "0", "—", "—"]
          : kind === "local-automations"
            ? [draftName.trim(), "Active", draftValue || "Tomorrow", "Manual"]
            : [draftName.trim(), draftValue || "Open", "—"];
    const response = await saveFeature(kind, `${meta.title} note`, {
      summary: payload.summary || meta.blurb,
      columns,
      rows: [...rows, extra],
      seedVersion: "local-edit-v1",
      source: "local_studio",
    });
    if (!response.ok) {
      setMessage("Sign in to add rows.");
      return;
    }
    setDraftName("");
    setDraftValue("");
    setMessage("Row added.");
    await refresh();
  };

  const generateReply = async (row) => {
    setBusy(true);
    setMessage("Generating AI reply…");
    const response = await createAiDraft({
      kind: "local-ai-agent",
      brief: `Write a short professional Google Business review reply for: "${row[0]}". Suggested angle: ${row[1]}. Rating: ${row[3]}. Keep under 60 words. Do not claim we already fixed anything unverified.`,
      writingType: "review reply",
      tokens: 200,
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setMessage(data.detail || "AI draft failed.");
      return;
    }
    const text = data.body || data.draft || data.text || data.content || "";
    if (!text) {
      setMessage(data.detail || "AI draft returned empty.");
      return;
    }
    const next = rows.map((r) => (r[0] === row[0] ? [r[0], text, "Draft", r[3], r[4]] : r));
    await saveFeature(kind, "GBP AI Agent", {
      ...payload,
      rows: next,
      seedVersion: payload.seedVersion || "local-edit-v1",
      source: payload.source || "local_studio",
    });
    setMessage("AI draft saved — still needs a person to send.");
    await refresh();
  };

  return (
    <section className="mx-auto max-w-6xl pb-10">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">Local</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${connected ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/50"}`}>
          {connected ? "connected" : "demo"}
        </span>
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] uppercase text-white/45">{meta.accent}</span>
      </div>

      <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-semibold tracking-tight sm:text-3xl">{meta.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">{payload.summary || meta.blurb}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={syncGoogle} className="h-10 rounded-full bg-gradient-to-r from-blush to-brand px-4 text-sm font-semibold disabled:opacity-50">
            Sync Google → Local
          </button>
          {(kind === "local-competitors" || kind === "local-dashboard") && (
            <button type="button" disabled={busy} onClick={refreshPlaces} className="h-10 rounded-full border border-line px-4 text-sm disabled:opacity-50">
              Refresh Places
            </button>
          )}
          <Link href="/market/google-services" className="inline-flex h-10 items-center rounded-full border border-brand/40 px-4 text-sm text-brand">
            Google hub
          </Link>
        </div>
      </div>

      <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {LOCAL_NAV.map((item) => (
          <Link
            key={item.kind}
            href={item.path}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${item.kind === kind ? "bg-brand text-white" : "bg-white/5 text-white/60 hover:text-white"}`}
          >
            {item.title}
          </Link>
        ))}
      </nav>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {stats.slice(0, 3).map((kpi) => (
          <article key={kpi[0]} className="rounded-2xl border border-line bg-panel p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-white/45">{kpi[0]}</p>
            <p className="mt-2 font-sans text-2xl font-semibold text-brand">{kpi[1]}</p>
          </article>
        ))}
      </div>

      {message ? <p className="mt-4 text-sm text-brand">{message}</p> : null}

      <div className="mt-6">
        <ServiceLayout kind={kind} columns={columns} rows={rows} panels={panels} kpis={kpis} />
      </div>

      <div className="studio-scroll mt-6 overflow-x-auto rounded-2xl border border-line bg-panel">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.08em] text-brand">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-medium">
                  {column}
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row[0]}-${index}`} className="border-t border-white/5">
                {columns.map((_, cell) => (
                  <td key={cell} className="px-4 py-3">
                    {row[cell] || "—"}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {kind === "local-gbp" || kind === "local-listings" ? (
                      <>
                        <button type="button" disabled={busy} onClick={() => toggleRowStatus(index, "Complete")} className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] text-emerald-200">
                          Done
                        </button>
                        <button type="button" disabled={busy} onClick={() => toggleRowStatus(index, "Needs update")} className="rounded-full bg-amber-300/15 px-2 py-1 text-[10px] text-amber-100">
                          Needs work
                        </button>
                      </>
                    ) : null}
                    {kind === "local-automations" ? (
                      <>
                        <button type="button" disabled={busy} onClick={() => toggleRowStatus(index, "Active")} className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] text-emerald-200">
                          Active
                        </button>
                        <button type="button" disabled={busy} onClick={() => toggleRowStatus(index, "Paused")} className="rounded-full bg-white/10 px-2 py-1 text-[10px]">
                          Pause
                        </button>
                      </>
                    ) : null}
                    {kind === "local-ai-agent" ? (
                      <>
                        <button type="button" disabled={busy} onClick={() => generateReply(row)} className="rounded-full bg-brand/25 px-2 py-1 text-[10px] text-brand">
                          AI rewrite
                        </button>
                        <button type="button" disabled={busy} onClick={() => toggleRowStatus(index, "Approved")} className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] text-emerald-200">
                          Approve
                        </button>
                      </>
                    ) : null}
                    {kind === "local-map-ranks" || kind === "local-competitors" ? (
                      <span className="text-[10px] text-white/35">Live order</span>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td className="px-4 py-10 text-white/50" colSpan={columns.length + 1}>
                  No local rows yet. Sync Google to pull Places into every Local tool.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {(kind === "local-listings" || kind === "local-map-ranks" || kind === "local-automations" || kind === "local-gbp") && (
        <form
          className="mt-4 grid gap-3 rounded-2xl border border-line bg-panel p-5 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            addRow();
          }}
        >
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder={kind === "local-map-ranks" ? "Keyword" : kind === "local-automations" ? "Task name" : "Name"}
            className="h-11 rounded-xl border border-line bg-ink px-3"
          />
          <input
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            placeholder={kind === "local-map-ranks" ? "Position" : "Detail"}
            className="h-11 rounded-xl border border-line bg-ink px-3"
          />
          <button type="submit" className="h-11 rounded-full bg-brand/30 px-5 text-sm font-medium text-brand">
            Add
          </button>
        </form>
      )}
    </section>
  );
}
