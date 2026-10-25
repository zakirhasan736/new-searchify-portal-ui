"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import "@/styles/results-board.css";
import "@/styles/v8-app.css";
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
  const [objective, setObjective] = useState("balanced");
  const [focusTopic, setFocusTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [extraInstructions, setExtraInstructions] = useState("");
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
  const gscStatus = p.evidenceRecord?.search_console?.status || evidence.status || "";
  const gscCaption = gscStatus === "verified"
    ? "Search Console, this page"
    : gscStatus === "partial"
      ? "Search Console returned a partial page result"
      : gscStatus
        ? "Search Console page data is not verified"
        : "Search Console page data unknown";
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
    const res = await generateMetaCopy(change.id, {
      tone,
      objective,
      focusTopic,
      audience,
      primaryKeyword,
      extraInstructions,
    });
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
    const keep = next?.proposed?.recommendKeep ?? next?.proposed?.analysis?.recommendKeep;
    const jev = next?.proposed?.jev || {};
    const jevNote = jev.score != null ? ` JEV scored it ${jev.score}/100 (${jev.band || "inbox"}).` : " JEV score unavailable.";
    if (keep) {
      setNotice(
        `No-change recommendation: the published listing already fits this page.${jevNote} Analysis was refreshed; nothing was replaced and nothing is published.`,
      );
    } else {
      setNotice(
        beats
          ? `Regenerated with objective “${objective}”.${jevNote} The package beats the live listing — title, description, Open Graph, and JSON-LD stay aligned. Nothing is published yet.`
          : `Regenerated with objective “${objective}”.${jevNote} Compare it to the live listing. Approve only if it is clearly stronger. Nothing is published yet.`,
      );
    }
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
      <header className="review-v8-header">
        <div className="review-v8-title-group">
          <h1 className="review-v8-title">Review this update.</h1>
          <div className="review-v8-url">{change.targetUrl || changePath(change)}</div>
          {reviewable.length > 1 && index >= 0 ? (
            <p className="w-footnote">{`${index + 1} of ${reviewable.length} waiting. Arrow keys or Skip move to the next card without approving.`}</p>
          ) : null}
        </div>
        <div className="review-v8-actions">
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
          <div className="w-metric"><span>Impressions</span><strong>{evidence.impressions ?? "—"}</strong><small>{gscCaption}</small></div>
          <div className="w-metric"><span>Clicks</span><strong>{evidence.clicks ?? "—"}</strong><small>{gscCaption}</small></div>
          <div className="w-metric"><span>Average position</span><strong>{evidence.position ?? "—"}</strong><small>{gscCaption}</small></div>
        </div>
        <WhyThisDraft proposed={p} evidence={evidence} />
        <DraftChecks proposed={p} />
      </div>
      {editable ? (
        <div className="w-panel below">
          <h2>Regenerate the listing package.</h2>
          <p>
            Writing style only changes tone. Optimization objective steers what “better” means. Optional fields refine the draft;
            an irrelevant keyword is rejected. Open Graph stays aligned with the listing; JSON-LD updates WebPage name/description
            without deleting other live schema types. You still approve before anything goes live.
          </p>
          <div className="rewrite-toolbar rewrite-toolbar-stack">
            <label>Writing style
              <select value={tone} onChange={(e) => setTone(e.target.value)} disabled={busy}>
                <option>Clear & direct</option>
                <option>Warm & professional</option>
                <option>Service focused</option>
              </select>
            </label>
            <label>Optimization objective
              <select value={objective} onChange={(e) => setObjective(e.target.value)} disabled={busy}>
                <option value="balanced">Balanced SEO improvement</option>
                <option value="service_focus">Service or product focus</option>
                <option value="search_intent">Search intent alignment</option>
                <option value="ctr_clarity">Improve search-result clarity / CTR potential</option>
                <option value="local_seo">Local SEO</option>
                <option value="preserve_brand">Preserve current brand positioning</option>
                <option value="differentiation">Differentiate with verified evidence</option>
              </select>
            </label>
            <label>Primary service / topic
              <input value={focusTopic} onChange={(e) => setFocusTopic(e.target.value)} placeholder="Optional — e.g. web design" disabled={busy} />
            </label>
            <label>Target audience
              <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Optional — e.g. Calgary business owners" disabled={busy} />
            </label>
            <label>Primary keyword
              <input value={primaryKeyword} onChange={(e) => setPrimaryKeyword(e.target.value)} placeholder="Optional — must fit this page" disabled={busy} />
            </label>
            <label>Additional context
              <input value={extraInstructions} onChange={(e) => setExtraInstructions(e.target.value)} placeholder="Optional instructions (factual only)" disabled={busy} />
            </label>
            <button className="rewrite-generate" type="button" onClick={onGenerate} disabled={busy}>
              <span className="rewrite-generate-mark" aria-hidden="true">✧</span>
              {busy ? "Analyzing page + research…" : "Regenerate listing package"}
            </button>
          </div>
        </div>
      ) : null}
      <div className="w-two-col below">
        <article className="w-panel">
          <div className="dash-eyebrow">THE EXACT CHANGE</div>
          <div className="review-v8-change-panel">
            <div className="review-v8-change-section">
              <div className="review-v8-change-label">SEO Title</div>
              <div className="review-v8-change-before">
                <span className="review-v8-change-marker minus">−</span>
                <span className="review-v8-change-text strikethrough">{beforeTitle}</span>
              </div>
              <div className="review-v8-change-after">
                <span className="review-v8-change-marker plus">+</span>
                <span className="review-v8-change-text new">{title}</span>
              </div>
              <div style={{ fontSize: "12px", color: "#5B616B" }}>{title.length} characters · fits on desktop and mobile results</div>
            </div>
            <div className="review-v8-change-section">
              <div className="review-v8-change-label">Meta Description</div>
              <div className="review-v8-change-before">
                <span className="review-v8-change-marker minus">−</span>
                <span className="review-v8-change-text strikethrough">{beforeDesc}</span>
              </div>
              <div className="review-v8-change-after">
                <span className="review-v8-change-marker plus">+</span>
                <span className="review-v8-change-text new">{description}</span>
              </div>
            </div>
          </div>
          <div style={{ background: "#FFFFFF", border: "1px solid #E3E5E8", borderRadius: "14px", padding: "20px" }}>
            <h2 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 600 }}>How it looks in Google</h2>
            <div className="review-v8-preview-grid">
              <div className="review-v8-preview-box">
                <div className="review-v8-preview-label">Now</div>
                <div style={{ fontSize: "12px", color: "#3A3F46" }}>{new URL(change.targetUrl || "https://example.com/").hostname} › services</div>
                <div style={{ fontSize: "17px", color: "#1A0DAB", marginTop: "4px" }}>{beforeTitle}</div>
                <div style={{ fontSize: "13px", color: "#4D5156", lineHeight: 1.45, marginTop: "2px" }}>{beforeDesc}</div>
              </div>
              <div className="review-v8-preview-box selected">
                <div className="review-v8-preview-label bold">After</div>
                <div style={{ fontSize: "12px", color: "#3A3F46" }}>{new URL(change.targetUrl || "https://example.com/").hostname} › services</div>
                <div style={{ fontSize: "17px", color: "#1A0DAB", marginTop: "4px" }}>{title}</div>
                <div style={{ fontSize: "13px", color: "#4D5156", lineHeight: 1.45, marginTop: "2px" }}>{description}</div>
              </div>
            </div>
          </div>
        </article>
        <aside style={{ flex: "1 1 300px", minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="review-v8-sidebar">
            <div className="review-v8-sidebar-label">Expected Result</div>
            <div className="review-v8-sidebar-value">+40 to +90 clicks / mo</div>
            <div className="review-v8-sidebar-text">Based on comparable title changes Searchify has measured. Median CTR change improves with every shipped change.</div>
          </div>
          {editable && (
            <div className="suggested-fields" style={{ background: "#FFFFFF", border: "1px solid #E3E5E8", borderRadius: "14px", padding: "20px" }}>
              <label>Edit title
                <input value={title} onChange={(e) => setTitle(e.target.value)} />
                <span className="field-meta"><small className="w-muted">{`${title.length} characters`}</small></span>
              </label>
              <label>Edit description
                <textarea value={description} rows={4} onChange={(e) => setDescription(e.target.value)} />
                <span className="field-meta"><small className="w-muted">{`${description.length} characters`}</small></span>
              </label>
            </div>
          )}
          {p.reason ? <p className="suggestion-reason">{p.reason}</p> : null}
          <ListingPackage proposed={{ ...p, title, metaDescription: description }} title={title} description={description} />
        </aside>
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
