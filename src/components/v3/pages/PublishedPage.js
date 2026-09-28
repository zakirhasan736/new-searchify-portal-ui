"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Btn, Pill } from "@/components/v3/V3Shell";
import { changePath, listChanges, queueItems } from "@/lib/v1Api";

export default function PublishedPage() {
  const { id } = useParams();
  const router = useRouter();
  const [change, setChange] = useState(null);
  const [nextId, setNextId] = useState(null);

  const load = useCallback(async () => {
    const { data } = await listChanges();
    const list = Array.isArray(data) ? data : [];
    setChange(list.find((x) => String(x.id) === String(id)) || null);
    const ready = queueItems(list).filter((x) => String(x.id) !== String(id));
    setNextId(ready[0]?.id || null);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!change) {
    return (
      <div className="sf-empty">
        <h2>Change not found</h2>
        <Btn href="/app/queue">← Work queue</Btn>
      </div>
    );
  }

  const dry = change.execution?.dryRun;
  const title = change.proposed?.title || "";
  const description = change.proposed?.metaDescription || "";

  return (
    <>
      <div className="sf-empty">
        <div className="sf-avatar" style={{ margin: "0 auto 18px", width: 48, height: 48, color: "var(--sf-green)" }}>
          ✓
        </div>
        <div className="sf-label">{dry ? "Dry-run recorded" : "Publication complete"}</div>
        <h1 style={{ fontFamily: "'Barlow Condensed', Impact, sans-serif", textTransform: "uppercase", fontSize: 48 }}>
          Your change is published.
        </h1>
        <p>{dry ? "Credentials incomplete — intent recorded. Connect WordPress to apply live." : "The approved text was applied and checked."}</p>
      </div>
      <div className="sf-box">
        <div className="sf-row sf-between">
          <h3>{changePath(change)}</h3>
          <Pill>{dry ? "Dry-run" : "Published"}</Pill>
        </div>
        <div className="sf-divider" />
        <div className="sf-small">New page title</div>
        <h3 style={{ marginTop: 7 }}>{title}</h3>
        <p style={{ marginTop: 9, fontSize: 13 }}>{description}</p>
      </div>
      <div className="sf-grid sf-gap">
        <div className="sf-box">
          <h3>What happens next</h3>
          <p style={{ fontSize: 13 }}>The next checks track this page’s search performance.</p>
        </div>
        <div className="sf-box">
          <h3>You can undo this</h3>
          <p style={{ fontSize: 13 }}>The previous values are saved in your change history.</p>
          <button type="button" className="sf-link" onClick={() => router.push("/app/history")}>
            Open change history →
          </button>
        </div>
      </div>
      <div className="sf-row sf-between sf-gap">
        <Btn href="/app">Back to overview</Btn>
        <Btn primary onClick={() => (nextId ? router.push(`/app/queue/${nextId}`) : router.push("/app/results"))}>
          {nextId ? "Review next update →" : "View results"}
        </Btn>
      </div>
    </>
  );
}
