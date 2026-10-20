"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildAuditFindings, weekMovement } from "@/lib/auditFindings";
import { applyPlanDates, contentPlan, readMonthDates } from "@/lib/monthReport";
import { listedRows, readPhoneReport, writePhoneReport } from "@/lib/phoneReport";
import { listChanges, loadFeature, pushPublicKey, pushSubscribe, pushWeekly, researchKeywords } from "@/lib/v1Api";
import { useWorkspaceSite } from "@/components/board/useBusinessBrief";

const WAITING = new Set(["proposed", "awaiting_approval"]);

function readDone(siteKey) {
  if (!siteKey) return [];
  try {
    const all = JSON.parse(window.localStorage.getItem("sf-issues-done") || "{}");
    return Array.isArray(all[siteKey]) ? all[siteKey] : [];
  } catch {
    return [];
  }
}

function severityLabel(severity) {
  if (severity === "Critical") return "Error";
  return severity || "Notice";
}

function visibilityLine(siteKey) {
  try {
    const store = JSON.parse(window.localStorage.getItem("sf_research_v1") || "{}");
    const bag = store.promptsBySite || {};
    const prompts = (Array.isArray(bag[siteKey]) ? bag[siteKey] : []).filter((row) => row && row.live && row.mention != null && row.status !== "error");
    if (!prompts.length) return "AI visibility: no stored check yet.";
    const named = (value) => value === true || value === "Mentioned" || value === "Cited";
    const mentioned = prompts.filter((row) => named(row.mention)).length;
    const cited = prompts.filter((row) => row.citation === true || row.citation === "Cited").length;
    return `AI visibility: ${mentioned} of ${prompts.length} stored answers name the business, and ${cited} link to the site.`;
  } catch {
    return "AI visibility: no stored check yet.";
  }
}

function payloadOf(res) {
  return res?.data?.payload || {};
}

export default function PhoneHome() {
  const { brief, key: siteKey } = useWorkspaceSite("results");
  const [report, setReport] = useState(null);
  const [planDates, setPlanDates] = useState({});
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [alertNote, setAlertNote] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setInstalled(standalone);
    const onPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    setPlanDates(readMonthDates(siteKey));
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey) {
      setLoading(false);
      return undefined;
    }
    let cancel = false;
    const saved = readPhoneReport(siteKey);
    if (saved) setReport(saved);
    setLoading(true);
    const site = brief.siteUrl || (brief.hostname ? `https://${brief.hostname}` : "");
    Promise.all([
      loadFeature("organic-search"),
      loadFeature("top-pages"),
      loadFeature("site-audit"),
      listChanges(),
      site ? researchKeywords({ site, storedOnly: true }).catch(() => null) : Promise.resolve(null),
    ]).then(([queries, pages, audit, changes, keywordRes]) => {
      if (cancel) return;
      const changeRows = Array.isArray(changes.data) ? changes.data : [];
      const built = buildAuditFindings({ audit, pages, queries, changes: changeRows });
      const done = new Set(readDone(siteKey).map((row) => row.id));
      const queryRows = payloadOf(queries).rows || [];
      const ideas = keywordRes?.ok ? keywordRes.data?.ideas : null;
      const next = {
        savedAt: new Date().toISOString(),
        host: brief.hostname || "",
        weeks: weekMovement(payloadOf(queries).daily),
        queries: listedRows(payloadOf(queries).rows),
        pages: listedRows(payloadOf(pages).rows),
        issues: (built.findings || [])
          .filter((item) => !done.has(item.id))
          .slice(0, 12)
          .map((item) => ({
            id: item.id,
            severity: item.severity,
            name: item.name,
            evidence: item.evidence,
            fix: item.fix,
            steps: item.steps || [],
            pages: item.pages || [],
          })),
        approvals: changeRows
          .filter((change) => WAITING.has(change.status))
          .slice(0, 12)
          .map((change) => ({
            id: change.id,
            name: change.opportunity || change.change_type || "Update",
            url: change.target_url || "",
            type: change.change_type || "",
            status: change.status,
          })),
        visibility: visibilityLine(siteKey),
        month: contentPlan({ ideas, queries: queryRows, changes: changeRows }),
      };
      writePhoneReport(siteKey, next);
      setReport(next);
      setOffline(false);
      if (next.weeks) pushWeekly().catch(() => {});
    }).catch(() => {
      if (!cancel) setOffline(true);
    }).finally(() => {
      if (!cancel) setLoading(false);
    });
    return () => {
      cancel = true;
    };
  }, [siteKey, brief.hostname, brief.siteUrl]);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    setInstallEvent(null);
  };

  const enableAlerts = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setAlertNote("This browser cannot receive phone alerts.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setAlertNote("Alerts stay off until notification permission is allowed.");
        return;
      }
      await navigator.serviceWorker.register("/sw.js");
      const registration = await navigator.serviceWorker.ready;
    const key = await pushPublicKey();
    if (!key.ok || !key.data?.publicKey) {
      setAlertNote("Phone alerts are not available on the server yet.");
      return;
    }
    const padding = "=".repeat((4 - (key.data.publicKey.length % 4)) % 4);
    const base64 = `${key.data.publicKey}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
    const raw = window.atob(base64);
    const bytes = new Uint8Array(raw.length);
    for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
    const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
    const saved = await pushSubscribe(subscription.toJSON());
    setAlertNote(saved.ok ? "Alerts are on for this phone. A tap opens the card and does not publish." : "The phone could not be saved for alerts.");
    } catch {
      setAlertNote("Alerts could not be turned on from this browser.");
    }
  };

  const weeks = report?.weeks;
  const savedLabel = report?.savedAt ? new Date(report.savedAt).toLocaleString() : "";
  const monthRows = applyPlanDates(report?.month?.rows, planDates).slice(0, 4);

  return (
    <section className="dash-view extension-view">
      <header className="w-head">
        <div>
          <div className="dash-eyebrow">PHONE</div>
          <h1>This week on {report?.host || brief.hostname || "this site"}.</h1>
          <p>The same login as the workspace. Approving still happens on the review card. Nothing on this screen is published.</p>
        </div>
        <div className="w-actions">
          {installEvent && !installed ? (
            <button className="w-button primary" type="button" onClick={install}>Add to home screen</button>
          ) : null}
          <button className="w-button" type="button" onClick={enableAlerts}>Turn on alerts</button>
        </div>
      </header>
      {installed ? <p className="w-footnote">Opened from the home screen.</p> : null}
      {alertNote ? <p className="w-inset" role="status">{alertNote}</p> : null}
      {!installEvent && !installed ? <p className="w-footnote">On iPhone, use Share, then Add to Home Screen. On Chrome, Add to home screen appears after this page has loaded once.</p> : null}
      {offline ? <p className="w-inset" role="status">Offline. This is the last saved report{savedLabel ? ` from ${savedLabel}` : ""}. Publishing waits until you are connected.</p> : null}
      {loading && !report ? <p className="w-inset">Loading the last Search Console window and the open approvals.</p> : null}

      <div className="w-metrics">
        <div className="w-metric"><span>Clicks</span><strong>{weeks ? weeks.current.clicks.toLocaleString("en-US") : "—"}</strong><small>{weeks ? `Last week ${weeks.previous.clicks.toLocaleString("en-US")}` : "Needs 14 stored days"}</small></div>
        <div className="w-metric"><span>Impressions</span><strong>{weeks ? weeks.current.impressions.toLocaleString("en-US") : "—"}</strong><small>{weeks ? `Last week ${weeks.previous.impressions.toLocaleString("en-US")}` : "Needs 14 stored days"}</small></div>
        <div className="w-metric"><span>Average position</span><strong>{weeks?.current.position == null ? "—" : String(weeks.current.position)}</strong><small>{weeks ? `Last week ${weeks.previous.position == null ? "—" : weeks.previous.position}. Where the site showed, not a ranking promise.` : "Needs 14 stored days"}</small></div>
      </div>
      <p className="w-footnote">{report?.visibility || "AI visibility: no stored check yet."}</p>

      <div className="w-panel">
        <div className="w-toolbar"><strong>Waiting for approval</strong><Link className="w-button" href="/app/queue">Open the queue</Link></div>
        {report?.approvals?.length ? (
          <ul className="path-list">
            {report.approvals.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong>
                {item.url ? <code> {item.url}</code> : null}
                {offline ? <span> Review when you are back online.</span> : <Link href={`/app/queue/${item.id}`}> Review</Link>}
              </li>
            ))}
          </ul>
        ) : <p className="w-inset">No title or page drafts are waiting.</p>}
      </div>

      <div className="w-panel">
        <div className="w-toolbar"><strong>Open issues</strong><Link className="w-button" href="/app/results">Open the site audit</Link></div>
        {report?.issues?.length ? (
          <ul className="path-list">
            {report.issues.map((item) => (
              <li key={item.id}>
                <span className={`w-pill ${item.severity === "Critical" ? "danger" : item.severity === "Warning" ? "warn" : ""}`.trim()}>{severityLabel(item.severity)}</span>
                {" "}{item.name}
                {" "}<button className="w-button" type="button" onClick={() => setOpen(item)}>Help</button>
              </li>
            ))}
          </ul>
        ) : <p className="w-inset">No open issues in the last saved audit.</p>}
      </div>

      <div className="w-panel">
        <h2>Top queries</h2>
        {report?.queries?.length ? (
          <ul className="path-list">
            {report.queries.map((row) => (
              <li key={row.label}>{row.label} · {row.clicks.toLocaleString("en-US")} clicks · position {row.position}</li>
            ))}
          </ul>
        ) : <p className="w-inset">Search Console queries appear after Google is synced.</p>}
        <h2>Top pages</h2>
        {report?.pages?.length ? (
          <ul className="path-list">
            {report.pages.map((row) => {
              const issue = (report.issues || []).find((item) => (item.pages || []).some((page) => String(page).includes(row.label) || String(row.label).includes(page)));
              return (
                <li key={row.label}>
                  {row.label} · {row.clicks.toLocaleString("en-US")} clicks
                  {issue ? <button className="w-button" type="button" onClick={() => setOpen(issue)}>Open issue</button> : <span> No open issue on this page.</span>}
                </li>
              );
            })}
          </ul>
        ) : <p className="w-inset">Top pages appear after Google is synced.</p>}
      </div>

      <div className="w-panel">
        <div className="w-toolbar"><strong>This month</strong><Link className="w-button" href="/app/month">Open the month</Link></div>
        {monthRows.length ? (
          <ul className="path-list">
            {monthRows.map((row) => (
              <li key={row.keyword}>
                <strong>{row.keyword}</strong>
                {" · "}{row.status}
                {row.date ? ` · ${row.date}` : " · no publish date"}
              </li>
            ))}
          </ul>
        ) : (
          <p className="w-inset">
            {report?.month?.state === "needs-console"
              ? "Search Console has no stored queries, so the month does not guess what is already covered."
              : report?.month?.state === "covered"
                ? "Every stored keyword idea already appears in Search Console."
                : "Keyword ideas are not stored yet. The month page does not start a new research lookup."}
          </p>
        )}
        <p className="w-footnote">These are stored ideas that are not Search Console queries. A date does not publish.</p>
      </div>

      <p className="w-footnote">Keyword tables, the crawl, and billing stay in the workspace. <Link href="/app/keywords">Keywords</Link> · <Link href="/app/month">Month</Link> · <Link href="/app">Overview</Link></p>

      {open ? (
        <div className="w-panel" role="dialog" aria-label={open.name}>
          <h2>{open.name}</h2>
          <p>{open.fix}</p>
          <div className="w-inset"><strong>What Searchify found</strong><p>{open.evidence}</p></div>
          {open.steps?.length ? (
            <ol className="path-list">{open.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          ) : null}
          <div className="w-actions">
            <button className="w-button" type="button" onClick={() => setOpen(null)}>Close</button>
            {offline ? <span>Preparing a draft waits for a connection.</span> : <Link className="w-button primary" href="/app/results">Prepare it in the site audit</Link>}
          </div>
          <p className="w-footnote">Help does not publish.</p>
        </div>
      ) : null}
    </section>
  );
}
