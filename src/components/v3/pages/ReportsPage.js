"use client";

import { useCallback, useEffect, useState } from "react";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import { usePageBoot } from "@/lib/usePageBoot";
import {
  changePath,
  deleteReportDefinition,
  featureKpi,
  featurePayload,
  getProductWorkspace,
  historyItems,
  listChanges,
  loadFeature,
  queueItems,
  runReportDefinition,
  saveReportDefinition,
  syncGoogleLive,
} from "@/lib/v1Api";

const CONTENT_LABELS = {
  gsc: "Search Console",
  ga4: "GA4",
  pagespeed: "PageSpeed",
  places: "Places",
  queue: "Work queue",
  history: "Change history",
  ads: "Google Ads",
};

export default function ReportsPage() {
  const toast = useV3Toast();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = usePageBoot((s) => s.getFeature("organic-search"));
  const [metrics, setMetrics] = useState({
    clicks: "—",
    impressions: "—",
    ctr: "—",
    position: "—",
    sessions: "—",
    engagement: "—",
    events: "—",
    psiMobile: "—",
    psiDesktop: "—",
    places: "—",
  });
  const [gscRows, setGscRows] = useState([]);
  const [pageRows, setPageRows] = useState([]);
  const [gaRows, setGaRows] = useState([]);
  const [psiRows, setPsiRows] = useState([]);
  const [history, setHistory] = useState([]);
  const [queue, setQueue] = useState(0);
  const [coverage, setCoverage] = useState({
    gsc: false,
    ga4: false,
    psi: false,
    places: false,
  });
  const [reports, setReports] = useState([]);
  const [draft, setDraft] = useState({
    name: "Weekly SEO report",
    contents: ["gsc", "ga4", "pagespeed", "queue"],
    recipients: "",
    schedule: "weekly",
  });
  const [exportText, setExportText] = useState("");

  const load = useCallback(async () => {
    const [ch, organic, traffic, psi, places, topPages, workspace] = await Promise.all([
      listChanges(),
      loadFeature("organic-search"),
      loadFeature("traffic-analytics"),
      loadFeature("site-audit"),
      loadFeature("local-seo"),
      loadFeature("top-pages"),
      getProductWorkspace({ force: true }),
    ]);
    setReports(workspace.data?.reports || []);
    const changes = Array.isArray(ch.data) ? ch.data : [];
    setHistory(historyItems(changes));
    setQueue(queueItems(changes).length);

    const gsc = featurePayload(organic);
    const ga = featurePayload(traffic);
    const speed = featurePayload(psi);
    const local = featurePayload(places);
    const pages = featurePayload(topPages);

    setGscRows((gsc.rows || []).slice(0, 8));
    setPageRows((pages.rows || []).slice(0, 8));
    setGaRows((ga.rows || []).slice(0, 8));
    setPsiRows((speed.rows || []).slice(0, 6));
    setCoverage({
      gsc: Boolean((gsc.rows || []).length || gsc.kpis?.length),
      ga4: Boolean((ga.rows || []).length || ga.kpis?.length),
      psi: Boolean((speed.rows || []).length || speed.kpis?.length),
      places: Boolean((local.rows || []).length),
    });
    setMetrics({
      clicks: featureKpi(gsc, "click", gsc.kpis?.[0]?.[1] || "—"),
      impressions: featureKpi(gsc, "impr", gsc.kpis?.[1]?.[1] || "—"),
      ctr: featureKpi(gsc, "ctr", gsc.kpis?.[2]?.[1] || "—"),
      position: featureKpi(gsc, "pos", gsc.kpis?.[3]?.[1] || "—"),
      sessions: featureKpi(ga, "session", ga.kpis?.[0]?.[1] || "—"),
      engagement: featureKpi(ga, "engag", ga.kpis?.[1]?.[1] || "—"),
      events: featureKpi(ga, "event", ga.kpis?.[2]?.[1] || ga.kpis?.[1]?.[1] || "—"),
      psiMobile: featureKpi(speed, "performance", speed.kpis?.[0]?.[1] || speed.rows?.[0]?.[1] || "—"),
      psiDesktop: featureKpi(speed, "desktop", speed.kpis?.[1]?.[1] || speed.rows?.[1]?.[1] || "—"),
      places: String((local.rows || []).length || "—"),
    });
    setBooted(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const prepare = async () => {
    setBusy(true);
    toast("Refreshing live Google sources for the report…");
    await syncGoogleLive();
    await load();
    setBusy(false);
    setReady(true);
    toast("Report ready — sources listed by API.");
  };

  const download = () => {
    const text = [
      "Searchify — Client report (source-specified)",
      "",
      "=== Google Search Console ===",
      `Clicks: ${metrics.clicks}`,
      `Impressions: ${metrics.impressions}`,
      `CTR: ${metrics.ctr}`,
      `Avg position: ${metrics.position}`,
      "Top queries:",
      ...(gscRows.length ? gscRows.map((r) => `  - ${r[0]} · clicks ${r[1]} · impr ${r[2]}`) : ["  (sync GSC)"]),
      "",
      "=== Google Analytics 4 ===",
      `Sessions: ${metrics.sessions}`,
      `Engagement: ${metrics.engagement}`,
      `Key events: ${metrics.events}`,
      "",
      "=== PageSpeed Insights ===",
      `Mobile performance: ${metrics.psiMobile}`,
      `Desktop: ${metrics.psiDesktop}`,
      "",
      "=== Google Places ===",
      `Listings synced: ${metrics.places}`,
      "",
      "=== Google Tag Manager ===",
      "Not a separate connector — events surface via GA4 when tags fire.",
      "",
      "=== Work completed ===",
      ...(history.length
        ? history.map((h) => `${changePath(h)}: ${h.status === "undone" ? "Restored" : "Metadata updated"}`)
        : ["No changes published."]),
      "",
      `Next: review ${queue} remaining metadata opportunities.`,
      "Performance comparisons do not establish causation.",
    ].join("\n");
    const u = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = u;
    a.download = "Searchify-report.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
    toast("Report downloaded.");
  };

  if (!booted) return <PageSkeleton />;

  return (
    <>
      <Hero
        label="Client reporting"
        line1="SHOW THE"
        line2="WORK."
        sub="Saved reports have contents, recipients, export, and a schedule — not an empty rail."
      />

      <div className="sf-box sf-gap">
        <div className="sf-row sf-between">
          <div>
            <h2>Report definitions</h2>
            <p>Choose what goes in, who receives it, and how often it should run.</p>
          </div>
          <Pill>{reports.length} saved</Pill>
        </div>
        <div className="sf-grid">
          <label className="sf-field">
            Report name
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label className="sf-field">
            Recipients (comma-separated)
            <input
              value={draft.recipients}
              onChange={(e) => setDraft({ ...draft, recipients: e.target.value })}
              placeholder="client@agency.com, account@agency.com"
            />
          </label>
        </div>
        <label className="sf-field">
          Schedule
          <select value={draft.schedule} onChange={(e) => setDraft({ ...draft, schedule: e.target.value })}>
            <option value="manual">Manual export</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <div>
          <div className="sf-small" style={{ marginBottom: 8 }}>
            Contents
          </div>
          <div className="sf-row" style={{ flexWrap: "wrap", gap: 8 }}>
            {Object.entries(CONTENT_LABELS).map(([id, label]) => {
              const on = draft.contents.includes(id);
              return (
                <Btn
                  key={id}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      contents: on ? draft.contents.filter((x) => x !== id) : [...draft.contents, id],
                    })
                  }
                >
                  {on ? "✓ " : ""}
                  {label}
                </Btn>
              );
            })}
          </div>
        </div>
        <Btn
          primary
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const res = await saveReportDefinition({
              name: draft.name,
              contents: draft.contents,
              recipients: draft.recipients.split(",").map((x) => x.trim()).filter(Boolean),
              schedule: draft.schedule,
            });
            setBusy(false);
            if (!res.ok) {
              toast(res.data?.detail || "Could not save report.");
              return;
            }
            toast("Report definition saved.");
            load();
          }}
        >
          Save report definition
        </Btn>
      </div>

      <div className="sf-list sf-gap">
        {reports.length ? (
          reports.map((row) => (
            <div className="sf-listrow" key={row.id}>
              <div>
                <div className="sf-row" style={{ marginBottom: 6 }}>
                  <h3>{row.name}</h3>
                  <Pill>{row.schedule}</Pill>
                </div>
                <div className="sf-small">
                  {(row.contents || []).map((c) => CONTENT_LABELS[c] || c).join(" · ") || "No contents"}
                </div>
                <div className="sf-small">
                  Recipients: {(row.recipients || []).join(", ") || "workspace only"}
                  {row.lastRunAt ? ` · Last export ${String(row.lastRunAt).slice(0, 19)}` : ""}
                </div>
              </div>
              <div className="sf-row">
                <Btn
                  primary
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    const res = await runReportDefinition(row.id);
                    setBusy(false);
                    if (!res.ok) {
                      toast(res.data?.detail || "Export failed.");
                      return;
                    }
                    setExportText(res.data?.text || "");
                    const blob = new Blob([res.data?.text || ""], { type: "text/plain" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `${row.name.replace(/\s+/g, "-")}.txt`;
                    a.click();
                    toast("Report exported.");
                    load();
                  }}
                >
                  Run + export
                </Btn>
                <Btn
                  onClick={async () => {
                    await deleteReportDefinition(row.id);
                    toast("Definition removed.");
                    load();
                  }}
                >
                  Delete
                </Btn>
              </div>
            </div>
          ))
        ) : (
          <div className="sf-empty">
            <h3>No saved reports yet</h3>
            <p>Define contents, recipients, and a schedule above. Then run an export.</p>
          </div>
        )}
      </div>

      {exportText ? (
        <div className="sf-box sf-gap">
          <h3>Last export</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{exportText}</pre>
        </div>
      ) : null}

      <div className="sf-box">
        <div className="sf-row sf-between">
          <div>
            <h2>Client SEO report</h2>
            <p>Source-specified · GSC · GA4 · PageSpeed · Places · change history</p>
          </div>
          <Btn primary onClick={prepare} disabled={busy}>
            {busy ? "Refreshing…" : ready ? "Refresh report" : "Prepare report"}
          </Btn>
        </div>
      </div>

      <div className="sf-box sf-gap">
        <h2>Data coverage by source</h2>
        <div className="sf-tablewrap">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Status</th>
                <th>Used on</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Google Search Console</td>
                <td>{coverage.gsc ? <Pill>Synced</Pill> : <Pill warn>Not synced</Pill>}</td>
                <td>Overview · Rankings · Keywords · Results · Reports</td>
              </tr>
              <tr>
                <td>Google Analytics 4</td>
                <td>{coverage.ga4 ? <Pill>Synced</Pill> : <Pill warn>Not synced</Pill>}</td>
                <td>AI analytics · Results · Reports</td>
              </tr>
              <tr>
                <td>PageSpeed Insights</td>
                <td>{coverage.psi ? <Pill>Synced</Pill> : <Pill warn>Not synced</Pill>}</td>
                <td>Results · Connections · Reports</td>
              </tr>
              <tr>
                <td>Google Places</td>
                <td>{coverage.places ? <Pill>Synced</Pill> : <Pill warn>Not synced</Pill>}</td>
                <td>Local · Results · Reports</td>
              </tr>
              <tr>
                <td>Google Tag Manager</td>
                <td>
                  <Pill neutral>Via GA4</Pill>
                </td>
                <td>Not a separate connector — tag events appear in GA4</td>
              </tr>
              <tr>
                <td>OpenAI</td>
                <td>
                  <Pill neutral>On demand</Pill>
                </td>
                <td>AI Visibility · drafts · enrichment</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {ready ? (
        <>
          <div className="sf-box sf-gap">
            <div className="sf-row sf-between">
              <h2>Search Console</h2>
              <Pill>GSC</Pill>
            </div>
            <div className="sf-three">
              <div>
                <div className="sf-small">Clicks</div>
                <div className="sf-metric" style={{ fontSize: 28 }}>{metrics.clicks}</div>
              </div>
              <div>
                <div className="sf-small">Impressions</div>
                <div className="sf-metric" style={{ fontSize: 28 }}>{metrics.impressions}</div>
              </div>
              <div>
                <div className="sf-small">CTR · Avg pos</div>
                <div className="sf-metric" style={{ fontSize: 28 }}>
                  {metrics.ctr} · {metrics.position}
                </div>
              </div>
            </div>
            {gscRows.length ? (
              <div className="sf-tablewrap" style={{ marginTop: 14 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Query</th>
                      <th>Clicks</th>
                      <th>Impr.</th>
                      <th>CTR / Pos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gscRows.map((r, i) => (
                      <tr key={i}>
                        <td>{r[0]}</td>
                        <td>{r[1]}</td>
                        <td>{r[2]}</td>
                        <td>
                          {r[3]} · {r[4]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: 13, marginTop: 10 }}>Sync Search Console to populate queries.</p>
            )}
            {pageRows.length ? (
              <>
                <h3 style={{ marginTop: 18 }}>Top pages · GSC</h3>
                <div className="sf-tablewrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Page</th>
                        <th>Clicks</th>
                        <th>Impr.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((r, i) => (
                        <tr key={i}>
                          <td>{r[0]}</td>
                          <td>{r[1]}</td>
                          <td>{r[2]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>

          <div className="sf-box sf-gap">
            <div className="sf-row sf-between">
              <h2>Google Analytics 4</h2>
              <Pill>GA4</Pill>
            </div>
            <p>
              {metrics.sessions} sessions · {metrics.engagement} engagement · {metrics.events} key events
            </p>
            {gaRows.length ? (
              <div className="sf-tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Dimension</th>
                      <th>Metric</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gaRows.map((r, i) => (
                      <tr key={i}>
                        <td>{r[0]}</td>
                        <td>{r[1]}</td>
                        <td>{r[2] ?? r[1]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="sf-small">Connect GA4 and sync for session-level rows.</div>
            )}
          </div>

          <div className="sf-box sf-gap">
            <div className="sf-row sf-between">
              <h2>PageSpeed Insights</h2>
              <Pill>PSI</Pill>
            </div>
            <p>
              Mobile performance {metrics.psiMobile}
              {metrics.psiDesktop !== "—" ? ` · Desktop ${metrics.psiDesktop}` : ""}
            </p>
            {psiRows.length ? (
              <div className="sf-tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Value</th>
                      <th>Context</th>
                    </tr>
                  </thead>
                  <tbody>
                    {psiRows.map((r, i) => (
                      <tr key={i}>
                        <td>{r[0]}</td>
                        <td>{r[1]}</td>
                        <td>{r[2] || r[3] || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          <div className="sf-box sf-gap">
            <div className="sf-row sf-between">
              <h2>Google Places</h2>
              <Pill>Places API</Pill>
            </div>
            <p>{metrics.places} listings stored for Local SEO context.</p>
          </div>

          <div className="sf-box sf-gap">
            <h2>Work completed</h2>
            {history.length ? (
              history.map((h) => (
                <p key={h.id}>
                  {changePath(h)} — {h.status === "undone" ? "Restored previous values" : "Metadata updated and verified"}
                </p>
              ))
            ) : (
              <p>No changes published yet.</p>
            )}
            <div className="sf-divider" />
            <h2>Next steps</h2>
            <p>
              Review {queue} remaining metadata opportunities. Monitor subsequent performance without attributing all
              changes to these edits.
            </p>
            <div className="sf-gap">
              <Btn onClick={download}>Download text report</Btn>
            </div>
          </div>
        </>
      ) : null}

      <div className="sf-note sf-gap">
        Each section is labeled by API source. Google Tag Manager is not ingested separately — use GA4 for tagged
        events. Sync from Connections if any source shows Not synced.
      </div>
    </>
  );
}
