"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/utils/users/Helpers";
import "@/styles/results-board.css";
import { approveChange, changePath, errorCode, errorText, executeChange, listChanges } from "@/lib/v1Api";
import DraftChecks, { statusLabel } from "@/components/board/DraftChecks";

const PUBLISHED = new Set(["executing", "applied", "monitoring", "closed", "published_unverified"]);
const PUBLISHABLE = new Set(["proposed", "awaiting_approval", "approved", "failed", "needs_review"]);

export default function ConfirmPage() {
  const { id } = useParams();
  const router = useRouter();
  const [change, setChange] = useState(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = useState(false);
  const [sentBack, setSentBack] = useState(false);
  const [includeOpenGraph, setIncludeOpenGraph] = useState(false);
  const [includeJsonLd, setIncludeJsonLd] = useState(false);

  const load = useCallback(async () => {
    const { data } = await listChanges({ force: true });
    const list = Array.isArray(data) ? data : [];
    setChange(list.find((x) => String(x.id) === String(id)) || null);
    setBooted(true);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!booted) return <section className="dash-view"><p className="w-footnote">Loading this publication…</p></section>;

  if (!change) {
    return (
      <section className="dash-view">
        <header className="w-head"><div><h1>Change not found.</h1></div></header>
        <Link className="w-button" href="/app/queue">Back to approvals</Link>
      </section>
    );
  }

  const title = change.proposed?.title || "";
  const description = change.proposed?.metaDescription || "";

  const published = PUBLISHED.has(change.status);
  const publishable = PUBLISHABLE.has(change.status) && !sentBack;

  const publish = async () => {
    setBusy(true);
    setNotice("");
    const appr = await approveChange(change.id);
    if (!appr.ok) {
      setBusy(false);
      setNotice(errorText(appr, "Could not approve this update. Nothing was published."));
      return;
    }
    const exec = await executeChange(change.id, {
      forceDryRun: false,
      includeOpenGraph,
      includeJsonLd,
    });
    setBusy(false);
    if (exec.ok && exec.data?.ok && !exec.data?.dryRun) {
      router.push(`/app/queue/${change.id}/published`);
      return;
    }
    const code = errorCode(exec);
    if (code === "already_published") {
      router.push(`/app/queue/${change.id}/published`);
      return;
    }
    if (code === "source_changed") setSentBack(true);
    setNotice(errorText(exec, "Publishing failed. Nothing was changed on the website."));
    await load();
  };

  return (
    <section className="dash-view extension-view">
      <header className="w-head">
        <div>
          <div className="dash-eyebrow">PUBLICATION REVIEW</div>
          <h1>Confirm this update.</h1>
          <p>Review the exact meta title and meta description before the WordPress update.</p>
        </div>
      </header>
      {notice ? <p className="w-inset" role="alert">{notice}</p> : null}
      {published ? (
        <p className="w-inset" role="status">
          {`This update is ${statusLabel(change).toLowerCase()}. `}
          <Link href={`/app/queue/${change.id}/published`}>See the result</Link>
        </p>
      ) : null}
      <article className="w-panel">
        <h2>{changePath(change)}</h2>
        <div className="change-pair">
          <div className="change-cell suggested"><small>Approved meta title</small><span>{title}</span></div>
          <div className="change-cell suggested"><small>Approved meta description</small><span>{description}</span></div>
        </div>
        <DraftChecks proposed={change.proposed} compact />
        {publishable ? (
          <fieldset className="w-inset" style={{ marginTop: 16, display: "grid", gap: 10 }}>
            <legend style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
              Optional on WordPress
            </legend>
            <p className="w-footnote" style={{ margin: 0 }}>
              Meta title and meta description always publish. These extras stay off unless you check them.
            </p>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={includeOpenGraph}
                onChange={(e) => setIncludeOpenGraph(e.target.checked)}
                disabled={busy}
                style={{ marginTop: 3 }}
              />
              <span>
                <strong>Also generate Open Graph</strong>
                <br />
                <span className="w-footnote">Uses this meta title and description for social preview tags (og:title / og:description).</span>
              </span>
            </label>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={includeJsonLd}
                onChange={(e) => setIncludeJsonLd(e.target.checked)}
                disabled={busy}
                style={{ marginTop: 3 }}
              />
              <span>
                <strong>Also generate JSON-LD schema</strong>
                <br />
                <span className="w-footnote">Adds a WebPage JSON-LD block on the WordPress page from this meta title and description.</span>
              </span>
            </label>
          </fieldset>
        ) : null}
        <p>
          One page · meta title and meta description
          {includeOpenGraph || includeJsonLd
            ? ` · ${[includeOpenGraph ? "Open Graph" : null, includeJsonLd ? "JSON-LD" : null].filter(Boolean).join(" + ")}`
            : ""}
          {" "}· previous values retained · approver {getUser()?.result?.username || getUser()?.data?.username || "signed-in user"}.
        </p>
        <div className="w-actions">
          <Link className="w-button" href={`/app/queue/${change.id}`}>Back to draft</Link>
          {publishable ? (
            <button
              className="w-button primary"
              type="button"
              onClick={publish}
              disabled={busy || !title.trim() || !description.trim()}
            >
              {busy ? "Publishing…" : change.status === "failed" ? "Try publishing again" : "Approve and publish"}
            </button>
          ) : null}
        </div>
      </article>
      <p className="w-footnote">Publishing stops if the page changed since review. The write is checked after it is applied. Page name and menu labels are not changed.</p>
    </section>
  );
}
