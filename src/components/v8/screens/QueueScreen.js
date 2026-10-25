"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { changePath, listChanges, queueItems } from "@/lib/v1Api";
import { activeSiteContext } from "@/lib/siteContext";
import { loadJourney } from "@/lib/journey";
import SearchifyLoader from "@/components/v8/SearchifyLoader";
import "@/styles/v8-screens.css";

const CONTENT_COL = {
  flex: "999 1 560px",
  minWidth: 0,
  minHeight: 1000,
  background: "#0A0B0D",
  color: "#F2F4F5",
  fontFamily: "Geist, 'Helvetica Neue', sans-serif",
  boxSizing: "border-box",
  padding: "22px clamp(16px, 4vw, 56px) 56px",
  display: "flex",
  flexDirection: "column",
  gap: 32,
};

function kindLabel(c) {
  const opp = String(c.opportunity || "").trim();
  if (opp) {
    const head = opp.split("·")[0].split("—")[0].trim();
    if (head.length <= 48) return head;
  }
  const ct = String(c.changeType || "meta").toLowerCase();
  const map = {
    meta: "Title rewrite",
    image: "Images",
    content: "Content refresh",
    link: "Internal links",
    links: "Internal links",
    schema: "Schema",
    assets: "Speed",
    redirect: "Redirect",
  };
  return map[ct] || "Page update";
}

function expectedGain(c) {
  const p = c.proposed || {};
  if (p.expectedGain || p.gain) return String(p.expectedGain || p.gain);
  if (p.evidence?.clicks != null) return `+${p.evidence.clicks} clicks / mo`;
  return "+5–25 clicks / mo";
}

/**
 * Entry into Edit.dc.html (ReviewScreen): live pending changes → /app/queue/[id].
 * Prefer opening a single draft; list when several wait.
 */
export default function QueueScreen({ autoOpen = false } = {}) {
  const router = useRouter();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const { hostname } = useMemo(() => activeSiteContext(loadJourney()), []);

  useEffect(() => {
    let cancelled = false;
    listChanges({ force: true })
      .then((res) => {
        if (cancelled) return;
        const list = queueItems(Array.isArray(res.data) ? res.data : res.data?.changes || []);
        setRows(list);
        if (autoOpen && list[0]) {
          router.replace(`/app/queue/${list[0].id}`);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Could not load the queue.");
        setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [autoOpen, router]);

  if (rows === null || (autoOpen && rows.length > 0)) {
    return <SearchifyLoader label={rows === null ? "Loading drafts" : "Opening draft"} />;
  }

  return (
    <div style={CONTENT_COL}>
      <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
        <p
          style={{
            margin: 0,
            fontFamily: "'Geist Mono', monospace",
            fontSize: 12,
            color: "#9AA1AB",
            letterSpacing: "0.04em",
          }}
        >
          {hostname || "YOUR SITE"} · {rows.length} WAITING
        </p>
        <h1
          style={{
            margin: 0,
            fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
            fontSize: "clamp(34px, 4.2vw, 54px)",
            lineHeight: 1,
            letterSpacing: "-1.5px",
            fontWeight: 700,
          }}
        >
          Edit before shipping.
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: "#9AA1AB" }}>
          Open a draft, tune the title and description, then ship it. Live Google preview and checks update as you type.
        </p>
      </div>

      {error ? <p style={{ margin: 0, color: "#FF5A4E", maxWidth: 1180 }}>{error}</p> : null}

      {!rows.length ? (
        <div
          style={{
            maxWidth: 1180,
            width: "100%",
            margin: "0 auto",
            borderRadius: 24,
            border: "1px solid #262A31",
            background: "#131519",
            padding: 28,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <p style={{ margin: 0, fontSize: 16, color: "#F2F4F5" }}>No drafts waiting.</p>
          <p style={{ margin: 0, fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>
            Run a site scan or open Today&apos;s moves — Searchify will write the next title and description for you to approve.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/app/results"
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 48,
                padding: "0 22px",
                borderRadius: 14,
                background: "#4DA3FF",
                color: "#0A0B0D",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Open the scan
            </Link>
            <Link
              href="/app"
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 48,
                padding: "0 20px",
                borderRadius: 14,
                border: "1px solid #262A31",
                color: "#F2F4F5",
                fontSize: 15,
                textDecoration: "none",
              }}
            >
              Today&apos;s moves
            </Link>
          </div>
        </div>
      ) : (
        <ul
          style={{
            listStyle: "none",
            margin: "0 auto",
            padding: 0,
            maxWidth: 1180,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {rows.map((c) => {
            const path = changePath(c);
            const kind = kindLabel(c);
            const title = c.proposed?.title || c.opportunity || "Untitled draft";
            return (
              <li key={c.id}>
                <Link
                  href={`/app/queue/${c.id}`}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 14,
                    padding: "20px 22px",
                    borderRadius: 20,
                    border: "1px solid #262A31",
                    background: "#131519",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <span style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, flex: "1 1 280px" }}>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: "#4DA3FF" }}>
                      {kind.toUpperCase()} · {path}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                        fontSize: 20,
                        fontWeight: 700,
                        letterSpacing: "-0.4px",
                        lineHeight: 1.2,
                      }}
                    >
                      {title}
                    </span>
                    <span style={{ fontSize: 13, color: "#9AA1AB" }}>{expectedGain(c)}</span>
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: 44,
                      padding: "0 18px",
                      borderRadius: 12,
                      background: "#4DA3FF",
                      color: "#0A0B0D",
                      fontSize: 14,
                      fontWeight: 600,
                      flex: "none",
                    }}
                  >
                    Edit
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
