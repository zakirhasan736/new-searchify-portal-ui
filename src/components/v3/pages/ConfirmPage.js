"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/utils/users/Helpers";
import "@/styles/results-board.css";
import { approveChange, changePath, executeChange, listChanges } from "@/lib/v1Api";

export default function ConfirmPage() {
  const { id } = useParams();
  const router = useRouter();
  const [change, setChange] = useState(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = useState(false);

  const load = useCallback(async () => {
    const { data } = await listChanges();
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

  const publish = async () => {
    setBusy(true);
    const appr = await approveChange(change.id);
    if (!appr.ok) {
      setBusy(false);
      setNotice(typeof appr.data?.detail === "string" ? appr.data.detail : "Could not approve.");
      return;
    }
    const exec = await executeChange(change.id, { forceDryRun: false });
    setBusy(false);
    if (!exec.ok) {
      const detail = exec.data?.detail || exec.data?.execution?.detail;
      setNotice(typeof detail === "string" ? detail : "Publish failed.");
      return;
    }
    router.push(`/app/queue/${change.id}/published`);
  };

  return (
    <section className="dash-view extension-view">
      <header className="w-head">
        <div>
          <div className="dash-eyebrow">PUBLICATION REVIEW</div>
          <h1>Confirm this update.</h1>
          <p>Review the exact values before the WordPress update.</p>
        </div>
      </header>
      {notice ? <p className="w-inset">{notice}</p> : null}
      <article className="w-panel">
        <h2>{changePath(change)}</h2>
        <div className="change-pair">
          <div className="change-cell suggested"><small>Approved title</small><span>{title}</span></div>
          <div className="change-cell suggested"><small>Approved description</small><span>{description}</span></div>
        </div>
        <p>One page · titles and descriptions only · previous values retained · approver {getUser()?.result?.username || getUser()?.data?.username || "signed-in user"}.</p>
        <div className="w-actions">
          <Link className="w-button" href={`/app/queue/${change.id}`}>Back to draft</Link>
          <button className="w-button primary" type="button" onClick={publish} disabled={busy}>{busy ? "Publishing…" : "Confirm publication"}</button>
        </div>
      </article>
      <p className="w-footnote">Publishing stops if the page changed since review. The write is checked after it is applied.</p>
    </section>
  );
}
