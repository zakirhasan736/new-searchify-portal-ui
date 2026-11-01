"use client";

import { useEffect, useState } from "react";
import InvestorShell, { useInvestorCtx } from "@/components/investors/InvestorShell";
import { getInvestorPlaybook } from "@/lib/investorApi";
import SearchifyMarkSvg from "@/components/v8/SearchifyMarkSvg";
import FounderSignature from "@/components/v8/FounderSignature";

const TOC = [
  ["#shift", "The big shift"],
  ["#plain", "In plain English"],
  ["#who", "Who it’s for"],
  ["#pitch", "Elevator pitch"],
  ["#loud", "Shout it out"],
  ["#rules", "Do’s and don’ts"],
  ["#invest", "If someone wants in"],
  ["#learn", "Videos to watch"],
];

const PLATFORMS = [
  { name: "WordPress", pct: "43.3%", status: "Works today", statusColor: "#3DDC84", color: "#9FE7F5", bold: true },
  { name: "Shopify", pct: "4.4%", status: "On our list", statusColor: "#9AA1AB", color: "#4DA3FF" },
  { name: "Wix", pct: "2.7%", status: "On our list", statusColor: "#9AA1AB", color: "#C9B8FF" },
  { name: "Squarespace", pct: "2.1%", status: "On our list", statusColor: "#9AA1AB", color: "#FFC53D" },
  { name: "Joomla", pct: "1.7%", status: "", statusColor: "#9AA1AB", color: "#FF9F43" },
  { name: "Webflow", pct: "0.8%", status: "On our list", statusColor: "#9AA1AB", color: "#3DDC84" },
  { name: "Every other platform", pct: "14.0%", status: "", statusColor: "#9AA1AB", color: "#5B616B" },
  { name: "Custom-built, no platform", pct: "31.0%", status: "", statusColor: "#9AA1AB", color: "#2E333B" },
];

const PITCHES = [
  {
    title: "To a local business owner",
    body: "“It’s like a mechanic for your website’s Google health. It finds what’s wrong, fixes it with your OK, then checks whether the fix actually helped.”",
  },
  {
    title: "To an agency",
    body: "“One board for every client site. Your team approves the changes, Searchify ships them, and you get a report you can send to the client.”",
  },
  {
    title: "At a dinner",
    body: "“Most SEO tools just give you a score. Searchify actually makes the changes on WordPress, then proves whether they worked.”",
  },
];

const VIDEOS = [
  {
    tag: "PRICING AND POSITIONING",
    name: "Chris Do · The Futur",
    blurb: "How to explain the value of what you do, and why the right price follows from it.",
    href: "https://www.youtube.com/watch?v=b0fQyaBSSI0",
    link: "How I went from charging $500 to $100,000 for a logo · 36 min",
    more: "More at thefutur.com",
  },
  {
    tag: "SALES",
    name: "Alex Hormozi",
    blurb: "Plain-spoken lessons on selling, from someone who learned it the hard way.",
    href: "https://www.youtube.com/watch?v=v6zDEMQs2iI",
    link: "How I learned sales",
    more: "Then read: $100M Offers and $100M Leads",
  },
  {
    tag: "ATTENTION AND SOCIAL",
    name: "Gary Vaynerchuk",
    blurb: "Patience, self-awareness and showing up consistently, the traits behind his advice on content.",
    href: "https://www.youtube.com/watch?v=k0lw3YiniDc",
    link: "His VeeCon 2024 keynote on the 5 traits behind success",
    more: "Then read: Jab, Jab, Jab, Right Hook",
  },
  {
    tag: "CLEAR MESSAGING",
    name: "Donald Miller · StoryBrand",
    blurb: "Why people tune out, and how to make the customer the hero of the story.",
    href: "https://www.youtube.com/watch?v=QRHCoU04Pe0",
    link: "How to clarify your message so people listen · TEDx",
    more: "Then read: Building a StoryBrand",
  },
  {
    tag: "PITCHING",
    name: "Oren Klaff",
    blurb: "How to hold the attention of busy, sceptical people when you pitch.",
    href: "",
    link: "",
    more: "Read: Pitch Anything",
  },
  {
    tag: "MAKING IT STICK",
    name: "Chip and Dan Heath",
    blurb: "Why some ideas stick and others vanish: simple, concrete, and told as a story.",
    href: "",
    link: "",
    more: "Read: Made to Stick",
  },
];

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="4" />
      <path d="M10 9l5 3-5 3z" />
    </svg>
  );
}

function Caveat({ children, style }) {
  return (
    <span style={{ fontFamily: "Caveat, 'Bradley Hand', cursive", fontWeight: 700, color: "#9FE7F5", lineHeight: 1, ...style }}>
      {children}
    </span>
  );
}

function PlaybookBody() {
  const { me } = useInvestorCtx();
  const [pb, setPb] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getInvestorPlaybook().then((res) => {
      if (!cancelled && res.ok) setPb(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const first = pb?.letterName || me?.letterName || me?.firstName || "Nick";
  const greeting = pb?.greeting || me?.greeting || `Hey ${first},`;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Mrs+Saint+Delafield&display=swap"
        rel="stylesheet"
      />

      <div style={{ maxWidth: 1120, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <Caveat style={{ fontSize: "clamp(44px, 5vw, 60px)" }}>{greeting}</Caveat>
        <h1
          style={{
            margin: 0,
            fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
            fontSize: "clamp(32px, 3.8vw, 48px)",
            lineHeight: 1.06,
            letterSpacing: "-1.4px",
            fontWeight: 700,
          }}
        >
          Here&apos;s everything you need to talk about Searchify like you built it.
        </h1>
        <span style={{ fontSize: 16, color: "#D7DADE", lineHeight: 1.6, maxWidth: 760 }}>
          You believed in this early, so you&apos;re one of the best people to tell its story. This page walks you through what we do, who it&apos;s for, how to pitch it in thirty seconds, and the handful of things that are best left to me. Grab a coffee, it&apos;s a quick read.
        </span>
        <div role="list" aria-label="On this page" style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 6 }}>
          {TOC.map(([href, label]) => (
            <a
              key={href}
              role="listitem"
              href={href}
              style={{
                minHeight: 36,
                display: "inline-flex",
                alignItems: "center",
                padding: "0 12px",
                borderRadius: 999,
                border: "1px solid #262A31",
                color: "#D7DADE",
                textDecoration: "none",
                fontSize: 13,
              }}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      <section
        aria-labelledby="yay-h"
        style={{
          maxWidth: 860,
          width: "100%",
          boxSizing: "border-box",
          margin: "8px auto",
          borderRadius: 6,
          background: "#F6F1E6",
          color: "#2B2722",
          padding: "clamp(28px, 5vw, 56px) clamp(24px, 6vw, 72px)",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          boxShadow: "0 30px 70px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.04)",
          transform: "rotate(-0.4deg)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", paddingBottom: 14, borderBottom: "1px solid #DDD3C0" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SearchifyMarkSvg size={24} />
            <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: "-0.3px" }}>searchify</span>
          </span>
          <span style={{ fontSize: 13, color: "#6B6358" }}>Calgary, Alberta · October 2026</span>
        </div>
        <h2 id="yay-h" style={{ margin: "6px 0 0", fontFamily: "Caveat, 'Bradley Hand', cursive", fontSize: "clamp(40px, 5vw, 58px)", lineHeight: 1.05, fontWeight: 700, color: "#1F3A5F" }}>
          Congratulations. You&apos;re an investor in a real, working product.
        </h2>
        <span style={{ fontSize: 17, lineHeight: 1.75 }}>{first},</span>
        <span style={{ fontSize: 17, lineHeight: 1.75 }}>
          Not an idea on a napkin. Not a pitch deck. Searchify is live, fully operational, and fixing real websites right now. You backed it when it was only a plan, and it&apos;s here because of you. Be proud of that. I am.
        </span>
        <span style={{ fontSize: 17, lineHeight: 1.75 }}>
          It&apos;s yours to use, too. Got a side project, a friend&apos;s business, or a site of your own? Plug it in and see what it finds. Nothing makes you a better ambassador than having used it yourself.
        </span>
        <span style={{ fontSize: 17, lineHeight: 1.75 }}>Thank you for believing in this early. The best part is still ahead of us.</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, paddingTop: 6 }}>
          <span style={{ fontSize: 17, lineHeight: 1.75 }}>Proud to build this with you,</span>
          <FounderSignature />
        </div>
        <span style={{ fontFamily: "Caveat, 'Bradley Hand', cursive", fontSize: 28, lineHeight: 1.3, color: "#1F3A5F", paddingTop: 10 }}>
          P.S. Save one of those cigars for me, I’ve never smoked one in my life.
        </span>
      </section>

      <section
        id="shift"
        aria-labelledby="shift-h"
        style={{
          maxWidth: 1120,
          width: "100%",
          boxSizing: "border-box",
          margin: "0 auto",
          borderRadius: 24,
          background: "#101215",
          border: "1px solid rgba(159,231,245,.35)",
          padding: "clamp(20px, 3vw, 28px)",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Caveat style={{ fontSize: "clamp(40px, 4.4vw, 54px)", marginTop: 18 }}>The big shift</Caveat>
          <h2 id="shift-h" style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 30, letterSpacing: "-0.8px", fontWeight: 700 }}>
            We&apos;re a product now, not a service.
          </h2>
          <span style={{ fontSize: 15, color: "#D7DADE", lineHeight: 1.6, maxWidth: 820 }}>
            For years, SEO meant me sitting with one client at a time. It was tedious work, but it only grew as fast as my calendar and my capacity. Searchify takes everything SEO and packages it into software. The same product can serve one customer or ten thousand, and that changes our whole game, and entire strategy. Scaling can take place here.
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "stretch" }}>
          <div style={{ flex: "1 1 300px", minWidth: 0, borderRadius: 18, background: "#0A0B0D", border: "1px solid #1A1D22", padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 13, color: "#9AA1AB" }}>Before · a service</span>
            <span style={{ fontSize: 14, lineHeight: 1.5, color: "#D7DADE" }}>One client at a time, billed by the hour.</span>
            <span style={{ fontSize: 14, lineHeight: 1.5, color: "#D7DADE" }}>Growth capped by how many hours I have.</span>
            <span style={{ fontSize: 14, lineHeight: 1.5, color: "#D7DADE" }}>Every new client meant more of my time.</span>
          </div>
          <div aria-hidden="true" style={{ flex: "0 0 auto", display: "grid", placeItems: "center", color: "#9FE7F5", fontSize: 28, padding: "0 4px" }}>
            →
          </div>
          <div style={{ flex: "1 1 300px", minWidth: 0, borderRadius: 18, background: "rgba(159,231,245,.06)", border: "1px solid rgba(159,231,245,.4)", padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 13, color: "#9FE7F5" }}>Now · a product</span>
            <span style={{ fontSize: 14, lineHeight: 1.5 }}>The same software serves 1 customer or 10,000.</span>
            <span style={{ fontSize: 14, lineHeight: 1.5 }}>Customers sign up and pay on their own, any time of day.</span>
            <span style={{ fontSize: 14, lineHeight: 1.5 }}>Every dollar of marketing can bring in customers without adding staff.</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Which means we can finally advertise at scale:</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            {[
              ["Paid ads", "Google and Meta ads that send people straight to a free scan."],
              ["TikTok and Reels", "Short before-and-afters of real sites going from red to green."],
              ["YouTube", "Longer how-to videos that rank for years and keep bringing people in."],
              ["Content and partners", "Blog posts, agencies and affiliates who recommend us for a commission."],
            ].map(([t, d]) => (
              <div key={t} style={{ borderRadius: 14, background: "#0A0B0D", border: "1px solid #1A1D22", padding: 14, display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{t}</span>
                <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.45 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="plain" aria-labelledby="plain-h" style={{ maxWidth: 1120, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Caveat style={{ fontSize: "clamp(40px, 4.4vw, 54px)", marginTop: 18 }}>Searchify in plain English</Caveat>
          <h2 id="plain-h" style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 30, letterSpacing: "-0.8px", fontWeight: 700 }}>
            Think of it as a mechanic for your website&apos;s Google health.
          </h2>
          <span style={{ fontSize: 15, color: "#D7DADE", lineHeight: 1.6, maxWidth: 820 }}>
            It looks under the hood, tells you what&apos;s wrong in normal words, fixes it with your OK, and then checks whether the fix actually helped.
          </span>
        </div>
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
          {[
            ["1", "Plug in", "Connect your WordPress site and Google Search Console. Takes about a minute."],
            ["2", "Scan", "Searchify checks every page and colours it red, yellow, green or blue."],
            ["3", "Fix, with your OK", "It suggests one fix at a time. Tap approve and it makes the change for you."],
            ["4", "Prove it", "About 28 days later it shows whether the fix actually helped, good news or not."],
          ].map(([n, t, d]) => (
            <li key={n} style={{ borderRadius: 16, background: "#101215", border: "1px solid #1A1D22", padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, display: "grid", placeItems: "center", background: "#9FE7F5", color: "#0A0B0D", fontWeight: 700, fontSize: 14 }}>{n}</span>
              <span style={{ fontSize: 16, fontWeight: 600 }}>{t}</span>
              <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.5 }}>{d}</span>
            </li>
          ))}
        </ol>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "stretch" }}>
          <div style={{ flex: "1 1 380px", minWidth: 0, borderRadius: 18, background: "#101215", border: "1px solid rgba(61,220,132,.35)", padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#3DDC84" }}>What we promise</h3>
            {[
              "Nothing changes on your site without your OK, unless you choose to let small fixes run on their own.",
              "Every change is checked live after it ships, and can be undone in one click.",
              "You’ll see honest results for every change, the wins and the misses.",
              "Pages you lock are never touched.",
            ].map((t) => (
              <div key={t} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none", marginTop: 2 }}>
                  <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#3DDC84" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{t}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: "1 1 380px", minWidth: 0, borderRadius: 18, background: "#101215", border: "1px solid rgba(255,197,61,.35)", padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#FFC53D" }}>What nobody can honestly guarantee</h3>
            {[
              "A specific ranking, like #1 on Google. Google decides that, not us.",
              "An exact amount of traffic, calls or sales.",
              "How fast results show up. Some take weeks, some take months.",
              "Big wins on sites with deeper problems, like very slow hosting or very thin content.",
            ].map((t) => (
              <div key={t} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none", marginTop: 2 }}>
                  <path d="M12 7v6M12 17h.01" fill="none" stroke="#FFC53D" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
                <span>{t}</span>
              </div>
            ))}
            <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.5 }}>
              If anyone ever promises you page-one rankings, run. Being upfront about this is part of why people trust us.
            </span>
          </div>
        </div>
      </section>

      <section
        id="who"
        aria-labelledby="who-h"
        style={{
          maxWidth: 1120,
          width: "100%",
          boxSizing: "border-box",
          margin: "0 auto",
          borderRadius: 24,
          background: "#101215",
          border: "1px solid #1A1D22",
          padding: "clamp(20px, 3vw, 28px)",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Caveat style={{ fontSize: "clamp(40px, 4.4vw, 54px)", marginTop: 18 }}>Who it&apos;s for</Caveat>
          <h2 id="who-h" style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 30, letterSpacing: "-0.8px", fontWeight: 700 }}>
            Nearly half the internet runs on WordPress. That&apos;s where we started.
          </h2>
          <span style={{ fontSize: 15, color: "#D7DADE", lineHeight: 1.6, maxWidth: 820 }}>
            Every website is built on something. WordPress powers about 43% of all websites, more than every other platform combined. So when you meet a small business owner, odds are good their site is one Searchify can help today.
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "center" }}>
          <figure style={{ flex: "0 1 300px", margin: 0, display: "grid", placeItems: "center" }}>
            <svg viewBox="0 0 220 220" role="img" aria-label="Share of websites by platform" style={{ width: "100%", maxWidth: 280, height: "auto", transform: "rotate(-90deg)" }}>
              <circle cx="110" cy="110" r="80" fill="none" stroke="#16181C" strokeWidth="40" />
              <circle cx="110" cy="110" r="80" fill="none" stroke="#9FE7F5" strokeWidth="46" strokeDasharray="216.15 502.65" strokeDashoffset="0" />
              <circle cx="110" cy="110" r="80" fill="none" stroke="#4DA3FF" strokeWidth="40" strokeDasharray="20.62 502.65" strokeDashoffset="-217.65" />
              <circle cx="110" cy="110" r="80" fill="none" stroke="#C9B8FF" strokeWidth="40" strokeDasharray="12.07 502.65" strokeDashoffset="-239.77" />
              <circle cx="110" cy="110" r="80" fill="none" stroke="#FFC53D" strokeWidth="40" strokeDasharray="9.06 502.65" strokeDashoffset="-253.34" />
              <circle cx="110" cy="110" r="80" fill="none" stroke="#FF9F43" strokeWidth="40" strokeDasharray="7.05 502.65" strokeDashoffset="-263.89" />
              <circle cx="110" cy="110" r="80" fill="none" stroke="#3DDC84" strokeWidth="40" strokeDasharray="2.52 502.65" strokeDashoffset="-272.44" />
              <circle cx="110" cy="110" r="80" fill="none" stroke="#5B616B" strokeWidth="40" strokeDasharray="68.87 502.65" strokeDashoffset="-276.46" />
              <circle cx="110" cy="110" r="80" fill="none" stroke="#2E333B" strokeWidth="40" strokeDasharray="154.32 502.65" strokeDashoffset="-346.83" />
            </svg>
          </figure>
          <div style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {PLATFORMS.map((p) => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #16181C", fontSize: 14 }}>
                <span style={{ width: 12, height: 12, flex: "none", borderRadius: 3, background: p.color }} />
                <span style={{ flex: 1, fontWeight: p.bold ? 700 : 400 }}>{p.name}</span>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 13 }}>{p.pct}</span>
                <span style={{ width: 120, textAlign: "right", fontSize: 12, color: p.statusColor }}>{p.status}</span>
              </div>
            ))}
            <span style={{ fontSize: 12, color: "#7D848E", paddingTop: 6 }}>
              Share of all websites, from W3Techs (late 2025 to Oct 2026). “Custom-built” means no website platform at all.
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "stretch" }}>
          <div style={{ flex: "1 1 380px", minWidth: 0, borderRadius: 18, background: "#0A0B0D", border: "1px solid rgba(159,231,245,.35)", padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>What Searchify plugs into today</h3>
            {[
              ["WordPress", "Where the fixes actually get made, safely and reversibly."],
              ["Google Search Console", "Google’s own data on what people search and click."],
              ["Google Analytics", "Calls, leads and visits, on Pro and Agency plans."],
              ["Postiz", "Social posting for agencies, on the Agency plan."],
            ].map(([t, d]) => (
              <div key={t} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "6px 0", borderTop: "1px solid #16181C" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{t}</span>
                <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.45 }}>{d}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: "1 1 380px", minWidth: 0, borderRadius: 18, background: "#0A0B0D", border: "1px solid #1A1D22", padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>On our list next</h3>
            {[
              ["Shopify", "The biggest platform for online stores."],
              ["Wix and Squarespace", "Popular with small local businesses, and customers keep asking."],
              ["Webflow", "A favourite of design-focused agencies."],
            ].map(([t, d]) => (
              <div key={t} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "6px 0", borderTop: "1px solid #16181C" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{t}</span>
                <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.45 }}>{d}</span>
              </div>
            ))}
            <span style={{ fontSize: 12, color: "#7D848E", lineHeight: 1.5 }}>Please don&apos;t promise dates for these. When something ships, you&apos;ll hear about it here first.</span>
          </div>
        </div>
      </section>

      <section id="pitch" aria-labelledby="pitch-h" style={{ maxWidth: 1120, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Caveat style={{ fontSize: "clamp(40px, 4.4vw, 54px)", marginTop: 18 }}>The elevator pitch</Caveat>
          <h2 id="pitch-h" style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 30, letterSpacing: "-0.8px", fontWeight: 700 }}>
            Say it like you&apos;d say it to a friend.
          </h2>
          <span style={{ fontSize: 15, color: "#D7DADE", lineHeight: 1.6, maxWidth: 820 }}>
            No need to memorize these word for word. Use them as a starting point and make them yours.
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
          {PITCHES.map((p) => (
            <div key={p.title} style={{ borderRadius: 18, background: "#101215", border: "1px solid #1A1D22", padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 13, color: "#9FE7F5", fontFamily: "'Geist Mono', monospace" }}>{p.title.toUpperCase()}</span>
              <span style={{ fontSize: 15, lineHeight: 1.55, color: "#D7DADE" }}>{p.body}</span>
            </div>
          ))}
        </div>
      </section>

      <section
        id="loud"
        aria-labelledby="loud-h"
        style={{
          maxWidth: 1120,
          width: "100%",
          boxSizing: "border-box",
          margin: "0 auto",
          borderRadius: 24,
          background: "#101215",
          border: "1px solid rgba(159,231,245,.35)",
          padding: "clamp(20px, 3vw, 28px)",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Caveat style={{ fontSize: "clamp(40px, 4.4vw, 54px)", marginTop: 18 }}>Shout it from the rooftops</Caveat>
          <h2 id="loud-h" style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 30, letterSpacing: "-0.8px", fontWeight: 700 }}>
            Never be shy about it. Get in the game.
          </h2>
          <span style={{ fontSize: 15, color: "#D7DADE", lineHeight: 1.6, maxWidth: 820 }}>
            Nobody&apos;s asking you to become a content machine. Just don&apos;t ever hold back. Scroll any feed and you&apos;ll see people talking about their businesses day in and day out, because attention goes to whoever keeps showing up. We have something genuinely worth talking about, so talk about it, share it, and be proud of it.
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "stretch" }}>
          {[
            ["900", "#9FE7F5", "PIECES OF CONTENT · PER DAY", "pieces of content Gary Vaynerchuk's businesses publish every single day, across every platform."],
            ["100,000", "#FFC53D", "PIECES OF CONTENT · PER DAY", "His actual goal. Per day. And he says even 900 is nowhere near it."],
          ].map(([n, c, lab, d]) => (
            <div key={n} style={{ flex: "1 1 200px", minWidth: 0, borderRadius: 18, background: "#0A0B0D", border: "1px solid #1A1D22", padding: 18, display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, letterSpacing: "0.06em", color: "#9AA1AB" }}>{lab}</span>
              <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 44, fontWeight: 800, letterSpacing: "-1.5px", color: c }}>{n}</span>
              <span style={{ fontSize: 14, color: "#D7DADE", lineHeight: 1.5 }}>{d}</span>
            </div>
          ))}
          <div style={{ flex: "1 1 200px", minWidth: 0, borderRadius: 18, background: "#0A0B0D", border: "1px solid #1A1D22", padding: 18, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 44, fontWeight: 800, letterSpacing: "-1.5px" }}>1 or 2</span>
            <span style={{ fontSize: 14, color: "#D7DADE", lineHeight: 1.5 }}>posts a day, where most of us are. By his standards, that&apos;s a speck of a speck.</span>
          </div>
        </div>
        <span style={{ fontSize: 15, color: "#D7DADE", lineHeight: 1.6, maxWidth: 820 }}>
          Is 100,000 a day possible? Not for a person. Even with his huge team and his fame, Gary is at 900. But the lesson isn&apos;t the number, it&apos;s the mindset. Our competitors are out there talking about themselves every day. Be competitive. Be in the game. Nobody ever lost by being talked about too much.
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>A few easy ways to stay in the game:</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {[
              ["Bring it up naturally", "When someone mentions their website, Google or marketing, that’s your opening. Never hold back."],
              ["Share what we share", "A like, comment or reshare takes seconds and puts us in front of people we’d never reach."],
              ["Show it off", "Run your own site or a friend’s through it and share the board going from red to green."],
              ["Tell your story", "Why you invested, in your own words, whenever it comes up. People trust people more than brands."],
            ].map(([t, d]) => (
              <div key={t} style={{ borderRadius: 14, background: "#0A0B0D", border: "1px solid #1A1D22", padding: 14, display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{t}</span>
                <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.45 }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
        <span style={{ fontSize: 13, color: "#9AA1AB" }}>Every post still follows the ground rules below, starting with no promised rankings.</span>
      </section>

      <section id="rules" aria-labelledby="rules-h" style={{ maxWidth: 1120, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Caveat style={{ fontSize: "clamp(40px, 4.4vw, 54px)", marginTop: 18 }}>Do&apos;s and don&apos;ts</Caveat>
          <h2 id="rules-h" style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 30, letterSpacing: "-0.8px", fontWeight: 700 }}>
            A few ground rules that protect all of us.
          </h2>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "stretch" }}>
          <div style={{ flex: "1 1 400px", minWidth: 0, borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 600 }}>Please do</h3>
            {[
              "Put “affiliate link” or #ad next to your referral link where you post it. A tag is all it takes.",
              "Use your own referral link so the credit comes to you.",
              "Describe features and prices the way the website does.",
              "Send press, partnerships, big deals and anyone interested in investing my way.",
              "Give me a heads-up before you talk about Searchify on a podcast, panel or interview.",
              "Pass along anything customers tell you, good or bad. It shapes the product.",
            ].map((t) => (
              <div key={t} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none", marginTop: 2 }}>
                  <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#3DDC84" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{t}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: "1 1 400px", minWidth: 0, borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 600 }}>Please don&apos;t</h3>
            {[
              "Share anything from this portal: revenue, customer counts, dividends or plans.",
              "Promise rankings or results. We don’t, so we can’t let anyone else either.",
              "Talk share prices or valuation, or say things like “get in early, it’ll be worth more.”",
              "Take money or a fee for introducing an investor.",
              "Speak to journalists on behalf of Searchify.",
              "Post screenshots of this portal or anything that isn’t released yet.",
              "Trash competitors by name. We win by being better, not louder.",
            ].map((t) => (
              <div key={t} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none", marginTop: 2 }}>
                  <path d="M7 7l10 10M17 7L7 17" fill="none" stroke="#FF8A80" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1120, width: "100%", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 14, alignItems: "stretch" }}>
        <section id="invest" aria-labelledby="inv-h" style={{ flex: "1 1 420px", minWidth: 0, borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 id="inv-h" style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            “How do I get in on this?”
          </h2>
          <span style={{ fontSize: 14, color: "#D7DADE", lineHeight: 1.55 }}>
            If you talk about Searchify enough, someone will ask. That&apos;s a great sign. Here&apos;s the thing: selling shares in a private company is tightly regulated in both Canada and the US, so only the company can do it, with a lawyer involved. Your part is easy, just make the introduction.
          </span>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Thank them, and steer clear of numbers: price, valuation, returns or how much is available.",
              "Offer to introduce them to me instead.",
              "Send me a quick email with their name, how you know them and what they asked. Copy them in if they’re happy with that.",
              "I take it from there with our lawyer. And please don’t accept a finder’s fee, it can create licensing problems for both of us.",
            ].map((t, i) => (
              <li key={t} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ flex: "none", width: 26, height: 26, borderRadius: 8, display: "grid", placeItems: "center", background: "#1A1D22", fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                <span style={{ fontSize: 14, lineHeight: 1.5 }}>{t}</span>
              </li>
            ))}
          </ol>
          <div style={{ borderRadius: 14, background: "#0A0B0D", border: "1px solid #1A1D22", padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#9AA1AB" }}>What you can say</span>
            <span style={{ fontSize: 15, lineHeight: 1.5 }}>
              “I&apos;m not the right person to talk numbers, but I&apos;d love to introduce you to Aadle, the founder.”
            </span>
          </div>
        </section>

        <section id="sell" aria-labelledby="sell-h" style={{ flex: "1 1 420px", minWidth: 0, borderRadius: 20, background: "#101215", border: "1px solid #1A1D22", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 id="sell-h" style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            Thinking about selling some of your stake?
          </h2>
          <span style={{ fontSize: 14, color: "#D7DADE", lineHeight: 1.55 }}>
            Totally fair, life happens. Shares in a private company can&apos;t just be sold to anyone, so let&apos;s do it properly together. Your shareholder agreement has the final word; here&apos;s roughly how it goes.
          </span>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Your shares become official once your investment agreement is signed. Until then, there’s nothing to sell yet.",
              "Let me know in writing before you talk to any buyer. The board has to approve any transfer.",
              "[If your agreement includes it] The company and the other investors get the first chance to buy, at the same price.",
              "An outside buyer has to qualify legally and sign on to the same shareholder terms you did.",
              "Once approved, we update the records. Talk to your own accountant about tax before you agree on a price.",
            ].map((t, i) => (
              <li key={t} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ flex: "none", width: 26, height: 26, borderRadius: 8, display: "grid", placeItems: "center", background: "#1A1D22", fontSize: 12, fontWeight: 700 }}>{i + 1}</span>
                <span style={{ fontSize: 14, lineHeight: 1.5 }}>{t}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section id="learn" aria-labelledby="learn-h" style={{ maxWidth: 1120, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Caveat style={{ fontSize: "clamp(40px, 4.4vw, 54px)", marginTop: 18 }}>Keep learning</Caveat>
          <h2 id="learn-h" style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 30, letterSpacing: "-0.8px", fontWeight: 700 }}>
            Videos worth your time.
          </h2>
          <span style={{ fontSize: 15, color: "#D7DADE", lineHeight: 1.6, maxWidth: 820 }}>
            These are people I&apos;ve learned a lot from about pitching, offers and getting attention. Watch one on a commute. Their opinions are their own, not Searchify&apos;s.
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
          {VIDEOS.map((v) => (
            <article key={v.name} style={{ borderRadius: 18, background: "#101215", border: "1px solid #1A1D22", padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: "#9FE7F5" }}>{v.tag}</span>
              <span style={{ fontSize: 17, fontWeight: 600 }}>{v.name}</span>
              <span style={{ fontSize: 13, color: "#D7DADE", lineHeight: 1.5 }}>{v.blurb}</span>
              {v.href ? (
                <a href={v.href} target="_blank" rel="noreferrer" style={{ marginTop: "auto", display: "inline-flex", alignItems: "center", gap: 8, minHeight: 40, fontSize: 14, textDecoration: "none", color: "#9FE7F5" }}>
                  <PlayIcon />
                  {v.link}
                </a>
              ) : null}
              <span style={{ fontSize: 12, color: "#7D848E" }}>{v.more}</span>
            </article>
          ))}
        </div>
        <div style={{ borderRadius: 18, background: "#101215", border: "1px solid #1A1D22", padding: 18, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>The Searchify media kit</span>
            <span style={{ fontSize: 13, color: "#9AA1AB" }}>Logos, screenshots and one-liners you&apos;re free to use. If it&apos;s not in here, check with me first.</span>
          </span>
          <a
            href={pb?.mediaKitHref || "#"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              minHeight: 44,
              padding: "0 16px",
              borderRadius: 12,
              background: "#9FE7F5",
              color: "#0A0B0D",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Download the kit
          </a>
        </div>
        <span style={{ fontSize: 15, color: "#D7DADE", lineHeight: 1.6, paddingTop: 6 }}>Questions about any of this? Just message me. There are no silly ones. — Aadle</span>
      </section>
    </>
  );
}

export default function InvestorPlaybook() {
  return (
    <InvestorShell minHeight={4500}>
      <PlaybookBody />
    </InvestorShell>
  );
}
