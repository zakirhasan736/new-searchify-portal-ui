"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import "@/styles/results-board.css";
import {
  changePath,
  dismissChange,
  generateMetaCopy,
  listChanges,
  patchChange,
} from "@/lib/v1Api";

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
    const { data } = await listChanges();
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

  const evidence = change.proposed?.evidence || {};
  const beforeTitle = change.proposed?.beforeTitle || change.proposed?.currentTitle || "—";
  const beforeDesc = change.proposed?.beforeDescription || change.proposed?.currentDescription || "No custom description.";

  const saveDraft = async () => {
    await patchChange(change.id, { title, metaDescription: description });
  };

  const onGenerate = async () => {
    setBusy(true);
    await saveDraft();
    const res = await generateMetaCopy(change.id, { tone });
    setBusy(false);
    if (!res.ok) {
      setNotice(typeof res.data?.detail === "string" ? res.data.detail : "Could not generate alternatives.");
      return;
    }
    setOptions(res.data?.options || []);
    setNotice("Alternatives are ready. Review them before publishing.");
  };

  const goConfirm = async () => {
    if (!title.trim() || !description.trim()) {
      setNotice("Add a title and description before publishing.");
      return;
    }
    setBusy(true);
    await patchChange(change.id, { title, metaDescription: description });
    setBusy(false);
    router.push(`/app/queue/${change.id}/confirm`);
  };

  return (
    <section className="dash-view extension-view">
      <header className="w-head">
        <div>
          <div className="dash-eyebrow">REVIEW IT, THEN GO LIVE</div>
          <h1>Review this update.</h1>
          <p>{changePath(change)}</p>
        </div>
        <Link className="w-button" href="/app/queue">Back to approvals</Link>
      </header>
      {notice ? <p className="w-inset">{notice}</p> : null}
      <div className="w-panel">
        <h2>Why this page?</h2>
        <p>{change.opportunity || "This recommendation came from the connected search data."}</p>
        <div className="w-metrics">
          <div className="w-metric"><span>Impressions</span><strong>{evidence.impressions ?? "—"}</strong></div>
          <div className="w-metric"><span>Clicks</span><strong>{evidence.clicks ?? "—"}</strong></div>
          <div className="w-metric"><span>Average position</span><strong>{evidence.position ?? "—"}</strong></div>
        </div>
      </div>
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
            <button className="w-button" type="button" onClick={() => { setTitle(opt.title || ""); setDescription(opt.description || ""); setOptions([]); setNotice("Applied to the draft. Nothing has been published."); }}>Use this version</button>
          </article>
        ))}
      </div>
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
          <label>Page title<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label>Meta description<textarea value={description} onChange={(e) => setDescription(e.target.value)} /></label>
          {change.proposed?.reason ? <p className="suggestion-reason">{change.proposed.reason}</p> : null}
        </article>
      </div>
      <div className="w-panel below">
        <div className="dash-eyebrow">SEARCH LISTING PREVIEW</div>
        <p className="task-url">{changePath(change)}</p>
        <h2>{title || "Page title"}</h2>
        <p>{description || "Meta description"}</p>
      </div>
      <div className="w-actions">
        <button className="w-button" type="button" onClick={async () => { await dismissChange(change.id); router.push("/app/queue"); }}>Save for later</button>
        <button className="w-button primary" type="button" onClick={goConfirm} disabled={busy}>Review publication</button>
      </div>
    </section>
  );
}
