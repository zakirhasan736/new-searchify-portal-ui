"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import "@/styles/results-board.css";
import { changePath, listChanges, queueItems } from "@/lib/v1Api";
import { statusLabel } from "@/components/board/DraftChecks";

const LIVE = new Set(["applied", "monitoring", "closed", "published_unverified"]);

function headline(change) {
  const check = change.execution?.liveCheck || {};
  if (!LIVE.has(change.status)) {
    if (change.status === "executing") return ["PUBLISHING", "Publishing this change.", "The website has not confirmed the write yet. Refresh in a moment."];
    return ["NOT PUBLISHED", "This change is not live.", change.execution?.detail || `Status: ${statusLabel(change)}. Nothing was written to the website.`];
  }
  if (change.status === "published_unverified") {
    return ["PUBLISHED · NOT CONFIRMED", "Sent to the website, not confirmed.", "The CMS accepted the write but did not confirm the new title. Check the live page."];
  }
  if (check.read && !check.titleLive) {
    return ["PUBLISHED · NOT YET VISIBLE", "Published, not yet on the live page.", "The CMS confirmed the write, but the live page still shows the old title. Caching or an SEO plugin may be overriding it."];
  }
  if (!check.read) {
    return ["PUBLISHED", "Your change is published.", "The CMS confirmed the write. The live page could not be read afterwards to double-check it."];
  }
  return ["PUBLICATION COMPLETE", "Your change is published.", "The approved text was written and found on the live page."];
}

export default function PublishedPage() {
  const { id } = useParams();
  const router = useRouter();
  const [change, setChange] = useState(null);
  const [nextId, setNextId] = useState(null);

  const load = useCallback(async () => {
    const { data } = await listChanges({ force: true });
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

  const live = LIVE.has(change.status);
  const [eyebrow, heading, body] = headline(change);
  const title = change.proposed?.publishedTitle || change.proposed?.title || "";
  const description = change.proposed?.publishedDescription || change.proposed?.metaDescription || "";

  return (
    <section className="dash-view extension-view">
      <header className="w-head">
        <div>
          <div className="dash-eyebrow">{eyebrow}</div>
          <h1>{heading}</h1>
          <p>{body}</p>
        </div>
      </header>
      <article className="w-panel">
        <span className={`w-pill ${change.status === "monitoring" ? "good" : live ? "warn" : "danger"}`}>{statusLabel(change)}</span>
        <h2>{changePath(change)}</h2>
        <div className="change-pair">
          <div className="change-cell suggested"><small>{live ? "Published title" : "Approved title"}</small><span>{title}</span></div>
          <div className="change-cell suggested"><small>Description</small><span>{description}</span></div>
        </div>
      </article>
      {!live ? (
        <div className="w-actions">
          <Link className="w-button primary" href={`/app/queue/${change.id}`}>Back to the draft</Link>
        </div>
      ) : null}
      {live ? <div className="w-two-col below">
        <article className="w-panel"><h2>What happens next</h2><p>The next checks track this page’s search performance.</p></article>
        <article className="w-panel"><h2>You can undo this</h2><p>The previous values stay in the completion log.</p><Link className="w-button" href="/app/history">Open completion log</Link></article>
      </div> : null}
      <div className="w-actions">
        <Link className="w-button" href="/app">Back to overview</Link>
        <button className="w-button primary" type="button" onClick={() => router.push(nextId ? `/app/queue/${nextId}` : "/app/results")}>{nextId ? "Review next update" : "View site audit"}</button>
      </div>
    </section>
  );
}
