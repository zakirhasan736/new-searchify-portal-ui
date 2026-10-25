"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildAuditFindings } from "@/lib/auditFindings";
import { applyPlanDates, clickHalves, contentPlan, issueCounts, monthEmail, publishedRows, readMonthDates, writeMonthDates } from "@/lib/monthReport";
import { listedRows } from "@/lib/phoneReport";
import { listChanges, loadFeature, researchKeywords } from "@/lib/v1Api";
import { useWorkspaceSite } from "@/components/board/useBusinessBrief";

function visibilityLine(siteKey) {
  try {
    const store = JSON.parse(window.localStorage.getItem("sf_research_v1") || "{}");
    const prompts = (store.promptsBySite?.[siteKey] || []).filter((row) => row && row.live && row.mention != null && row.status !== "error");
    if (!prompts.length) return "AI visibility: no stored check yet.";
    const named = (value) => value === true || value === "Mentioned" || value === "Cited";
    const mentioned = prompts.filter((row) => named(row.mention)).length;
    const cited = prompts.filter((row) => row.citation === true || row.citation === "Cited").length;
    return `AI visibility: ${mentioned} of ${prompts.length} stored answers name the business, and ${cited} link to the site.`;
  } catch {
    return "AI visibility: no stored check yet.";
  }
}

export default function MonthView() {
  const { brief, key: siteKey } = useWorkspaceSite("results");
  const [changes, setChanges] = useState([]);
  const [pages, setPages] = useState([]);
  const [halves, setHalves] = useState(null);
  const [issues, setIssues] = useState([]);
  const [dates, setDates] = useState({});
  const [planState, setPlanState] = useState({ state: "needs-ideas", rows: [] });
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDates(readMonthDates(siteKey));
  }, [siteKey]);

  useEffect(() => {
    if (!siteKey) {
      setLoading(false);
      return undefined;
    }
    let cancel = false;
    setLoading(true);
    const site = brief.siteUrl || (brief.hostname ? `https://${brief.hostname}` : "");
    Promise.all([
      loadFeature("organic-search"),
      loadFeature("top-pages"),
      loadFeature("site-audit"),
      listChanges(),
      site ? researchKeywords({ site, storedOnly: true }) : Promise.resolve(null),
    ]).then(([queries, pageRes, audit, changeRes, keywordRes]) => {
      if (cancel) return;
      const changeRows = Array.isArray(changeRes.data) ? changeRes.data : [];
      const built = buildAuditFindings({ audit, pages: pageRes, queries, changes: changeRows });
      const queryRows = queries?.data?.payload?.rows || queries?.data?.rows || [];
      const ideas = keywordRes?.ok ? keywordRes.data?.ideas : null;
      setChanges(changeRows);
      setPages(listedRows(pageRes?.data?.payload?.rows));
      setHalves(clickHalves(queries?.data?.payload?.daily));
      setIssues(built.findings || []);
      setPlanState(contentPlan({ ideas, queries: queryRows, changes: changeRows }));
    }).catch(() => {
      if (!cancel) setNote("The month could not be loaded. Sync Google, then open this page again.");
    }).finally(() => {
      if (!cancel) setLoading(false);
    });
    return () => {
      cancel = true;
    };
  }, [siteKey, brief.siteUrl, brief.hostname]);

  const plan = applyPlanDates(planState.rows, dates);
  const published = publishedRows(changes, pages);
  const counts = issueCounts(issues);
  const fell = halves && halves.latest.clicks < halves.earlier.clicks;
  const monthName = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  const setDate = (keyword, date) => {
    const next = { ...dates, [String(keyword || "").toLowerCase()]: date };
    setDates(next);
    if (siteKey) writeMonthDates(siteKey, next);
  };

  const copyEmail = async () => {
    const text = monthEmail({
      host: brief.hostname,
      halves,
      published,
      counts,
      visibility: visibilityLine(siteKey),
      plan,
    });
    try {
      await navigator.clipboard.writeText(text);
      setNote("Monthly email copied. A drop in clicks is included when the latest 14 days are lower.");
    } catch {
      setNote(text);
    }
  };

  return (
    <section className="dash-view extension-view">
      <header className="w-head">
        <div>
          <div className="dash-eyebrow">MONTH</div>
          <h1>{monthName}</h1>
          <p>The plan is stored keyword ideas that Search Console does not already list. Each row shows the draft status and a date you choose. Choosing a date does not publish. A fall in clicks stays in the email.</p>
        </div>
        <button className="w-button" type="button" onClick={copyEmail}>Copy the monthly email</button>
      </header>
      {note ? <p className="w-inset" role="status">{note}</p> : null}
      {loading ? <p className="w-inset">Loading this month.</p> : null}

      <div className="w-metrics">
        <div className="w-metric">
          <span>Clicks, latest 14 days</span>
          <strong>{halves ? halves.latest.clicks.toLocaleString("en-US") : "—"}</strong>
          <small>{halves ? (fell ? `Fell from ${halves.earlier.clicks.toLocaleString("en-US")} in the 14 days before` : `Earlier 14 days ${halves.earlier.clicks.toLocaleString("en-US")}`) : "Needs 28 stored days"}</small>
        </div>
        <div className="w-metric">
          <span>Impressions</span>
          <strong>{halves ? halves.latest.impressions.toLocaleString("en-US") : "—"}</strong>
          <small>{halves ? `Earlier ${halves.earlier.impressions.toLocaleString("en-US")}` : "Needs 28 stored days"}</small>
        </div>
        <div className="w-metric">
          <span>Still open</span>
          <strong>{String(counts.errors + counts.warnings + counts.notices)}</strong>
          <small>{`${counts.errors} errors · ${counts.warnings} warnings · ${counts.notices} notices`}</small>
        </div>
      </div>

      <div className="w-panel">
        <h2>Content plan</h2>
        {plan.length ? (
          <ul className="path-list">
            {plan.map((row) => (
              <li key={row.keyword}>
                <strong>{row.keyword}</strong>
                {" · "}{row.status}
                {" · "}
                <label>
                  Publish date
                  <input type="date" value={row.date} onChange={(event) => setDate(row.keyword, event.target.value)} />
                </label>
                {row.changeId ? <Link href={`/app/queue/${row.changeId}`}> Open card</Link> : <span> No draft yet.</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="w-inset">
            {planState.state === "needs-console"
              ? "Search Console has no stored queries, so this plan does not guess which keywords are already covered."
              : planState.state === "covered"
                ? "Every stored keyword idea already appears in Search Console."
                : "Keyword ideas are not stored yet. Open Keywords and load them there. This page does not start a new research lookup."}
          </p>
        )}
        <p className="w-footnote">A keyword is left out when the same words are a stored Search Console query. A date stays in this browser and does not publish.</p>
      </div>

      <div className="w-panel">
        <h2>Published</h2>
        {published.length ? (
          <ul className="path-list">
            {published.map((row) => (
              <li key={row.id}>
                <strong>{row.name}</strong>
                {row.clicks == null ? " · no stored Search Console row for this URL" : ` · ${row.clicks.toLocaleString("en-US")} clicks · position ${row.position ?? "—"}`}
              </li>
            ))}
          </ul>
        ) : <p className="w-inset">No approved update is marked published yet.</p>}
        <p className="w-footnote">Page clicks are the stored Search Console window, not a before-and-after for that URL. The site-level click change is the pair of 14-day windows above.</p>
      </div>

      <p className="w-footnote"><Link href="/app/queue">Approval queue</Link> · <Link href="/app/keywords">Keywords</Link></p>
    </section>
  );
}
