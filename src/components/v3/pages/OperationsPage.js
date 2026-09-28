"use client";

import { useCallback, useEffect, useState } from "react";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import { ackOpsNotice, createOpsBackup, getOps, restoreOpsBackup, retryOps, saveUsageControls } from "@/lib/v1Api";

export default function OperationsPage() {
  const toast = useV3Toast();
  const [ops, setOps] = useState(null);
  const [hours, setHours] = useState(6);
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = useState(false);

  const load = useCallback(async () => {
    const res = await getOps();
    if (res.ok) {
      setOps(res.data);
      setHours(Number(res.data?.scanHours) || 6);
    }
    setBooted(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn, okMsg) => {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Action failed.");
      return;
    }
    toast(okMsg);
    load();
  };

  if (!booted) return <PageSkeleton />;

  const notices = ops?.notices || [];
  const failed = ops?.failedPublishes || [];

  return (
    <>
      <Hero
        label="Operations"
        line1="KEEP WORK"
        line2="RUNNING."
        sub="Schedules, retries, failure notices, backups, and recovery — without leaving the workspace."
      />

      <div className="sf-three sf-gap">
        <div className="sf-box">
          <div className="sf-small">Scan schedule</div>
          <div className="sf-metric" style={{ fontSize: 28 }}>
            Every {ops?.scanHours || hours}h
          </div>
          <Pill warn={ops?.scansPaused}>{ops?.scansPaused ? "Paused" : "On"}</Pill>
        </div>
        <div className="sf-box">
          <div className="sf-small">Google health</div>
          <div className="sf-metric" style={{ fontSize: 22 }}>
            {ops?.googleStatus || "disconnected"}
          </div>
          <span className="sf-small">{ops?.googleError || "No open sync error"}</span>
        </div>
        <div className="sf-box">
          <div className="sf-small">Last backup</div>
          <div className="sf-metric" style={{ fontSize: 18 }}>
            {ops?.lastBackupAt ? String(ops.lastBackupAt).slice(0, 19) : "None yet"}
          </div>
        </div>
      </div>

      <div className="sf-box sf-gap">
        <h2>Schedule + retries</h2>
        <p>Background sync uses this interval. Pause it to stop API spend overnight.</p>
        <label className="sf-field">
          Hours between Google scans
          <input type="number" min={1} max={168} value={hours} onChange={(e) => setHours(Number(e.target.value) || 6)} />
        </label>
        <div className="sf-row sf-gap">
          <Btn
            primary
            disabled={busy}
            onClick={() => act(() => saveUsageControls({ scanHours: hours }), `Scans set to every ${hours} hours.`)}
          >
            Save schedule
          </Btn>
          <Btn
            disabled={busy}
            onClick={() =>
              act(() => saveUsageControls({ scansPaused: !ops?.scansPaused }), ops?.scansPaused ? "Scans resumed." : "Scans paused.")
            }
          >
            {ops?.scansPaused ? "Resume scans" : "Pause scans"}
          </Btn>
          <Btn disabled={busy} onClick={() => act(retryOps, "Retry sent to Google.")}>
            Retry failed sync
          </Btn>
        </div>
      </div>

      <div className="sf-box sf-gap">
        <div className="sf-row sf-between">
          <div>
            <h2>Failure notices</h2>
            <p>Open items stay here until someone acknowledges or resolves them.</p>
          </div>
          <Pill warn={notices.some((n) => n.status === "open")}>{notices.filter((n) => n.status === "open").length} open</Pill>
        </div>
        {notices.length ? (
          notices.map((note) => (
            <div className="sf-listrow" key={note.id} style={{ paddingLeft: 0, paddingRight: 0 }}>
              <div>
                <div className="sf-row" style={{ marginBottom: 6 }}>
                  <Pill warn={note.status === "open"}>{note.status}</Pill>
                  <span className="sf-small">{note.kind}</span>
                </div>
                <h3>{note.title}</h3>
                <p style={{ fontSize: 13 }}>{note.detail}</p>
              </div>
              {note.status === "open" ? (
                <div className="sf-row">
                  <Btn onClick={() => act(() => ackOpsNotice(note.id, "acked"), "Notice acknowledged.")}>Ack</Btn>
                  <Btn primary onClick={() => act(() => ackOpsNotice(note.id, "resolved"), "Notice resolved.")}>
                    Resolve
                  </Btn>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <p style={{ fontSize: 13 }}>No notices yet. Failed syncs and publishes appear here automatically.</p>
        )}
      </div>

      {failed.length ? (
        <div className="sf-box sf-gap">
          <h2>Failed publishes</h2>
          {failed.map((row) => (
            <p key={row.id} style={{ fontSize: 13 }}>
              {row.targetUrl || row.opportunity} · {row.status}
            </p>
          ))}
        </div>
      ) : null}

      <div className="sf-box sf-gap">
        <h2>Backups + recovery</h2>
        <p>
          A snapshot stores clients, site map, and business context. Live Google/WordPress tokens are not overwritten on
          restore.
        </p>
        <div className="sf-row sf-gap">
          <Btn primary disabled={busy} onClick={() => act(createOpsBackup, "Backup saved.")}>
            Create backup
          </Btn>
          <Btn disabled={busy} onClick={() => act(restoreOpsBackup, "Business context restored from the last backup.")}>
            Restore last backup
          </Btn>
        </div>
      </div>
    </>
  );
}
