"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import "@/styles/results-board.css";
import { changePath, listChanges, queueItems } from "@/lib/v1Api";

export default function PublishedPage() {
  const { id } = useParams();
  const router = useRouter();
  const [change, setChange] = useState(null);
  const [nextId, setNextId] = useState(null);

  const load = useCallback(async () => {
    const { data } = await listChanges();
    const list = Array.isArray(data) ? data : [];
    setChange(list.find((x) => String(x.id) === String(id)) || null);
    const ready = queueItems(list).filter((x) => String(x.id) !== String(id));
    setNextId(ready[0]?.id || null);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!change) {
    return (
      <section className="dash-view">
        <header className="w-head"><div><h1>Change not found.</h1></div></header>
        <Link className="w-button" href="/app/queue">Back to approvals</Link>
      </section>
    );
  }

  const dry = change.execution?.dryRun;
  const title = change.proposed?.title || "";
  const description = change.proposed?.metaDescription || "";

  return (
    <section className="dash-view extension-view">
      <header className="w-head">
        <div>
          <div className="dash-eyebrow">{dry ? "DRY-RUN RECORDED" : "PUBLICATION COMPLETE"}</div>
          <h1>Your change is published.</h1>
          <p>{dry ? "WordPress credentials are incomplete, so the intent was recorded. Finish the connection to apply it live." : "The approved text was applied and checked."}</p>
        </div>
      </header>
      <article className="w-panel">
        <span className={`w-pill${dry ? "" : " good"}`}>{dry ? "Dry-run" : "Published"}</span>
        <h2>{changePath(change)}</h2>
        <div className="change-pair">
          <div className="change-cell suggested"><small>New page title</small><span>{title}</span></div>
          <div className="change-cell suggested"><small>Description</small><span>{description}</span></div>
        </div>
      </article>
      <div className="w-two-col below">
        <article className="w-panel"><h2>What happens next</h2><p>The next checks track this page’s search performance.</p></article>
        <article className="w-panel"><h2>You can undo this</h2><p>The previous values stay in the completion log.</p><Link className="w-button" href="/app/history">Open completion log</Link></article>
      </div>
      <div className="w-actions">
        <Link className="w-button" href="/app">Back to overview</Link>
        <button className="w-button primary" type="button" onClick={() => router.push(nextId ? `/app/queue/${nextId}` : "/app/results")}>{nextId ? "Review next update" : "View site audit"}</button>
      </div>
    </section>
  );
}
