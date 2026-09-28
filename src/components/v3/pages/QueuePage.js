"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import { usePageBoot } from "@/lib/usePageBoot";
import {
  changePath,
  changeTitle,
  dismissChange,
  getGoogleStatus,
  listChanges,
  listCmsConnections,
  queueItems,
  syncGoogleLive,
} from "@/lib/v1Api";

export default function QueuePage() {
  const toast = useV3Toast();
  const [filter, setFilter] = useState("Ready");
  const [changes, setChanges] = useState([]);
  const [busy, setBusy] = useState(false);
  const [wpOk, setWpOk] = useState(false);
  const [gscOk, setGscOk] = useState(false);
  const [gscSynced, setGscSynced] = useState(false);
  const [gscError, setGscError] = useState("");
  const [booted, setBooted] = usePageBoot((s) => s.getChanges() && s.getGoogle());

  const load = useCallback(async () => {
    const [{ data }, google, cms] = await Promise.all([
      listChanges({ force: true }),
      getGoogleStatus(),
      listCmsConnections(),
    ]);
    setChanges(Array.isArray(data) ? data : []);
    const g = google.data?.connection;
    setGscOk(Boolean(g?.gscSiteUrl || g?.status === "connected"));
    setGscSynced(Boolean(g?.lastSyncAt || g?.gscSiteUrl));
    setGscError(g?.lastError || "");
    setWpOk(Boolean((cms.data?.connections || []).some((c) => c.provider === "wordpress" && c.status === "connected")));
    setBooted(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ready = useMemo(() => (gscOk ? queueItems(changes) : []), [changes, gscOk]);
  const later = useMemo(() => (gscOk ? changes.filter((c) => c.status === "dismissed") : []), [changes, gscOk]);
  const list = filter === "Ready" ? ready : later;

  if (!booted) return <PageSkeleton />;

  const refresh = async () => {
    if (!gscOk) {
      toast("Connect Google Search Console first — WordPress alone does not create queue items.");
      return;
    }
    setBusy(true);
    toast("Syncing Search Console, then opening opportunities…");
    const sync = await syncGoogleLive();
    setBusy(false);
    if (!sync.ok) {
      toast(sync.data?.detail || "Google sync failed. Reconnect GSC in Settings.");
      return;
    }
    const created = sync.data?.queue?.created;
    if (sync.data?.queueError) {
      toast(sync.data.queueError);
    } else {
      toast(
        created != null
          ? `Opened ${created} opportunities from Search Console.`
          : "Google synced. If the queue is still empty, Search Console has no pages yet.",
      );
    }
    await load();
  };

  return (
    <>
      <Hero
        label="Work queue"
        line1="MAKE EVERY"
        line2="PAGE COUNT."
        sub="Review a short, prioritized list. Keep the changes that fit your business."
        action={
          <Btn primary onClick={refresh} disabled={busy}>
            {busy ? "Checking…" : "Refresh from GSC →"}
          </Btn>
        }
      />

      <div className="sf-box sf-gap">
        <h3>How this works</h3>
        <div className="sf-list">
          <div className="sf-listrow" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <span>1. WordPress</span>
            <span className="sf-small">{wpOk ? "Connected · used only when you publish" : "Not connected"}</span>
          </div>
          <div className="sf-listrow" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <span>2. Search Console</span>
            <span className="sf-small">{gscOk ? "Connected · fills this queue" : "Not connected · required"}</span>
          </div>
          <div className="sf-listrow" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <span>3. Review → Confirm → Publish</span>
            <span className="sf-small">Only then does WordPress update titles/descriptions</span>
          </div>
        </div>
        {!gscOk ? (
          <div className="sf-row sf-between sf-gap">
            <p style={{ fontSize: 13, margin: 0 }}>
              Connecting WordPress does not add work-queue items. Connect Google, sync, then click Refresh from GSC.
            </p>
            <Btn primary href="/app/connections/google">
              Connect Google →
            </Btn>
          </div>
        ) : !ready.length ? (
          <div className="sf-row sf-between sf-gap">
            <p style={{ fontSize: 13, margin: 0 }}>
              {gscError
                ? gscError
                : gscSynced
                  ? "GSC is connected. Pull live pages into the queue."
                  : "GSC connected — sync once, then open opportunities."}
            </p>
            <Btn primary onClick={refresh} disabled={busy}>
              {busy ? "Working…" : "Find opportunities →"}
            </Btn>
          </div>
        ) : null}
      </div>

      <div className="sf-toolbar">
        <button type="button" className={filter === "Ready" ? "active" : ""} onClick={() => setFilter("Ready")}>
          Ready to review ({ready.length})
        </button>
        <button type="button" className={filter === "Later" ? "active" : ""} onClick={() => setFilter("Later")}>
          Saved for later ({later.length})
        </button>
      </div>

      <div className="sf-list">
        {list.length ? (
          list.map((c) => (
            <div className="sf-listrow" key={c.id}>
              <div>
                <div className="sf-row" style={{ marginBottom: 8 }}>
                  <Pill warn={c.status !== "approved"}>{c.status === "approved" ? "Approved · waiting to publish" : "Pending review"}</Pill>
                  <Pill neutral>{c.changeType === "meta" ? "Title & description" : c.changeType}</Pill>
                  <span className="sf-small">{changePath(c)}</span>
                </div>
                <h3>{changeTitle(c)}</h3>
                <p style={{ fontSize: 13, maxWidth: 470 }}>{c.opportunity}</p>
                {c.approvedByName ? <div className="sf-small">Approved by {c.approvedByName}</div> : null}
              </div>
              <div className="sf-row">
                <Btn
                  onClick={async () => {
                    await dismissChange(c.id);
                    toast("Saved for later.");
                    load();
                  }}
                >
                  Later
                </Btn>
                <Btn primary href={`/app/queue/${c.id}`}>
                  Review →
                </Btn>
              </div>
            </div>
          ))
        ) : (
          <div className="sf-empty">
            <h3>No items in the work queue yet</h3>
            <p style={{ fontSize: 14, maxWidth: 420, margin: "10px auto" }}>
              WordPress connection only enables publishing. Opportunities come from Google Search Console after you sync.
            </p>
            {!gscOk ? (
              <Btn primary href="/app/connections">
                Open Connections →
              </Btn>
            ) : (
              <Btn primary onClick={refresh} disabled={busy}>
                Refresh from GSC →
              </Btn>
            )}
          </div>
        )}
      </div>
    </>
  );
}
