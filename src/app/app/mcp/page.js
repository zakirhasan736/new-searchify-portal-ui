"use client";

import { useMemo, useState } from "react";
import { activeSiteContext } from "@/lib/siteContext";
import { loadJourney } from "@/lib/journey";

const AIS = [
  { id: "claude", letter: "C", name: "Claude" },
  { id: "chatgpt", letter: "G", name: "ChatGPT" },
  { id: "gemini", letter: "M", name: "Gemini" },
];

const ASKS = [
  { tag: "Find", text: "Which pages are costing me visitors?" },
  { tag: "Fix", text: "Draft a better title for my weakest page." },
  { tag: "Report", text: "What changed in the last 4 weeks?" },
  { tag: "Fix", text: "Show me the red lights, then wait for my OK." },
];

export default function McpPage() {
  const host = activeSiteContext(loadJourney()).hostname || "your-site";
  const address = `https://mcp.searchify.io/${host.replace(/[^a-z0-9.-]+/gi, "")}`;
  const [ai, setAi] = useState("claude");
  const [copied, setCopied] = useState(false);
  const [asked, setAsked] = useState(false);
  const [note, setNote] = useState("");
  const [mode, setMode] = useState("ask");
  const picked = useMemo(() => AIS.find((item) => item.id === ai) || AIS[0], [ai]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", display: "flex", flexDirection: "column", gap: 22, padding: "8px 0 48px", color: "#F2F4F5" }}>
      <div style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid rgba(255,197,61,.45)", background: "rgba(255,197,61,.08)", fontSize: 14, lineHeight: 1.5 }}>
        This is a preview. MCP is not connected yet, so nothing here can change your website.
      </div>
      <div>
        <h1 style={{ margin: "0 0 8px", fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: "clamp(36px, 5vw, 56px)", letterSpacing: "-1.5px", lineHeight: 0.98 }}>
          Run Searchify from your AI.
        </h1>
        <p style={{ margin: 0, color: "#9AA1AB", fontSize: 16, lineHeight: 1.5 }}>
          Claude, ChatGPT or Gemini can read the scan, draft a fix, and wait for you before it publishes.
        </p>
      </div>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>1. Connect your AI</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {AIS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setAi(item.id)}
              aria-pressed={ai === item.id}
              style={{
                minHeight: 64,
                minWidth: 140,
                borderRadius: 16,
                border: ai === item.id ? "1px solid #4DA3FF" : "1px solid #262A31",
                background: ai === item.id ? "rgba(77,163,255,.12)" : "#101215",
                color: "#F2F4F5",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0 14px",
              }}
            >
              <span style={{ width: 32, height: 32, borderRadius: 10, background: "#1A1D22", display: "grid", placeItems: "center", fontWeight: 700 }}>{item.letter}</span>
              {item.name}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <code style={{ flex: "1 1 240px", padding: "12px 14px", borderRadius: 12, background: "#101215", border: "1px solid #262A31", color: "#D7DADE" }}>{address}</code>
          <button type="button" onClick={copy} style={{ minHeight: 46, padding: "0 16px", borderRadius: 12, border: 0, background: "#4DA3FF", color: "#0A0B0D", fontWeight: 600 }}>
            {copied ? "Copied" : "Copy address"}
          </button>
        </div>
        <ol style={{ margin: 0, paddingLeft: 18, color: "#D7DADE", lineHeight: 1.6 }}>
          <li>Open {picked.name} and add a custom connector.</li>
          <li>Paste the Searchify address.</li>
          <li>Leave publishing on “ask me first”.</li>
        </ol>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>2. Ask it something</h2>
        {ASKS.map((item) => (
          <button
            key={item.text}
            type="button"
            onClick={() => {
              setAsked(true);
              setNote(item.text);
            }}
            style={{ textAlign: "left", padding: "12px 14px", borderRadius: 14, border: "1px solid #262A31", background: "#101215", color: "#F2F4F5" }}
          >
            <span style={{ display: "block", fontSize: 11, color: "#4DA3FF", marginBottom: 4 }}>{item.tag}</span>
            {item.text}
          </button>
        ))}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>3. Watch it work</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => setMode("ask")} aria-pressed={mode === "ask"} style={{ minHeight: 40, padding: "0 14px", borderRadius: 999, border: mode === "ask" ? "1px solid #FFC53D" : "1px solid #262A31", background: "transparent", color: "#F2F4F5" }}>Ask me before publishing</button>
          <button type="button" onClick={() => setMode("small")} aria-pressed={mode === "small"} style={{ minHeight: 40, padding: "0 14px", borderRadius: 999, border: mode === "small" ? "1px solid #4DA3FF" : "1px solid #262A31", background: "transparent", color: "#F2F4F5" }}>Small fixes on their own</button>
        </div>
        <p style={{ margin: 0, color: "#9AA1AB", fontSize: 14, lineHeight: 1.5 }}>
          {mode === "ask"
            ? "Publishing waits for a yes from you, here or in the AI."
            : "Only hidden fixes can go out on their own: descriptions, image text and links. A visible page change still waits for you."}
        </p>
        {asked ? (
          <div style={{ padding: 14, borderRadius: 14, background: "rgba(255,197,61,.08)", border: "1px solid rgba(255,197,61,.45)" }}>
            Needs your OK before “{note}” can publish anything. Yes, publish it is not live in this preview.
          </div>
        ) : (
          <p style={{ margin: 0, color: "#7D848E", fontSize: 14 }}>Pick a request above to see where the approval step will sit.</p>
        )}
        <button
          type="button"
          onClick={() => setNote("We'll email you when MCP can connect to this workspace.")}
          style={{ alignSelf: "flex-start", minHeight: 48, padding: "0 18px", borderRadius: 14, border: 0, background: "#4DA3FF", color: "#0A0B0D", fontWeight: 600 }}
        >
          Tell me when it&apos;s ready
        </button>
        {note.startsWith("We'll email") ? <span style={{ color: "#3DDC84", fontSize: 14 }}>{note}</span> : null}
      </section>
    </div>
  );
}
