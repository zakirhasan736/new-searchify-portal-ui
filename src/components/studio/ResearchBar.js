"use client";

import { useEffect, useMemo, useState } from "react";

const RECENT_KEY = "searchify-recent-searches";
const SUGGESTED = ["searchify seo", "site audit", "keyword gap", "rank tracker", "backlink tool", "content brief", "amazon.com", "walmart.com"];

export default function ResearchBar({ kind, mode: modeProp, onPick }) {
  const [open, setOpen] = useState(false);
  const defaultMode = modeProp || (kind.includes("keyword") || kind.includes("organic") || kind.includes("position") || kind.includes("prompt") || kind.includes("map") ? "keyword" : "domain");
  const [mode, setMode] = useState(defaultMode);
  const [text, setText] = useState("");
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"));
    } catch {
      setRecent([]);
    }
  }, []);

  const hits = useMemo(() => {
    const needle = text.trim().toLowerCase();
    const pool = [...recent, ...SUGGESTED.filter((item) => !recent.includes(item))];
    if (!needle) return pool.slice(0, 8);
    return pool.filter((item) => item.toLowerCase().includes(needle)).slice(0, 8);
  }, [text, recent]);

  const choose = (value) => {
    const next = [value, ...recent.filter((item) => item !== value)].slice(0, 8);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    setText(value);
    setOpen(false);
    onPick?.(value, mode);
  };

  return (
    <div className="relative mt-5">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-line bg-panel p-2 sm:flex-nowrap">
        <div className="flex rounded-xl bg-white/5 p-1">
          {["keyword", "domain"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`rounded-lg px-3 py-2 text-sm capitalize ${mode === item ? "bg-brand text-white" : "text-white/65"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <input
            value={text}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setText(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && text.trim()) {
                event.preventDefault();
                choose(text.trim());
              }
            }}
            placeholder={mode === "keyword" ? "Search for a keyword or keyword list" : "Enter a domain, subdomain, or URL"}
            className="h-11 w-full rounded-xl border border-line bg-ink px-4 text-sm outline-none"
          />
          {open ? (
            <div className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl" onMouseDown={(event) => event.preventDefault()}>
              <div className="flex border-b border-line">
                {["keyword", "domain"].map((item) => (
                  <button key={item} type="button" onClick={() => setMode(item)} className={`flex-1 px-3 py-2 text-sm capitalize ${mode === item ? "bg-brand/20 text-white" : "text-white/55"}`}>
                    {item === "keyword" ? "Keyword" : "Domain"}
                  </button>
                ))}
              </div>
              <ul className="studio-scroll max-h-72 overflow-y-auto">
                <li className="px-4 py-2 text-[11px] uppercase tracking-[0.12em] text-white/40">{text ? "Matches" : "Recent searches"}</li>
                {hits.map((item) => (
                  <li key={item}>
                    <button type="button" className="w-full px-4 py-3 text-left text-sm hover:bg-white/5" onClick={() => choose(item)}>
                      {item}
                    </button>
                  </li>
                ))}
                {!hits.length ? <li className="px-4 py-6 text-sm text-white/50">No matches. Press Enter to search this value.</li> : null}
              </ul>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => text.trim() && choose(text.trim())}
          className="h-11 shrink-0 rounded-full bg-gradient-to-r from-blush to-brand px-5 text-sm font-semibold"
        >
          Search
        </button>
      </div>
      {open ? <button type="button" aria-label="Close search" className="fixed inset-0 z-30" onClick={() => setOpen(false)} /> : null}
    </div>
  );
}
