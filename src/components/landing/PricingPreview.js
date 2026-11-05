"use client";

import { useEffect, useState } from "react";
import "@/styles/v8-pricing-preview.css";

const ICONS = {
  call: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  form: "M4 5h16v14H4z M4 7l8 6 8-6",
  rank: "M3 17l6-6 4 4 8-8 M14 7h7v7",
  fix: "M20 6L9 17l-5-5",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z",
  report: "M14 2H6v20h12V6z M14 2v4h4 M8 13h8 M8 17h5",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8z",
};

const COLORS = {
  call: "#3DDC84",
  form: "#3DDC84",
  fix: "#3DDC84",
  rank: "#4DA3FF",
  eye: "#4DA3FF",
  chat: "#4DA3FF",
  report: "#FFC53D",
  user: "#F2F4F5",
};

const SCENES = {
  solo: {
    who: "Example: a local roofer, 1 website",
    lead: "One website, one owner. Here is what a good first 90 days can look like.",
    stats: [
      { label: "Calls from Google", sub: "extra a month by day 90", n: 9, pre: "+", color: "#3DDC84" },
      { label: "Quote requests", sub: "from your website form", n: 6, pre: "+", color: "#3DDC84" },
      { label: "Visitors from Google", sub: "extra a month", n: 410, pre: "+", color: "#4DA3FF" },
    ],
    pops: [
      [1, "fix", "4 urgent fixes published", "Live on your website. You approved each one.", "DAY 3"],
      [3, "rank", "Moved up on Google", "“roof repair calgary” went from #11 to #7", "DAY 26"],
      [5, "eye", "More people are finding you", "+146 visitors from Google this month", "DAY 34"],
      [7, "call", "New call from Google", "Someone searched “emergency roof leak” and called", "DAY 41"],
      [9, "form", "New quote request", "“Can you look at our shingles this week?”", "DAY 52"],
      [11, "report", "Your 90-day report is ready", "Before and after, in plain words", "DAY 90"],
    ],
  },
  pro: {
    who: "Example: a home services company, 5 websites",
    lead: "More websites, more ways in. Searchify handles the small fixes and tells you where the calls come from.",
    stats: [
      { label: "Calls from Google", sub: "extra a month, all sites", n: 27, pre: "+", color: "#3DDC84" },
      { label: "Quote requests", sub: "from your website forms", n: 18, pre: "+", color: "#3DDC84" },
      { label: "Visitors from Google", sub: "extra a month, all sites", n: 1240, pre: "+", color: "#4DA3FF" },
    ],
    pops: [
      [1, "fix", "Autopilot handled 6 small fixes", "Image text and broken links. All undoable.", "DAY 2"],
      [3, "rank", "Your second location is on page one", "“roofer airdrie” is now #6 on Google", "DAY 29"],
      [5, "chat", "ChatGPT mentioned you", "Asked for the best roofer in Calgary, it named your business", "DAY 38"],
      [7, "call", "3 new calls this week", "All from people who found you on Google", "DAY 46"],
      [9, "form", "New quote request on the shop site", "“Do you install gutter guards?”", "DAY 58"],
      [11, "report", "Your monthly report went out", "Monday 9:00, automatically", "DAY 63"],
    ],
  },
  agency: {
    who: "Example: a small agency, 18 client websites",
    lead: "Every client in one place. Wins you can show, problems caught early, reports that send themselves.",
    stats: [
      { label: "Extra leads for your clients", sub: "calls and forms, all clients", n: 212, pre: "+", color: "#3DDC84" },
      { label: "Clients improving", sub: "on your roster", n: 14, post: " of 18", color: "#3DDC84" },
      { label: "Hours saved on reports", sub: "a month", n: 31, color: "#4DA3FF" },
    ],
    pops: [
      [1, "fix", "9 fixes approved across 4 clients", "One review, done in 6 minutes", "DAY 4"],
      [3, "rank", "Northgate Roofing dropped overnight", "Fixed and back up before the client noticed", "DAY 17"],
      [5, "report", "18 reports sent under your logo", "No Searchify name anywhere", "DAY 31"],
      [7, "form", "Harbour Physio: +22 booking requests", "Their best month this year", "DAY 44"],
      [9, "chat", "A client replied to your report", "“Phones are busier this month. Thank you!”", "DAY 47"],
      [11, "rank", "Bloom Florists is on page one", "“wedding flowers calgary” is now #4", "DAY 70"],
    ],
  },
  managed: {
    who: "Example: a busy contractor who never logs in",
    lead: "You run your business. Our team runs Searchify for you, from setup to monthly report.",
    isManaged: true,
    you: ["A 20-minute kickoff call", "Read one short email a month"],
    us: ["Connect your website and Google", "Find, write and publish every fix", "Watch Google and react to drops", "Report what changed, in plain words"],
    stats: [
      { label: "Time you spent on it", sub: "one kickoff call, then reading emails", n: 45, post: " min", color: "#F2F4F5" },
      { label: "Fixes done for you", sub: "found, written and published by us", n: 38, color: "#4DA3FF" },
      { label: "Calls from Google", sub: "extra a month by day 90", n: 31, pre: "+", color: "#3DDC84" },
    ],
    pops: [
      [1, "user", "Meet your strategist", "Sovereign Standard booked a 20-minute kickoff call", "DAY 1"],
      [3, "fix", "We connected everything for you", "Search Console, Analytics and WordPress", "DAY 2"],
      [5, "fix", "12 fixes published this week", "Nothing for you to approve", "DAY 9"],
      [7, "rank", "Moved up on Google", "“roofing contractor calgary” went from #14 to #6", "DAY 33"],
      [9, "call", "Your phone is ringing more", "+11 calls from Google this month", "DAY 45"],
      [11, "report", "Your monthly update is in your inbox", "2 minutes to read. Reply with any questions.", "DAY 60"],
    ],
  },
};

const TABS = [
  ["solo", "Solo"],
  ["pro", "Pro"],
  ["agency", "Agency"],
  ["managed", "Managed"],
];

function shown(stat, tick) {
  const eased = 1 - (1 - Math.min(1, tick / 11)) ** 2;
  return `${stat.pre || ""}${Math.round(stat.n * eased).toLocaleString("en-US")}${stat.post || ""}`;
}

export default function PricingPreview({ planId = "pro", planName = "Pro", onPickPlan, onChoosePlan }) {
  const [tab, setTab] = useState(planId === "managed" ? "managed" : planId || "pro");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (planId && planId !== "managed") setTab(planId);
  }, [planId]);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => (n > 17 ? 0 : n + 1)), 1000);
    return () => clearInterval(id);
  }, [tab]);

  const scene = SCENES[tab] || SCENES.pro;
  const progress = Math.min(1, tick / 11);
  const pops = scene.pops.filter((row) => row[0] <= tick);

  const choose = (id) => {
    setTab(id);
    setTick(0);
    if (id !== "managed") onPickPlan?.(id);
  };

  return (
    <section id="preview" aria-label="Plan preview" className="v8-pv">
      <div className="v8-pv-inner">
        <div className="v8-pv-head">
          <p className="v8-pv-kicker">WHAT YOU COULD SEE</p>
          <h2>
            {tab === "managed" ? "Hands off with" : "What could change on"}{" "}
            <span className="v8-pv-script">{tab === "managed" ? "Managed" : planName}</span>
          </h2>
          <p className="v8-pv-lead">{scene.lead}</p>
          <div role="group" aria-label="Preview a plan" className="v8-pv-tabs">
            {TABS.map(([id, name]) => (
              <button key={id} type="button" aria-pressed={tab === id} className={`v8-pv-tab${tab === id ? " is-on" : ""}${id === "managed" && tab === id ? " is-managed" : ""}`} onClick={() => choose(id)}>
                {name}
              </button>
            ))}
          </div>
        </div>
        <div className="v8-pv-grid">
          <div className="v8-pv-phone">
            <div className="v8-pv-phone-top">
              <span>{scene.who}</span>
              <span className="v8-pv-day">DAY {Math.max(1, Math.round(90 * progress))} OF 90</span>
            </div>
            <div className="v8-pv-track"><div style={{ width: `${Math.round(progress * 100)}%` }} /></div>
            <div className="v8-pv-pops" aria-live="polite">
              {pops.map((row) => {
                const color = COLORS[row[1]];
                return (
                  <div key={row[2]} className="v8-pv-pop sf-note">
                    <span className="v8-pv-icon sf-ring" style={{ "--c": `${color}80`, background: `${color}24`, color }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[row[1]]} /></svg>
                    </span>
                    <span>
                      <span className="v8-pv-when">SEARCHIFY · {row[4]}</span>
                      <strong>{row[2]}</strong>
                      <span className="v8-pv-sub">{row[3]}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="v8-pv-side">
            {scene.stats.map((stat) => (
              <div key={stat.label} className="v8-pv-stat">
                <span className="v8-pv-dot" style={{ background: stat.color, boxShadow: `0 0 12px ${stat.color}` }} />
                <span>
                  <strong>{stat.label}</strong>
                  <span>{stat.sub}</span>
                </span>
                <b style={{ color: stat.color }}>{shown(stat, tick)}</b>
              </div>
            ))}
            {scene.isManaged ? (
              <div className="v8-pv-parts">
                <div className="v8-pv-you">
                  <span>YOUR PART</span>
                  {scene.you.map((line) => <p key={line}>{line}</p>)}
                </div>
                <div className="v8-pv-us">
                  <span>OUR PART</span>
                  {scene.us.map((line) => (
                    <p key={line}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="v8-pv-actions">
              {scene.isManaged ? (
                <a className="v8-pv-cta is-green" href="https://sovereignstandard.ca" target="_blank" rel="noreferrer">Talk to Sovereign Standard</a>
              ) : (
                <button type="button" className="v8-pv-cta" onClick={() => onChoosePlan?.(tab)}>Choose {planName}</button>
              )}
              <button type="button" className="v8-pv-replay" onClick={() => setTick(0)}>Play it again</button>
            </div>
            <p className="v8-pv-note">An illustrative example of a typical local business, not a promise. Every website is different, and results build over months.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
