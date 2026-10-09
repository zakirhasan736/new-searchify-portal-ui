"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { hostnameOf } from "@/lib/businessBrief";
import { breadthKey, loadGuardrails } from "@/lib/guardrails";
import { errorText, listChanges, proposeFromGsc } from "@/lib/v1Api";
import DraftChecks, { isHomepage, statusLabel } from "@/components/board/DraftChecks";

const OPEN = new Set(["proposed", "awaiting_approval", "approved", "failed", "needs_review"]);

function pickHomepage(rows, host) {
  const mine = rows.filter((row) => row.changeType === "meta" && isHomepage(row) && (!host || hostnameOf(row.targetUrl) === host));
  const byNewest = (a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""));
  return mine.filter((row) => OPEN.has(row.status)).sort(byNewest)[0]
    || mine.filter((row) => row.status !== "dismissed").sort(byNewest)[0]
    || null;
}

export default function HomepageReview({ brief, onSetup }) {
  const host = brief.hostname;
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const load = async () => {
    const res = await listChanges({ force: true });
    if (!res.ok) {
      setNote(errorText(res, "The homepage recommendation could not be loaded."));
      return;
    }
    setRow(pickHomepage(Array.isArray(res.data) ? res.data : [], host));
  };

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setNote("");
    load().finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [host]);

  const draft = async () => {
    setBusy(true);
    setNote("");
    const res = await proposeFromGsc({ breadth: breadthKey(loadGuardrails().breadth), limit: 1 });
    setBusy(false);
    if (!res.ok) {
      setNote(errorText(res, "The homepage draft could not be written."));
      return;
    }
    const skipped = (res.data?.skipped || []).find((item) => item.pageType === "home");
    const failed = (res.data?.failed || [])[0];
    if (skipped) setNote(`No draft was written: ${skipped.reason}`);
    else if (failed) setNote(`No draft was written: ${failed.reason}`);
    else if (!res.data?.created) setNote(res.data?.reason || "No new homepage draft was needed.");
    await load();
  };

  const p = row?.proposed || {};
  return (
    <aside className="urgent-alert homepage-review" aria-label="Homepage recommendation" aria-busy={loading}>
      <span className="urgent-beacon" aria-hidden="true" />
      <div>
        <span className="urgent-kicker">HOMEPAGE TITLE AND DESCRIPTION</span>
        {loading ? (
          <p role="status">Loading the homepage recommendation…</p>
        ) : !brief.ready ? (
          <>
            <strong>{`Finish setup for ${host || "your website"} first`}</strong>
            <p>The homepage draft is written from your setup answers and the live page.</p>
            <button className="w-button" type="button" onClick={onSetup}>Continue setup</button>
          </>
        ) : row ? (
          <>
            <strong>{`${statusLabel(row)} · ${row.targetUrl}`}</strong>
            <div className="change-pair">
              <div className="change-cell"><small>Current title</small><span>{p.beforeTitle || "None found"}</span></div>
              <div className="change-cell suggested"><small>Recommended title</small><span>{p.title || "Not written yet"}</span></div>
              <div className="change-cell"><small>Current description</small><span>{p.beforeDescription || "None found"}</span></div>
              <div className="change-cell suggested"><small>Recommended description</small><span>{p.metaDescription || "Not written yet"}</span></div>
            </div>
            <DraftChecks proposed={p} compact />
            <div className="w-actions">
              <Link className="w-button primary" href={`/app/queue/${row.id}`}>{OPEN.has(row.status) ? "Review in the approval queue" : "Open"}</Link>
            </div>
          </>
        ) : (
          <>
            <strong>{`No homepage recommendation for ${host || "this website"} yet`}</strong>
            <p>Searchify reads the live homepage and writes one draft. Nothing is published until you approve it in the queue.</p>
            <button className="w-button" type="button" disabled={busy || !brief.siteUrl} onClick={draft}>{busy ? "Reading the homepage…" : "Draft the homepage title"}</button>
          </>
        )}
        {note ? <p className="w-inset" role="status">{note}</p> : null}
      </div>
    </aside>
  );
}
