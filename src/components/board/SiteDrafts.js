"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { hostnameOf } from "@/lib/businessBrief";
import { breadthKey, loadGuardrails } from "@/lib/guardrails";
import { setSiteAnswer } from "@/lib/journey";
import { errorText, getSiteScan, listChanges, proposeFromGsc, runSiteScan } from "@/lib/v1Api";
import DraftChecks, { isHomepage, pageTypeLabel, statusLabel } from "@/components/board/DraftChecks";

const OPEN = new Set(["awaiting_approval", "proposed", "approved", "failed", "needs_review"]);

function detail(res, fallback) {
  return errorText(res, fallback);
}

function homeFirst(rows) {
  return [...rows].sort((a, b) => Number(isHomepage(b)) - Number(isHomepage(a)));
}

export default function SiteDrafts({ site, brief, onCount, showScanDetails = true }) {
  const host = brief.hostname;
  const [scan, setScan] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("");
  const [note, setNote] = useState("");
  const [rivals, setRivals] = useState(String(site?.answers?.competitors || ""));
  const [failed, setFailed] = useState([]);

  const load = async () => {
    const [scanRes, changesRes] = await Promise.all([
      brief.siteUrl ? getSiteScan(brief.siteUrl) : Promise.resolve({ ok: true, data: { scan: null } }),
      listChanges({ force: true }),
    ]);
    setScan(scanRes.ok ? scanRes.data?.scan || null : null);
    const rows = Array.isArray(changesRes.data) ? changesRes.data : [];
    const mine = rows.filter((row) => OPEN.has(row.status) && row.changeType === "meta" && (!host || hostnameOf(row.targetUrl) === host));
    setDrafts(homeFirst(mine));
    onCount?.(mine.length);
  };

  useEffect(() => {
    setLoading(true);
    setRivals(String(site?.answers?.competitors || ""));
    load().catch(() => setNote("The drafts could not be loaded. Try again in a moment.")).finally(() => setLoading(false));
  }, [site?.id, host]);

  const saveRivals = () => {
    if (site?.id) setSiteAnswer(site.id, "competitors", rivals.trim());
  };

  const run = async ({ force = false, readFirst = true } = {}) => {
    saveRivals();
    setNote("");
    if (readFirst) {
      setStep(`Reading every page on ${host || "the website"}…`);
      const scanned = await runSiteScan({ force });
      if (!scanned.ok) {
        setStep("");
        setNote(detail(scanned, "The website could not be read. Check that the address in setup is public."));
        return;
      }
      setScan(scanned.data?.scan || null);
    }
    setStep("Comparing competitors and writing a title and description for each page…");
    const res = await proposeFromGsc({ breadth: breadthKey(loadGuardrails().breadth), limit: 6 });
    setStep("");
    if (!res.ok) {
      setNote(detail(res, "The drafts could not be written. Try again in a moment."));
      return;
    }
    if (res.data?.scan) setScan(res.data.scan);
    setFailed(res.data?.failed || []);
    setNote(res.data?.created
      ? `${res.data.created} new draft${res.data.created === 1 ? "" : "s"} written.${res.data.remaining ? ` ${res.data.remaining} more page${res.data.remaining === 1 ? " is" : "s are"} ready to draft.` : ""}`
      : res.data?.reason || "No new drafts were needed.");
    await load();
  };

  const left = scan ? Math.max(0, (scan.draftable || 0) - (scan.covered || 0)) : 0;

  return (
    <section className="w-panel scan-panel" aria-labelledby="scan-title">
      <div className="scan-head">
        <div>
          <div className="dash-eyebrow">{showScanDetails ? "WHOLE-SITE TITLES" : "NEEDS YOUR APPROVAL"}</div>
          <h2 id="scan-title">
            {showScanDetails
              ? (scan ? `${scan.pagesRead} pages read on ${scan.host || host}` : `Read every page on ${host || "your website"}`)
              : (drafts.length
                ? `${drafts.length} title${drafts.length === 1 ? "" : "s"} waiting for approval`
                : "Title and description drafts")}
          </h2>
        </div>
        {showScanDetails && scan?.scannedAt ? <span className="w-pill good">Read {new Date(`${scan.scannedAt}Z`).toLocaleDateString()}</span> : null}
        {!showScanDetails && drafts.length ? <Link className="w-button" href="/app/queue">Open approval queue</Link> : null}
      </div>

      {loading ? (
        <div className="audit-loading" role="status"><span className="audit-loading-mark" aria-hidden="true" /><strong>Loading drafts</strong></div>
      ) : (
        <>
          {showScanDetails ? (
            scan ? (
              <>
                {scan.business ? <p className="scan-business">{scan.business}</p> : null}
                <div className="w-metrics scan-metrics">
                  <div className="w-metric"><span>Pages read</span><strong>{scan.pagesRead}</strong><small>Sitemap and internal links</small></div>
                  <div className="w-metric"><span>Pages drafted</span><strong>{`${scan.covered}/${scan.draftable}`}</strong><small>Legal and noindex pages skipped</small></div>
                  <div className="w-metric"><span>Competitor pages</span><strong>{scan.competitorPages}</strong><small>{scan.competitorSources.length ? scan.competitorSources.join(", ") : "No source yet"}</small></div>
                </div>
                {scan.offers?.length ? (
                  <div className="scan-chips" aria-label="Offers found on the site">{scan.offers.map((item) => <span key={item}>{item}</span>)}</div>
                ) : null}
                {scan.proof?.length ? (
                  <p className="w-footnote">Facts the drafts may use: {scan.proof.join(" · ")}</p>
                ) : null}
                {scan.stale ? <p className="w-inset" role="status">Your setup answers changed after this read. Read the site again so new drafts use them.</p> : null}
                {scan.conflicts?.length ? (
                  <div className="w-inset" role="status">
                    <strong>Your setup and the website disagree</strong>
                    <ul className="skip-list">{scan.conflicts.map((item) => <li key={`${item.field}-${item.message}`}>{item.message}</li>)}</ul>
                  </div>
                ) : null}
                {scan.skipped?.length ? (
                  <div className="w-inset">
                    <strong>{`${scan.skipped.length} page${scan.skipped.length === 1 ? "" : "s"} need content work before a title can be written`}</strong>
                    <ul className="skip-list">
                      {scan.skipped.map((item) => <li key={item.url}>{item.reason} <span>{item.url}</span></li>)}
                    </ul>
                  </div>
                ) : null}
                {scan.failedPages?.length ? (
                  <p className="w-footnote">{`${scan.failedPages.length} page${scan.failedPages.length === 1 ? "" : "s"} could not be read: ${scan.failedPages.slice(0, 4).map((item) => `${item.url} (${item.error})`).join(", ")}`}</p>
                ) : null}
              </>
            ) : (
              <p>
                Searchify reads the pages on your website, learns the business from them and from your setup answers, reads the competitor pages, then writes a Google title and description for each page. Nothing is published until you approve it.
              </p>
            )
          ) : (
            <p className="w-footnote">
              {drafts.length
                ? "Same drafts as Needs human approval. Open a card to compare, edit, and approve before anything is published."
                : "When titles and descriptions are drafted, they show here and on Needs human approval. Nothing is published until you approve it."}
            </p>
          )}

          {showScanDetails ? (
            <>
              <label className="scan-rivals">
                Competitor websites (optional)
                <input
                  type="text"
                  value={rivals}
                  placeholder="rival-one.com, rival-two.com"
                  onChange={(event) => setRivals(event.target.value)}
                  onBlur={saveRivals}
                />
                <small>{scan?.competitorPages ? "These pages are read and the drafts are written to beat them." : "Without a search-results source, the drafts compare against the websites you list here, or Places results when synced."}</small>
              </label>

              {step ? (
                <div className="audit-loading" role="status"><span className="audit-loading-mark" aria-hidden="true" /><strong>{step}</strong><p>This can take up to a minute.</p></div>
              ) : (
                <div className="w-actions scan-actions">
                  {!scan ? <button className="w-button primary" type="button" disabled={!brief.siteUrl} onClick={() => run()}>Read the whole site and draft titles</button> : null}
                  {scan && left > 0 ? <button className="w-button primary" type="button" onClick={() => run({ readFirst: false })}>{`Draft the next ${Math.min(left, 6)} page${Math.min(left, 6) === 1 ? "" : "s"}`}</button> : null}
                  {scan ? <button className="w-button" type="button" onClick={() => run({ force: true })}>Read the site again</button> : null}
                </div>
              )}
              {!brief.siteUrl ? <p className="w-inset">Add the website address in setup first, then this can read the site.</p> : null}
              {note ? <p className="w-inset" role="status">{note}</p> : null}
              {failed.length ? (
                <div className="w-inset" role="alert">
                  <strong>No draft was written for these pages</strong>
                  <ul className="skip-list">{failed.map((item) => <li key={item.url}>{item.reason} <span>{item.url}</span></li>)}</ul>
                </div>
              ) : null}
            </>
          ) : null}

          {drafts.length ? (
            <div className="task-list scan-drafts">
              {drafts.map((row) => {
                const p = row.proposed || {};
                return (
                  <article className="task-card" key={row.id}>
                    <div className="task-meta">
                      <span className="task-kind">{pageTypeLabel(p)}{p.target ? ` · ${p.target}` : ""}</span>
                      <span className="task-state">{statusLabel(row)}</span>
                    </div>
                    <p className="task-url">{row.targetUrl}</p>
                    <div className="change-pair">
                      <div className="change-cell"><small>Current title</small><span>{p.beforeTitle || "None found"}</span></div>
                      <div className="change-cell suggested"><small>Suggested title</small><span>{p.title || (p.aiError ? "Not written. Open to try again." : "Not written yet")}</span></div>
                      <div className="change-cell"><small>Current description</small><span>{p.beforeDescription || "None found"}</span></div>
                      <div className="change-cell suggested"><small>Suggested description</small><span>{p.metaDescription || "Not written yet"}</span></div>
                    </div>
                    {p.reason ? <p className="w-footnote">{p.reason}</p> : null}
                    <DraftChecks proposed={p} compact />
                    <div className="evidence-row">
                      <span className="source-caption">READ FROM</span>
                      <span>Whole site</span>
                      <span>Your setup</span>
                      {p.competitors?.length ? <span>{`${p.competitors.length} competitor page${p.competitors.length === 1 ? "" : "s"}`}</span> : null}
                      {row.source === "gsc" ? <span>Search Console</span> : null}
                      {p.analytics ? <span>Analytics</span> : null}
                    </div>
                    <div className="task-actions">
                      <Link className="approve" href={`/app/queue/${row.id}`}>Open draft</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (!showScanDetails ? (
            <p className="w-inset">
              No drafts waiting yet. Open <Link href="/app/queue">Needs human approval</Link> to read the site and write titles.
            </p>
          ) : null)}
        </>
      )}
    </section>
  );
}
