"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Btn, Hero, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import { getUser } from "@/utils/users/Helpers";
import { approveChange, changePath, executeChange, listChanges } from "@/lib/v1Api";

export default function ConfirmPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useV3Toast();
  const [change, setChange] = useState(null);
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

  if (!booted) return <PageSkeleton />;

  if (!change) {
    return (
      <div className="sf-empty">
        <h2>Change not found</h2>
        <Btn href="/app/queue">← Work queue</Btn>
      </div>
    );
  }

  const title = change.proposed?.title || "";
  const description = change.proposed?.metaDescription || "";

  const publish = async () => {
    setBusy(true);
    const appr = await approveChange(change.id);
    if (!appr.ok) {
      setBusy(false);
      toast(appr.data?.detail || "Could not approve.");
      return;
    }
    const exec = await executeChange(change.id, { forceDryRun: false });
    setBusy(false);
    if (!exec.ok) {
      toast(exec.data?.detail || exec.data?.execution?.detail || "Publish failed.");
      return;
    }
    if (exec.data?.execution?.dryRun) {
      toast("Recorded as dry-run — add WordPress credentials + post/page id for live publish.");
    }
    router.push(`/app/queue/${change.id}/published`);
  };

  return (
    <>
      <Hero label="Publication review" line1="CONFIRM" line2="THIS UPDATE." sub="Review the exact values before the WordPress update." />
      <div className="sf-box">
        <h2>{changePath(change)}</h2>
        <div className="sf-before">
          <div className="sf-label">Approved title</div>
          <h3>{title}</h3>
          <div className="sf-label sf-gap">Approved description</div>
          <p>{description}</p>
        </div>
        <div className="sf-divider" />
        <p>
          1 page · Metadata only · Previous values retained · Approver{" "}
          {getUser()?.result?.username || getUser()?.data?.username || "signed-in user"}
        </p>
        <div className="sf-row sf-gap">
          <Btn href={`/app/queue/${change.id}`}>Back to draft</Btn>
          <Btn primary onClick={publish} disabled={busy}>
            {busy ? "Publishing…" : "Confirm publication"}
          </Btn>
        </div>
      </div>
      <div className="sf-note sf-gap">
        The workflow stops if the page has changed since review. Conflict check, write, and read-back verification run on publish.
      </div>
    </>
  );
}
