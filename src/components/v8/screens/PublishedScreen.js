"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { changePath, listChanges, queueItems } from "@/lib/v1Api";
import { activeSiteContext } from "@/lib/siteContext";
import { loadJourney } from "@/lib/journey";
import "@/styles/v8-screens.css";

const LIVE = new Set(["applied", "monitoring", "closed", "published_unverified", "executing"]);

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

function headline(change) {
  const check = change?.execution?.liveCheck || {};
  const status = change?.status || "";
  if (status === "executing") {
    return {
      tag: "PUBLISHING",
      title: "Shipping to your site now.",
      body: "The website has not confirmed the write yet. This page refreshes when it does.",
      tone: "blue",
    };
  }
  if (!LIVE.has(status) || status === "failed") {
    return {
      tag: "NOT LIVE",
      title: "This change is not on the live page yet.",
      body: change?.execution?.detail || "Nothing was written. Open the draft to try again.",
      tone: "red",
    };
  }
  if (status === "published_unverified") {
    return {
      tag: "SHIPPED · NOT CONFIRMED",
      title: "Sent to the website. Not confirmed yet.",
      body: "The CMS accepted the write but did not confirm the new title. Check the live page, or wait for cache to clear.",
      tone: "yellow",
    };
  }
  if (check.read && check.titleLive === false) {
    return {
      tag: "SHIPPED · NOT YET VISIBLE",
      title: "Published, not yet showing on the live page.",
      body: "The CMS confirmed the write, but the live page still shows the old title. Caching or an SEO plugin may be overriding it.",
      tone: "yellow",
    };
  }
  if (check.read && check.titleLive) {
    return {
      tag: "LIVE ON THE PAGE",
      title: "Shipped and checked live.",
      body: "The approved title and description were written and found on the live page. Searchify will measure this move for 28 days.",
      tone: "green",
    };
  }
  return {
    tag: "SHIPPED",
    title: "Your change is published.",
    body: "The CMS confirmed the write. Live page verification was skipped or could not read the page afterwards.",
    tone: "blue",
  };
}

const TONE = {
  blue: { border: "rgba(77,163,255,.45)", glow: "0 0 28px rgba(77,163,255,.18)", dot: "#4DA3FF" },
  green: { border: "rgba(61,220,132,.45)", glow: "0 0 28px rgba(61,220,132,.18)", dot: "#3DDC84" },
  yellow: { border: "rgba(255,197,61,.45)", glow: "0 0 28px rgba(255,197,61,.15)", dot: "#FFC53D" },
  red: { border: "rgba(255,90,78,.45)", glow: "0 0 28px rgba(255,90,78,.15)", dot: "#FF5A4E" },
};

export default function PublishedScreen() {
  const { id } = useParams();
  const router = useRouter();
  const [change, setChange] = useState(null);
  const [nextId, setNextId] = useState(null);
  const [hostname, setHostname] = useState("your site");

  const load = useCallback(async () => {
    const { hostname: host } = activeSiteContext(loadJourney());
    setHostname(host || "your site");
    const res = await listChanges({ force: true });
    const list = Array.isArray(res.data) ? res.data : res.data?.changes || [];
    const row = list.find((x) => String(x.id) === String(id)) || null;
    setChange(row);
    const ready = queueItems(list).filter((x) => String(x.id) !== String(id));
    setNextId(ready[0]?.id || null);
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  if (!change) {
    return (
      <div style={CONTENT_COL}>
        <p style={{ margin: 0, color: "#9AA1AB", fontSize: 15 }}>
          Loading… or this change is gone. <Link href="/app">Back to Today&apos;s moves</Link>
        </p>
      </div>
    );
  }

  const copy = headline(change);
  const tone = TONE[copy.tone] || TONE.blue;
  const path = changePath(change);
  const title = change.proposed?.publishedTitle || change.proposed?.title || "";
  const desc = change.proposed?.publishedDescription || change.proposed?.metaDescription || "";
  const wasTitle = change.proposed?.liveTitle || change.proposed?.beforeTitle || change.proposed?.currentTitle || "";
  const live = LIVE.has(change.status) && change.status !== "executing" && change.status !== "failed";

  return (
    <div style={CONTENT_COL}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <Link
          href="/app"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            minHeight: 40,
            padding: "0 14px",
            borderRadius: 999,
            border: "1px solid #262A31",
            color: "#F2F4F5",
            textDecoration: "none",
            fontSize: 13,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Home
        </Link>
        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, color: "#9AA1AB" }}>
          {hostname} · {path}
        </span>
      </header>

      <div
        style={{
          maxWidth: 1180,
          width: "100%",
          margin: "0 auto",
          borderRadius: 24,
          background: "#101215",
          border: `1px solid ${tone.border}`,
          boxShadow: tone.glow,
          padding: "clamp(24px, 3vw, 36px)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "'Geist Mono', monospace", fontSize: 12, color: tone.dot }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: tone.dot, boxShadow: `0 0 10px ${tone.dot}`, animation: change.status === "executing" ? "sfy-breathe 1s ease-in-out infinite" : "none" }} />
          {copy.tag}
        </span>
        <h1
          style={{
            margin: 0,
            fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
            fontSize: "clamp(32px, 4vw, 48px)",
            lineHeight: 1.02,
            letterSpacing: "-1.4px",
            fontWeight: 700,
          }}
        >
          {copy.title}
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: "#9AA1AB", lineHeight: 1.5, maxWidth: 640 }}>{copy.body}</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          <div style={{ borderRadius: 16, background: "#0A0B0D", border: "1px solid #1A1D22", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: "#7D848E" }}>WAS</span>
            <span style={{ fontSize: 16, color: "#9AA1AB", textDecoration: "line-through", lineHeight: 1.35 }}>{wasTitle || "(No previous title)"}</span>
          </div>
          <div
            style={{
              borderRadius: 16,
              background: "rgba(77,163,255,.06)",
              border: `1.5px solid ${live ? "#3DDC84" : "#4DA3FF"}`,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: live ? "#3DDC84" : "#4DA3FF" }}>
              {live ? "LIVE NOW" : "SHIPPING"}
            </span>
            <span style={{ fontSize: 16, color: "#8AB4F8", lineHeight: 1.35 }}>{title || "—"}</span>
            <span style={{ fontSize: 14, color: "#D7DADE", lineHeight: 1.45 }}>{desc || "—"}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => router.push(nextId ? `/app/queue/${nextId}` : "/app")}
          style={{
            minHeight: 56,
            padding: "0 28px",
            borderRadius: 14,
            border: 0,
            background: "#4DA3FF",
            color: "#0A0B0D",
            fontSize: 16,
            fontWeight: 600,
            boxShadow: "0 0 24px rgba(77,163,255,.45)",
          }}
        >
          {nextId ? "Next move" : "Back to Today's moves"}
        </button>
        <Link
          href="/app/history"
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: 56,
            padding: "0 20px",
            borderRadius: 14,
            border: "1px solid #262A31",
            color: "#F2F4F5",
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          Open change log
        </Link>
        {!live ? (
          <Link
            href={`/app/queue/${change.id}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 56,
              padding: "0 20px",
              borderRadius: 14,
              border: "1px solid #262A31",
              color: "#D7DADE",
              fontSize: 15,
              textDecoration: "none",
            }}
          >
            Back to the draft
          </Link>
        ) : null}
      </div>
    </div>
  );
}
