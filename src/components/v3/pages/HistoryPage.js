"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import { usePageBoot } from "@/lib/usePageBoot";
import { changePath, historyItems, listChanges, queueItems, undoChange } from "@/lib/v1Api";

export default function HistoryPage() {
  const toast = useV3Toast();
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [firstReady, setFirstReady] = useState(null);
  const [undoId, setUndoId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = usePageBoot((s) => s.getChanges());

  const load = useCallback(async () => {
    const { data } = await listChanges();
    const list = Array.isArray(data) ? data : [];
    setHistory(historyItems(list));
    setFirstReady(queueItems(list)[0]?.id || null);
    setBooted(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const confirmUndo = async () => {
    if (undoId == null) return;
    setBusy(true);
    const res = await undoChange(undoId);
    setBusy(false);
    setUndoId(null);
    if (!res.ok) {
      toast(res.data?.detail || "Could not restore previous values.");
      return;
    }
    toast("Previous values restored. The change remains in your history.");
    load();
  };

  if (!booted) return <PageSkeleton />;

  return (
    <>
      <Hero
        label="Change history"
        line1="EVERY CHANGE."
        line2="ON RECORD."
        sub="Pending, who approved, publish status, and undo — the full approval trail."
      />

      {undoId != null ? (
        <div className="sf-box" style={{ marginBottom: 15 }}>
          <h3>Restore the previous title and description?</h3>
          <p style={{ fontSize: 13 }}>This restores the saved values for this change.</p>
          <div className="sf-row sf-gap">
            <Btn onClick={() => setUndoId(null)}>Keep current version</Btn>
            <Btn primary onClick={confirmUndo} disabled={busy}>
              Restore previous version
            </Btn>
          </div>
        </div>
      ) : null}

      <div className="sf-list">
        {history.length ? (
          history.map((h) => (
            <div className="sf-listrow" key={h.id}>
              <div>
                <div className="sf-row">
                  <Pill neutral={h.status === "undone" || h.status === "failed"}>
                    {h.status === "undone"
                      ? "Restored"
                      : h.status === "failed"
                        ? "Failed"
                        : h.execution?.dryRun
                          ? "Dry-run"
                          : "Published"}
                  </Pill>
                  <span className="sf-small">
                    {h.appliedAt ? new Date(h.appliedAt).toLocaleString() : new Date(h.updatedAt || h.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 style={{ marginTop: 10 }}>{changePath(h)}</h3>
                <div className="sf-small">{h.proposed?.title}</div>
                <div className="sf-small">
                  Approved by {h.approvedByName || "workspace approver"}
                  {h.approvedAt ? ` · ${new Date(h.approvedAt).toLocaleString()}` : ""}
                  {h.execution?.undoneBy ? ` · Restored by ${h.execution.undoneBy}` : ""}
                </div>
                <details style={{ marginTop: 10, fontSize: 12 }}>
                  <summary>View changed values</summary>
                  <div className="sf-before">
                    Before: {h.proposed?.beforeTitle || "—"}
                    <br />
                    After: {h.proposed?.title || "—"}
                    <br />
                    Description: {h.proposed?.metaDescription || "—"}
                  </div>
                </details>
              </div>
              {h.status !== "undone" && h.status !== "failed" ? <Btn onClick={() => setUndoId(h.id)}>Undo change</Btn> : null}
            </div>
          ))
        ) : (
          <div className="sf-empty">
            <h2>No changes published yet.</h2>
            <p>Approved updates and their previous values appear here.</p>
            <div style={{ marginTop: 18 }}>
              <Btn primary onClick={() => router.push(firstReady ? `/app/queue/${firstReady}` : "/app/queue")}>
                Review your first update
              </Btn>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
