"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Btn, Hero, Pill } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import { usePageBoot } from "@/lib/usePageBoot";
import { loadFeature, syncGoogleLive } from "@/lib/v1Api";

function parsePos(v) {
  const n = Number(String(v || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export default function RankingsPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = usePageBoot((s) => s.getFeature("organic-search"));

  const load = useCallback(async () => {
    const feat = await loadFeature("organic-search");
    const raw = feat?.data?.payload?.rows || feat?.data?.rows || [];
    const mapped = raw.slice(0, 40).map((r) => {
      const keyword = String(r[0] || "");
      const clicks = r[1];
      const impr = r[2];
      const pos = parsePos(r[4] ?? r[3]);
      return {
        keyword,
        url: r[5] || "—",
        position: pos,
        previous: null,
        volume: impr,
        clicks,
        category: pos == null ? "Unranked" : pos <= 10 ? "Top 10" : "Page 2+",
        trend: [],
      };
    }).filter((row) => row.keyword);
    setRows(mapped);
    setSelected(0);
    setBooted(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const list = useMemo(() => {
    if (filter === "Top 10") return rows.filter((x) => x.category === "Top 10");
    if (filter === "Page 2+") return rows.filter((x) => x.category === "Page 2+");
    return rows;
  }, [rows, filter]);

  useEffect(() => {
    setSelected(0);
  }, [filter]);

  const k = list[selected] || list[0];
  const top10 = rows.filter((r) => r.category === "Top 10").length;
  const impressions = rows.reduce((sum, r) => sum + (Number(r.volume) || 0), 0);

  const sync = async () => {
    setBusy(true);
    await syncGoogleLive();
    await load();
    setBusy(false);
  };

  if (!booted) return <PageSkeleton />;

  if (!rows.length) {
    return (
      <>
        <Hero label="Keyword rankings" line1="KNOW WHERE" line2="YOU STAND." sub="Track the searches that matter to your business." />
        <div className="sf-empty sf-box">
          <h2>No ranking data yet</h2>
          <p>Connect Search Console and sync to load live queries.</p>
          <div style={{ marginTop: 18 }}>
            <Btn primary onClick={sync} disabled={busy}>
              {busy ? "Syncing…" : "Sync Google →"}
            </Btn>
          </div>
        </div>
      </>
    );
  }

  const pos = k?.position;
  const chartY = pos == null ? 100 : 35 + (Math.min(pos, 20) - 1) * 7.3;

  return (
    <>
      <Hero
        label="Keyword rankings"
        line1="KNOW WHERE"
        line2="YOU STAND."
        sub="Live Search Console queries only. Movement history is not invented."
        action={<Btn onClick={sync} disabled={busy}>{busy ? "Syncing…" : "Refresh GSC"}</Btn>}
      />

      <div className="sf-row sf-between">
        <div className="sf-row">
          <Pill neutral>Search Console</Pill>
          <Pill neutral>Google · Live</Pill>
        </div>
        <Btn href="/app/queue">Open work queue →</Btn>
      </div>

      <div className="sf-three sf-gap">
        <div className="sf-box">
          <div className="sf-small">Keywords tracked</div>
          <div className="sf-metric">{rows.length}</div>
          <span className="sf-small">From Search Console</span>
        </div>
        <div className="sf-box">
          <div className="sf-small">In the top 10</div>
          <div className="sf-metric">
            {top10} <span style={{ fontSize: 18, color: "var(--sf-sub)" }}>/ {rows.length}</span>
          </div>
          <span className="sf-small">Latest positions</span>
        </div>
        <div className="sf-box">
          <div className="sf-small">Impressions in window</div>
          <div className="sf-metric">{impressions || "—"}</div>
          <span className="sf-small">Sum of live GSC rows</span>
        </div>
      </div>

      <div className="sf-direction sf-gap">
        <h2>Your keywords</h2>
        <div className="sf-rankfilters">
          {["All", "Top 10", "Page 2+"].map((f) => (
            <button key={f} type="button" className="sf-btn" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="sf-list">
        <div className="sf-tablewrap">
          <table className="sf-ranktable">
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Position</th>
                <th>Range</th>
                <th>Impressions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((x, ix) => (
                  <tr key={x.keyword + ix} aria-selected={ix === selected}>
                    <td>
                      <button type="button" className="sf-keyword" onClick={() => setSelected(ix)}>
                        {x.keyword}
                        <span className="sf-small" style={{ display: "block", marginTop: 3 }}>
                          {x.clicks} clicks
                        </span>
                      </button>
                    </td>
                    <td>
                      <strong style={{ fontSize: 22 }}>{x.position ?? "—"}</strong>
                    </td>
                    <td>
                      <Pill neutral>{x.category}</Pill>
                    </td>
                    <td>{x.volume}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sf-ranklayout sf-gap">
        <div className="sf-box">
          <div className="sf-label">Selected keyword</div>
          <h2 style={{ marginTop: 10 }}>{k?.keyword || "No keyword in this filter"}</h2>
          <div className="sf-small">Current average position · Lower is better</div>
          <svg className="sf-chart" viewBox="0 0 590 218" role="img" aria-label={`${k?.keyword || "keyword"} current position`}>
            <g stroke="var(--sf-line)" strokeWidth="1">
              <path d="M45 35H550M45 100.7H550M45 173.7H550" />
            </g>
            <text x="19" y="39">1</text>
            <text x="12" y="105">10</text>
            <text x="12" y="178">20</text>
            {pos != null ? <circle cx="297" cy={chartY} r="6" fill="currentColor" /> : null}
          </svg>
          <div className="sf-note">Point-in-time Search Console average. Historical movement is not available in this release.</div>
        </div>
        <div className="sf-rankdetail">
          <div className="sf-label">Current position</div>
          <div className="sf-row sf-between" style={{ margin: "20px 0" }}>
            <span className="sf-ranknumber">{pos != null ? `#${pos}` : "—"}</span>
            <Pill neutral>Live GSC</Pill>
          </div>
          <h3>Send this query to the work queue</h3>
          <p style={{ fontSize: 14 }}>
            Rankings come from Search Console. Title and description updates are approved in the work queue, then published to WordPress.
          </p>
          <div className="sf-divider" />
          <div className="sf-small">Clicks in window</div>
          <div style={{ margin: "7px 0 18px", fontSize: 14 }}>{k?.clicks ?? "—"}</div>
          <Btn primary onClick={() => router.push("/app/queue")}>
            Review page opportunities
          </Btn>
        </div>
      </div>
    </>
  );
}
