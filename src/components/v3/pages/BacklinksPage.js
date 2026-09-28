"use client";

import { useCallback, useEffect, useState } from "react";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import { usePageBoot } from "@/lib/usePageBoot";
import { loadFeature } from "@/lib/v1Api";

export default function BacklinksPage() {
  const toast = useV3Toast();
  const [filter, setFilter] = useState("All");
  const [rows, setRows] = useState([]);
  const [booted, setBooted] = usePageBoot((s) => s.getFeature("backlinks"));

  const load = useCallback(async () => {
    const feat = await loadFeature("backlinks");
    const raw = feat?.data?.payload?.rows || feat?.data?.rows || [];
    setRows(
      raw.map((r) => ({
        domain: r[0],
        page: r[1] || "—",
        target: r[2] || "/",
        anchor: r[3] || "—",
        status: r[4] || "Active",
        rel: r[5] || "—",
        date: r[6] || "—",
      })),
    );
    setBooted(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const list = rows.filter((x) => filter === "All" || x.status === filter);

  if (!booted) return <PageSkeleton />;

  return (
    <>
      <Hero label="Backlinks" line1="SEE WHO" line2="LINKS TO YOU." sub="See which websites link to you and which links changed." />

      <div className="sf-three sf-gap">
        <div className="sf-box">
          <div className="sf-small">Referring domains</div>
          <div className="sf-metric">{new Set(rows.map((r) => r.domain)).size || "—"}</div>
          <div className="sf-small">From stored link records</div>
        </div>
        <div className="sf-box">
          <div className="sf-small">Active links</div>
          <div className="sf-metric">{rows.filter((r) => r.status !== "Lost").length || "—"}</div>
          <div className="sf-small">Including new discoveries</div>
        </div>
        <div className="sf-box">
          <div className="sf-small">Lost links</div>
          <div className="sf-metric">{rows.filter((r) => r.status === "Lost").length || "—"}</div>
          <div className="sf-small">Verify before action</div>
        </div>
      </div>

      <div className="sf-direction sf-gap">
        <h2>Link activity</h2>
        <div className="sf-rankfilters">
          {["All", "New", "Lost"].map((x) => (
            <button key={x} type="button" className="sf-btn" aria-pressed={filter === x} onClick={() => setFilter(x)}>
              {x}
            </button>
          ))}
        </div>
      </div>

      <div className="sf-list">
        {list.length ? (
          list.map((x, i) => (
            <div className="sf-listrow" key={i}>
              <div>
                <div className="sf-row">
                  <h3>{x.domain}</h3>
                  <Pill warn={x.status === "Lost"}>{x.status}</Pill>
                </div>
                <div className="sf-small">
                  Source: {x.page} · {x.rel} · {x.date}
                </div>
                <p style={{ marginTop: 10 }}>
                  “{x.anchor}” → {x.target}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="sf-empty">
            <h2>No backlink records yet</h2>
            <p>Backlink crawling is planned for a later upgrade. GSC/GA4 workflow stays available now.</p>
            <div style={{ marginTop: 18 }}>
              <Btn href="/app/results">Open performance</Btn>
            </div>
          </div>
        )}
      </div>

      <div className="sf-note sf-gap">
        No domain-quality or toxicity verdict is inferred.{" "}
        <button type="button" className="sf-link" onClick={() => toast("Backlink provider will be added in a later release.")}>
          Learn more →
        </button>
      </div>
    </>
  );
}
