"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import "@/styles/results-board.css";
import DraftChecks, { ListingPackage, WhyThisDraft, pageTypeLabel, statusLabel } from "@/components/board/DraftChecks";
import {
  changePath,
  dismissChange,
  errorText,
  generateMetaCopy,
  listChanges,
  patchChange,
} from "@/lib/v1Api";

const EDITABLE = new Set(["proposed", "awaiting_approval", "approved", "failed", "needs_review"]);
const REVIEWABLE = new Set(["proposed", "awaiting_approval", "approved", "failed", "needs_review"]);

export default function ReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [change, setChange] = useState(null);
  const [queue, setQueue] = useState([]);
  const [notice, setNotice] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("Clear & direct");
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = useState(false);

  const load = useCallback(async () => {
    const { data } = await listChanges({ force: true });
    const list = Array.isArray(data) ? data : [];
    setQueue(list);
    const c = list.find((x) => String(x.id) === String(id));
    setChange(c || null);
    if (c) {
      setTitle(c.proposed?.title || "");
      setDescription(c.proposed?.metaDescription || "");
    }
    setBooted(true);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const reviewable = queue.filter((row) => REVIEWABLE.has(row.status));
  const index = reviewable.findIndex((row) => String(row.id) === String(id));
  const previousId = index > 0 ? reviewable[index - 1]?.id : null;
  const nextId = index >= 0 && index < reviewable.length - 1 ? reviewable[index + 1]?.id : null;

  useEffect(() => {
    const onKey = (event) => {
      if (event.defaultPrevented || busy) return;
      const tag = String(event.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || event.target?.isContentEditable) return;
      if (event.key === "ArrowRight" && nextId) {
        event.preventDefault();
        router.push(`/app/queue/${nextId}`);
      } else if (event.key === "ArrowLeft" && previousId) {
        event.preventDefault();
        router.push(`/app/queue/${previousId}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, nextId, previousId, router]);

  if (!booted) return <section className="dash-view"><p className="w-footnote">Loading this recommendation…</p></section>;

  if (!change) {
    return (
      <section className="dash-view">
        <header className="w-head"><div><h1>Change not found.</h1><p>This recommendation is no longer in the queue.</p></div></header>
        <Link className="w-button" href="/app/queue">Back to approvals</Link>
      </section>
    );
  }

  const p = change.proposed || {};
  const evidence = p.evidence || {};
  const editable = EDITABLE.has(change.status);
  const dirty = title !== (p.title || "") || description !== (p.metaDescription || "");
  const beforeTitle = p.beforeTitle || p.currentTitle || "—";
  const beforeDesc = p.beforeDescription || p.currentDescription || "No custom description.";

  const saveDraft = async () => {
    if (!dirty) return true;
    const res = await patchChange(change.id, { title, metaDescription: description });
    if (!res.ok) {
      setNotice(errorText(res, "The draft could not be saved."));
      return false;
    }
    setChange(res.data);
    if (res.data?.approvalWithdrawn) setNotice("You changed the text after it was approved, so it needs approval again before publishing.");
    return true;
  };

  const onGenerate = async () => {
    setBusy(true);
    const saved = await saveDraft();
    if (!saved) {
      setBusy(false);
      return;
    }
    const res = await generateMetaCopy(change.id, { tone });
    setBusy(false);
    if (!res.ok) {
      setNotice(errorText(res, "Could not regenerate the listing package."));
      return;
    }
    const next = res.data?.change || null;
    if (next) {
      setChange(next);
      setTitle(next.proposed?.title || "");
      setDescription(next.proposed?.metaDescription || "");
      setQueue((list) => list.map((row) => (String(row.id) === String(next.id) ? next : row)));
    }
    const beats = next?.proposed?.beatsLive ?? res.data?.beatsLive;
    const jev = next?.proposed?.jev || {};
    const jevNote = jev.score != null ? ` JEV scored it ${jev.score}/100 (${jev.band || "inbox"}).` : "";
    setNotice(
      beats
        ? `Regenerated from keyword + competitor + Searchify SEO research.${jevNote} The package beats the live listing — title, description, Open Graph, and JSON-LD use the same words. Nothing is published yet.`
        : `Regenerated from analysis, not a page paste.${jevNote} Compare it to the live listing. If it is not stronger, skip or regenerate again after Keywords are loaded. Nothing is published yet.`,
    );
  };

  const goConfirm = async () => {
    if (!title.trim() || !description.trim()) {
      setNotice("Add a title and description before publishing.");
      return;
    }
    setBusy(true);
    const saved = await saveDraft();
    setBusy(false);
    if (saved) router.push(`/app/queue/${change.id}/confirm`);
  };

  const saveForLater = async () => {
    setBusy(true);
    const saved = await saveDraft();
    setBusy(false);
    if (saved) router.push("/app/queue");
  };

  const reject = async () => {
    if (!window.confirm("Reject this recommendation? It will not be published and will leave the queue.")) return;
    setBusy(true);
    const res = await dismissChange(change.id);
    setBusy(false);
    if (!res.ok) {
      setNotice(errorText(res, "Could not reject this recommendation."));
      return;
    }
    router.push(nextId ? `/app/queue/${nextId}` : "/app/queue");
  };

  return (
    <section className="dash-view extension-view">
      <header className="w-head">
        <div>
          <div className="dash-eyebrow">{`${pageTypeLabel(p).toUpperCase()} · ${statusLabel(change).toUpperCase()}`}</div>
          <h1>Review this update.</h1>
          <p>{change.targetUrl || changePath(change)}</p>
          {reviewable.length > 1 && index >= 0 ? (
            <p className="w-footnote">{`${index + 1} of ${reviewable.length} waiting. Arrow keys or Skip move to the next card without approving.`}</p>
          ) : null}
        </div>
        <div className="w-actions">
          {previousId ? <Link className="w-button" href={`/app/queue/${previousId}`}>Previous</Link> : null}
          {nextId ? <Link className="w-button" href={`/app/queue/${nextId}`}>Skip</Link> : null}
          <Link className="w-button" href="/app/queue">Back to approvals</Link>
        </div>
      </header>
      {notice ? <p className="w-inset" role="status">{notice}</p> : null}
      {!editable ? (
        <p className="w-inset" role="status">{`This recommendation is ${statusLabel(change).toLowerCase()}. It can no longer be edited here.`}</p>
      ) : null}
      <div className="w-panel">
        <h2>Why this page?</h2>
        <p>{change.opportunity || "This recommendation came from the connected search data."}</p>
        <div className="w-metrics">
          <div className="w-metric"><span>Impressions</span><strong>{evidence.impressions ?? "—"}</strong><small>Search Console, last 28 days</small></div>
          <div className="w-metric"><span>Clicks</span><strong>{evidence.clicks ?? "—"}</strong><small>Search Console, last 28 days</small></div>
          <div className="w-metric"><span>Average position</span><strong>{evidence.position ?? "—"}</strong><small>Search Console, last 28 days</small></div>
        </div>
        <WhyThisDraft proposed={p} evidence={evidence} />
        <DraftChecks proposed={p} />
      </div>
      {editable ? (
        <div className="w-panel below">
          <h2>Regenerate the listing package.</h2>
          <p>
            Searchify re-analyzes keyword, competitor fit, Searchify SEO research, and the live listing, then rewrites title and description.
            Open Graph and JSON-LD stay on the same words. JEV scores the draft; you still approve before anything goes live.
          </p>
          <div className="rewrite-toolbar">
            <label>Writing style
              <select value={tone} onChange={(e) => setTone(e.target.value)}>
                <option>Clear & direct</option>
                <option>Service focused</option>
              </select>
            </label>
            <button className="rewrite-generate" type="button" onClick={onGenerate} disabled={busy}>
              <span className="rewrite-generate-mark" aria-hidden="true">✧</span>
              {busy ? "Analyzing keyword + competitors…" : "Regenerate listing package"}
            </button>
          </div>
        </div>
      ) : null}
      <div className="w-two-col below">
        <article className="w-panel">
          <div className="dash-eyebrow">CURRENTLY PUBLISHED</div>
          <div className="change-pair">
            <div className="change-cell"><small>Title</small><span>{beforeTitle}</span></div>
            <div className="change-cell"><small>Description</small><span>{beforeDesc}</span></div>
            <div className="change-cell"><small>Open Graph</small><span>{p.beforeOpenGraphTitle || beforeTitle}</span><small>{p.beforeOpenGraphDescription || "No Open Graph description on the page."}</small></div>
            <div className="change-cell"><small>JSON-LD</small><span>{(p.beforeSchemaTypes || []).join(", ") || "No schema found"}</span><small>{p.beforeSchemaName || p.beforeSchemaDescription || "The scraper did not find a name in the page schema."}</small></div>
          </div>
        </article>
        <article className="w-panel">
          <div className="dash-eyebrow">SUGGESTED UPDATE</div>
          <div className="suggested-fields">
            <label>Page title
              <input value={title} readOnly={!editable} onChange={(e) => setTitle(e.target.value)} />
              <span className="field-meta"><small className="w-muted">{`${title.length} characters`}</small></span>
            </label>
            <label>Meta description
              <textarea value={description} readOnly={!editable} rows={4} onChange={(e) => setDescription(e.target.value)} />
              <span className="field-meta"><small className="w-muted">{`${description.length} characters`}</small></span>
            </label>
          </div>
          {p.reason ? <p className="suggestion-reason">{p.reason}</p> : null}
          <ListingPackage proposed={{ ...p, title, metaDescription: description }} title={title} description={description} />
        </article>
      </div>
      <div className="w-panel below">
        <div className="dash-eyebrow">SEARCH LISTING PREVIEW</div>
        <p className="task-url">{change.targetUrl || changePath(change)}</p>
        <h2>{title || "Page title"}</h2>
        <p>{description || "Meta description"}</p>
      </div>
      {editable ? (
        <div className="w-actions">
          <button className="w-button" type="button" onClick={saveForLater} disabled={busy}>{dirty ? "Save for later" : "Back to the queue"}</button>
          <button className="w-button danger" type="button" onClick={reject} disabled={busy}>Reject</button>
          {nextId ? <Link className="w-button" href={`/app/queue/${nextId}`}>Skip to next</Link> : null}
          <button className="w-button primary" type="button" onClick={goConfirm} disabled={busy}>Review publication</button>
        </div>
      ) : null}
    </section>
  );
}
