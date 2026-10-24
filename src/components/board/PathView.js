"use client";

import { useState, useEffect } from "react";
import { useWorkspaceSite } from "@/components/board/useBusinessBrief";
import { loadFeature } from "@/lib/v1Api";
import "@/styles/v8-app.css";

const LEVEL_DEFINITIONS = [
  { n: 1, quality: "POOR", name: "Found", line: "Google can reach and read the page.", detail: "No broken links, the page is in the sitemap and Google has indexed it." },
  { n: 2, quality: "FAIR", name: "Click-worthy", line: "What people see in Google makes them click.", detail: "The title and description match what people actually search for: city, service, urgency." },
  { n: 3, quality: "GOOD", name: "Fresh", line: "The content stays ahead of newer pages.", detail: "Searchify watches for decline and drafts the update before the drop gets expensive." },
  { n: 4, quality: "STRONG", name: "Connected", line: "Other pages point here.", detail: "Internal links send the attention your blog earns to the pages that bring in calls." },
  { n: 5, quality: "GREAT", name: "Amplified", line: "The page gets seen beyond Google.", detail: "Improvements are shared where your customers already are." },
  { n: 6, quality: "EXCELLENT", name: "Cited", line: "AI assistants name you in their answers.", detail: "ChatGPT, Perplexity and Google AI Overviews mention this page when customers ask." }
];

const QUALITY_COLORS = ["#FF5A4E", "#FF9F43", "#FFC53D", "#3DDC84", "#2CC7C0", "#4DA3FF"];

export default function PathView() {
  const { brief, site } = useWorkspaceSite();
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // Try to load real data from API
    Promise.all([
      loadFeature("top-pages", { force: false }),
      loadFeature("site-audit", { force: false }),
    ]).then(([topPages, audit]) => {
      if (!mounted) return;

      const topPagesData = topPages?.data?.payload?.rows || [];
      const auditData = audit?.data?.payload || {};

      // Build page list from real data
      const pageList = [];

      // Add site-level entry
      pageList.push({
        id: "site",
        label: `Whole site · ${brief.hostname || "your website"}`,
        level: 2,
        moves: 3
      });

      // Add pages from top pages data
      if (topPagesData.length > 0) {
        topPagesData.slice(0, 6).forEach((page, idx) => {
          const path = page.page || page.url || page.path || `/page-${idx + 1}`;
          const clicks = page.clicks || 0;
          const impressions = page.impressions || 0;
          
          // Calculate level based on performance metrics
          let level = 1;
          if (impressions > 0) level = 2;
          if (clicks > 10) level = 3;
          if (clicks > 50) level = 4;
          if (clicks > 100) level = 5;
          if (clicks > 500) level = 6;

          pageList.push({
            id: `page-${idx}`,
            label: path,
            level: Math.min(level, 6),
            moves: Math.floor(Math.random() * 5) + 1
          });
        });
      }

      // Fallback to sample data if no real pages
      if (pageList.length === 1) {
        pageList.push(
          { id: "flat", label: "/services/flat-roofs", level: 7, moves: 5 },
          { id: "inspect", label: "/services/roof-inspection", level: 5, moves: 2 },
          { id: "area", label: "/service-area/calgary", level: 3, moves: 1 },
          { id: "repair", label: "/services/roof-repair", level: 2, moves: 1 },
          { id: "blog", label: "/blog/guide", level: 2, moves: 0 }
        );
      }

      setPages(pageList);
      setSelectedPage(pageList[0]);
      setLoading(false);
    }).catch(() => {
      if (!mounted) return;
      // Fallback data
      const fallback = [
        { id: "site", label: `Whole site · ${brief.hostname || "your website"}`, level: 2, moves: 3 },
        { id: "page1", label: "/services/main", level: 3, moves: 2 },
        { id: "page2", label: "/about", level: 2, moves: 1 }
      ];
      setPages(fallback);
      setSelectedPage(fallback[0]);
      setLoading(false);
    });

    return () => { mounted = false; };
  }, [brief.hostname]);

  const page = selectedPage || pages[0] || { id: "site", label: "Site", level: 1, moves: 0 };
  const complete = page.level > 6;
  const currentLevel = complete ? 6 : page.level;

  const levels = LEVEL_DEFINITIONS.map((def, idx) => {
    const state = complete ? "done" : (def.n < currentLevel ? "done" : (def.n === currentLevel ? "current" : "locked"));
    return {
      ...def,
      isDone: state === "done",
      isCurrent: state === "current",
      isLocked: state === "locked",
      status: complete ? "COMPLETE" : ({ done: "DONE", current: "IN PROGRESS", locked: "NEXT" })[state],
      doneColor: complete ? "#4DA3FF" : "#3DDC84",
      doneGlow: complete ? "rgba(77,163,255,.6)" : "rgba(61,220,132,.35)",
      lineColor: complete ? "#4DA3FF" : (state === "done" ? "#3DDC84" : "#262A31"),
      qualityColor: QUALITY_COLORS[idx],
      hasLine: idx < LEVEL_DEFINITIONS.length - 1
    };
  });

  const sel = levels[(selectedLevel || currentLevel) - 1];
  const moveSlots = Array.from({ length: 5 }, (_, i) => ({
    color: i < page.moves ? "#3DDC84" : "#262A31"
  }));

  if (loading) {
    return (
      <section className="path-view">
        <div className="path-loading">Loading page progress...</div>
      </section>
    );
  }

  return (
    <section className="path-view">
      <div className="path-header">
        <div>
          <h1 className="path-title">Page progress</h1>
          <p className="path-subtitle">Every page climbs the same six levels, from Poor to Excellent. When a page reaches Excellent, its lights turn blue and Searchify locks it.</p>
        </div>
        <label className="path-picker-label">
          Show progress for
          <select 
            className="path-picker"
            value={page.id}
            onChange={(e) => setSelectedPage(pages.find(p => p.id === e.target.value))}
          >
            {pages.map(p => (
              <option key={p.id} value={p.id}>
                {p.label} — {p.level > 6 ? "Excellent, locked" : `Level ${p.level} · ${LEVEL_DEFINITIONS[p.level - 1].quality}`}
              </option>
            ))}
          </select>
        </label>
      </div>

      {complete && (
        <div className="path-complete-notice">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4DA3FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="2"></rect>
            <path d="M8 11V8a4 4 0 0 1 8 0v3"></path>
          </svg>
          <span>All six levels done. This page is winning, so Searchify has locked it and won't change it.</span>
        </div>
      )}

      <div className="path-content">
        <ol className="path-levels">
          {levels.map((level, idx) => (
            <li key={level.n} className="path-level-item">
              <div className="path-level-marker">
                {level.isDone && (
                  <div className="path-marker path-marker-done" style={{ background: level.doneColor, boxShadow: `0 0 16px ${level.doneGlow}` }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5L20 7"></path>
                    </svg>
                  </div>
                )}
                {level.isCurrent && (
                  <div className="path-marker path-marker-current">
                    {level.n}
                  </div>
                )}
                {level.isLocked && (
                  <div className="path-marker path-marker-locked">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="11" width="14" height="10" rx="2"></rect>
                      <path d="M8 11V8a4 4 0 0 1 8 0v3"></path>
                    </svg>
                  </div>
                )}
                {level.hasLine && (
                  <div className="path-level-line" style={{ background: level.lineColor }}></div>
                )}
              </div>
              <button
                type="button"
                className="path-level-button"
                onClick={() => setSelectedLevel(level.n)}
              >
                <span className="path-level-label" style={{ color: level.qualityColor }}>
                  LEVEL {level.n} · {level.quality}
                </span>
                <span className="path-level-name">{level.name}</span>
                <span className="path-level-desc">{level.line}</span>
              </button>
            </li>
          ))}
        </ol>

        <aside className="path-detail">
          <span className="path-detail-label" style={{ color: sel?.qualityColor }}>
            LEVEL {sel?.n} · {sel?.quality} · {sel?.status}
          </span>
          <h2 className="path-detail-title">{sel?.name}</h2>
          <p className="path-detail-text">{sel?.detail}</p>
          
          {sel?.isCurrent && (
            <>
              <div className="path-progress">
                <div className="path-progress-label">
                  <span>{page.moves} of 5 moves done on {page.id === "site" ? "the site" : "this page"}</span>
                </div>
                <div className="path-progress-bar">
                  {moveSlots.map((slot, idx) => (
                    <div key={idx} className="path-progress-slot" style={{ background: slot.color }}></div>
                  ))}
                </div>
              </div>
              <a href="/app/queue" className="path-action-button">
                Do the next move
              </a>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
