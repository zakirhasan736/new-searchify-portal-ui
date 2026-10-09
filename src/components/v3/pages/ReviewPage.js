"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import "@/styles/results-board.css";
import DraftChecks, { pageTypeLabel, statusLabel } from "@/components/board/DraftChecks";
import {
  changePath,
  dismissChange,
  errorText,
  generateMetaCopy,
  listChanges,
  patchChange,
} from "@/lib/v1Api";

const EDITABLE = new Set(["proposed", "awaiting_approval", "approved", "failed", "needs_review"]);

export default function ReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [change, setChange] = useState(null);
  const [notice, setNotice] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("Clear & direct");
  const [options, setOptions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = useState(false);

  const load = useCallback(async () => {
    const { data } = await listChanges({ force: true });
    const list = Array.isArray(data) ? data : [];
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
      setNotice(errorText(res, "Could not generate alternatives."));
      return;
    }
    setOptions(res.data?.options || []);
    setNotice("Alternatives are ready. Your draft has not changed. Pick one to use it.");
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
    router.push("/app/queue");
  };

  return (
    <section className="dash-view extension-view">
      <header className="w-head">
        <div>
          <div className="dash-eyebrow">{`${pageTypeLabel(p).toUpperCase()} · ${statusLabel(change).toUpperCase()}`}</div>
          <h1>Review this update.</h1>
          <p>{change.targetUrl || changePath(change)}</p>
        </div>
        <Link className="w-button" href="/app/queue">Back to approvals</Link>
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
        <DraftChecks proposed={p} />
      </div>
      {editable ? (
        <div className="w-panel below">
          <h2>Try a stronger title.</h2>
          <p>Generate alternatives from this page’s service and location. Nothing is published from this step.</p>
          <div className="w-actions">
            <label>Writing style
              <select value={tone} onChange={(e) => setTone(e.target.value)}>
                <option>Clear & direct</option>
                <option>Service focused</option>
              </select>
            </label>
            <button className="w-button primary" type="button" onClick={onGenerate} disabled={busy}>
              {options.length ? "Generate again" : "Generate title and description"}
            </button>
          </div>
          {options.map((opt, i) => (
            <article className="w-inset" key={i}>
              <span className="dash-eyebrow">Option {i + 1}</span>
              <h3>{opt.title}</h3>
              <p>{opt.description}</p>
              {opt.reason ? <p className="suggestion-reason">{opt.reason}</p> : null}
              <button className="w-button" type="button" onClick={() => { setTitle(opt.title || ""); setDescription(opt.description || ""); setOptions([]); setNotice("Applied to the draft. Save or publish to keep it. Nothing has been published."); }}>Use this version</button>
            </article>
          ))}
        </div>
      ) : null}
      <div className="w-two-col below">
        <article className="w-panel">
          <div className="dash-eyebrow">CURRENTLY PUBLISHED</div>
          <div className="change-pair">
            <div className="change-cell"><small>Title</small><span>{beforeTitle}</span></div>
            <div className="change-cell"><small>Description</small><span>{beforeDesc}</span></div>
          </div>
        </article>
        <article className="w-panel">
          <div className="dash-eyebrow">SUGGESTED UPDATE</div>
          <label>Page title<input value={title} readOnly={!editable} onChange={(e) => setTitle(e.target.value)} /></label>
          <small className="w-muted">{`${title.length} characters`}</small>
          <label>Meta description<textarea value={description} readOnly={!editable} onChange={(e) => setDescription(e.target.value)} /></label>
          <small className="w-muted">{`${description.length} characters`}</small>
          {p.reason ? <p className="suggestion-reason">{p.reason}</p> : null}
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
          <button className="w-button primary" type="button" onClick={goConfirm} disabled={busy}>Review publication</button>
        </div>
      ) : null}
    </section>
  );
}
