"use client";

import { useState } from "react";
import { writePartnerMessage } from "@/lib/partnerApi";

const CHANNELS = [
  ["instagram", "Instagram"],
  ["tiktok", "TikTok / Reels"],
  ["facebook", "Facebook"],
  ["youtube", "YouTube"],
  ["linkedin", "LinkedIn"],
  ["x", "X / Threads"],
  ["email", "Email"],
  ["blog", "Blog or review"],
  ["whatsapp", "WhatsApp / DM"],
];
const AUDIENCES = [
  ["owners", "Small business owners"],
  ["local", "Local businesses"],
  ["agencies", "Agencies and web designers"],
  ["bloggers", "Bloggers and creators"],
  ["stores", "WooCommerce stores"],
];
const TONES = [
  ["friendly", "Friendly"],
  ["expert", "Expert"],
  ["bold", "Bold"],
];

const field = {
  minHeight: 42,
  padding: "0 12px",
  borderRadius: 11,
  border: "1px solid #262A31",
  background: "#0A0B0D",
  color: "#F2F4F5",
  font: "inherit",
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
};
const label = { display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#9AA1AB", minWidth: 0 };

/** Pitch Studio: the partner picks channel, audience and tone; the server drafts a message with their link and disclosure. */
export default function PitchStudio({ handle }) {
  const [channel, setChannel] = useState("instagram");
  const [audience, setAudience] = useState("owners");
  const [tone, setTone] = useState("friendly");
  const [angle, setAngle] = useState("");
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [meta, setMeta] = useState(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const write = async () => {
    setBusy(true);
    setErr("");
    setCopied(false);
    const res = await writePartnerMessage({ channel, audience, tone, angle }).catch(() => ({ ok: false, data: {} }));
    setBusy(false);
    if (!res.ok || !res.data?.text) {
      setErr(typeof res.data?.detail === "string" ? res.data.detail : "The writer could not reach Searchify. Try again in a moment.");
      return;
    }
    setDraft(res.data.text);
    setMeta({ source: res.data.source, channel: res.data.channel, left: res.data.left });
  };

  const copy = () => {
    try {
      navigator.clipboard.writeText(draft);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* ignore */
    }
  };

  const hasLink = draft && handle && draft.includes(`ref=${handle}`);
  const hasDisclosure = /commission|#ad|affiliate/i.test(draft);

  return (
    <section
      aria-labelledby="studio-h"
      style={{
        maxWidth: 1180,
        width: "100%",
        boxSizing: "border-box",
        margin: "0 auto",
        borderRadius: 22,
        background: "linear-gradient(180deg, rgba(77,163,255,.07), rgba(16,18,21,1) 60%)",
        border: "1px solid rgba(77,163,255,.35)",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h2 id="studio-h" style={{ margin: 0, fontSize: 19, fontWeight: 700, fontFamily: "'Bricolage Grotesque', Geist, sans-serif" }}>
            Pitch Studio
          </h2>
          <span style={{ fontSize: 14, color: "#9AA1AB" }}>
            Tell it where you&apos;re posting and who you&apos;re talking to. It writes a fresh message with your link and the disclosure built in.
          </span>
        </span>
        {meta ? (
          <span style={{ fontSize: 12, color: "#7D848E" }}>{meta.left} drafts left today</span>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
        <label style={label}>
          Where you&apos;ll post it
          <select value={channel} onChange={(e) => setChannel(e.target.value)} style={field}>
            {CHANNELS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label style={label}>
          Who it&apos;s for
          <select value={audience} onChange={(e) => setAudience(e.target.value)} style={field}>
            {AUDIENCES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <div style={label}>
          Tone
          <div role="radiogroup" aria-label="Tone" style={{ display: "flex", gap: 6 }}>
            {TONES.map(([v, l]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={tone === v}
                onClick={() => setTone(v)}
                style={{
                  flex: 1,
                  minHeight: 42,
                  borderRadius: 11,
                  border: `1px solid ${tone === v ? "#4DA3FF" : "#262A31"}`,
                  background: tone === v ? "rgba(77,163,255,.12)" : "#0A0B0D",
                  color: tone === v ? "#F2F4F5" : "#9AA1AB",
                  fontSize: 14,
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
      <label style={label}>
        Anything to stress? (optional)
        <input
          type="text"
          maxLength={300}
          value={angle}
          onChange={(e) => setAngle(e.target.value)}
          placeholder="e.g. I build sites for dentists; it saves me hours of SEO work"
          style={field}
        />
      </label>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          onClick={write}
          disabled={busy || !handle}
          style={{
            minHeight: 46,
            padding: "0 20px",
            borderRadius: 12,
            border: 0,
            background: "#4DA3FF",
            color: "#0A0B0D",
            fontSize: 15,
            fontWeight: 700,
            boxShadow: "0 0 22px rgba(77,163,255,.35)",
            opacity: busy ? 0.75 : 1,
          }}
        >
          {busy ? "Writing…" : draft ? "✦ Write another version" : "✦ Write my pitch"}
        </button>
        <span style={{ fontSize: 12, color: "#7D848E" }}>Never promises rankings. Edit anything before you post.</span>
      </div>

      {err ? (
        <p role="alert" style={{ margin: 0, fontSize: 14, color: "#FF5A4E" }}>
          {err}
        </p>
      ) : null}

      {draft ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", fontSize: 12 }}>
            <span
              style={{
                padding: "3px 8px",
                borderRadius: 6,
                fontFamily: "'Geist Mono', monospace",
                color: meta?.source === "ai" ? "#4DA3FF" : "#D5F879",
                background: meta?.source === "ai" ? "rgba(77,163,255,.12)" : "rgba(213,248,121,.1)",
              }}
            >
              {meta?.source === "ai" ? "WRITTEN BY AI" : "FROM OUR TEMPLATES"}
            </span>
            <span style={{ color: hasLink ? "#3DDC84" : "#FFC53D" }}>{hasLink ? "✓ Your link" : "Add your link"}</span>
            <span style={{ color: hasDisclosure ? "#3DDC84" : "#FFC53D" }}>{hasDisclosure ? "✓ Disclosure" : "Add a disclosure"}</span>
            <span style={{ color: "#7D848E" }}>{draft.length} characters</span>
          </span>
          {meta?.source !== "ai" ? (
            <span style={{ fontSize: 12, color: "#7D848E" }}>AI writing isn&apos;t switched on for this server yet, so this one was built from our templates.</span>
          ) : null}
          <textarea
            aria-label="Your draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={Math.min(14, Math.max(5, draft.split("\n").length + 2))}
            style={{ ...field, minHeight: 140, padding: 12, lineHeight: 1.55, resize: "vertical" }}
          />
          <button
            type="button"
            onClick={copy}
            style={{ alignSelf: "flex-start", minHeight: 40, padding: "0 14px", borderRadius: 11, border: 0, background: copied ? "#3DDC84" : "#D5F879", color: "#0A0B0D", fontSize: 14, fontWeight: 600 }}
          >
            {copied ? "Copied" : "Copy draft"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
