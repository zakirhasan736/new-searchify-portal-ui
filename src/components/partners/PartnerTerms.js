"use client";

import { useEffect, useMemo, useState } from "react";
import { useShellBusy } from "@/components/v8/ShellBusy";
import PartnerShell, { usePartnerCtx } from "@/components/partners/PartnerShell";
import PitchStudio from "@/components/partners/PitchStudio";
import { getPartnerOverview } from "@/lib/partnerApi";
import { campaignMessages, referralLink } from "@/lib/partnerCampaigns";
import { downloadKit, previewBanner } from "@/lib/partnerKit";

const pct = (v) => `${Math.round(Number(v || 0) * 100)}%`;

const section = {
  maxWidth: 1180,
  width: "100%",
  boxSizing: "border-box",
  margin: "0 auto",
  borderRadius: 22,
  background: "#101215",
  border: "1px solid #1A1D22",
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const tile = {
  borderRadius: 14,
  background: "#0A0B0D",
  border: "1px solid #1A1D22",
  padding: 14,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  minWidth: 0,
};

function copyText(text) {
  try {
    navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

/** Printable copy of the partner's terms: the browser's print dialog saves it as a PDF. */
function printAgreement({ title, sub, terms, name, email, handle }) {
  const w = window.open("", "_blank", "width=860,height=1000");
  if (!w) return false;
  const rows = terms.map((t) => `<tr><th>${esc(t.label)}</th><td>${esc(t.value)}</td></tr>`).join("");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)} · ${esc(name)}</title>
<style>body{font:15px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#111;margin:48px;max-width:720px}
h1{font-size:26px;margin:0 0 4px}p{margin:0 0 18px;color:#555}table{border-collapse:collapse;width:100%;margin:18px 0}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #e4e6ea;vertical-align:top}th{width:34%;color:#555;font-weight:600}
h2{font-size:16px;margin:28px 0 8px}li{margin:4px 0}.foot{margin-top:36px;font-size:12px;color:#777}
@media print{body{margin:18mm}}</style></head><body>
<h1>${esc(title)}</h1><p>${esc(sub)}</p>
<p><strong>Partner:</strong> ${esc(name)}${email ? ` · ${esc(email)}` : ""}<br><strong>Referral link:</strong> https://${esc(referralLink(handle))}</p>
<table>${rows}</table>
<h2>Rules</h2><ul>
<li>Say clearly that you earn a commission, every time you share your link.</li>
<li>Describe Searchify accurately: what it does, and what it costs.</li>
<li>Only email people who agreed to hear from you.</li>
<li>Don't bid on "Searchify" or similar words in search ads, pretend to be Searchify, or promise rankings.</li>
<li>Don't refer yourself, your own businesses or family.</li></ul>
<p class="foot">Printed ${esc(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }))} from the Searchify partner centre. Aequitas Marketing Corp. (Searchify) · Alberta law. Questions: partners@searchify.io</p>
<script>window.onload=function(){setTimeout(function(){window.print()},250)}</script></body></html>`);
  w.document.close();
  return true;
}

function PartnerTermsBody() {
  const track = useShellBusy();
  const { ptype, profile } = usePartnerCtx();
  const [ov, setOv] = useState(null);
  useEffect(() => {
    let cancelled = false;
    track(getPartnerOverview())
      .then((res) => {
        if (!cancelled && res?.ok) setOv(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [copied, setCopied] = useState("");
  const [kitState, setKitState] = useState({});
  const [preview, setPreview] = useState("");
  const [printMsg, setPrintMsg] = useState("");
  const [channel, setChannel] = useState("all");

  const handle = ov?.handle || profile?.handle || "";
  const name = profile?.displayName || "";
  const refMrr = Number(ov?.refMrr) || 0;
  const program = ov?.program || null;

  useEffect(() => {
    if (!handle) return undefined;
    let url = "";
    let live = true;
    previewBanner(handle)
      .then((u) => {
        url = u;
        if (live) setPreview(u);
      })
      .catch(() => {});
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [handle]);

  const { ag, steps, dos, donts, snips, isFounding, isStandard } = useMemo(() => {
    const F = (program?.key || ptype) === "founding";
    const base = program?.base ?? (F ? 0.35 : 0.2);
    const top = program?.top ?? (F ? 0.4 : 0.25);
    const now = program?.rate ?? (Number(profile?.rate) || base);
    const stepped = program ? program.steppedUp : now >= top;
    const rateLine = stepped
      ? `${pct(now)} of every payment, for good`
      : `${pct(now)}, rising to ${pct(top)} for good after 10 paying referrals in any 6 months`;
    const agData = F
      ? {
          title: "Founding Partner Agreement",
          sub: `Founding partner (investors and developers)${profile?.since ? ` since ${profile.since}` : ""} · Aequitas Marketing Corp. (Searchify) · Alberta law`,
          terms: [
            ["Your rate", rateLine],
            ["How long", "Each customer’s first 12 months"],
            ["When it clears", "30 days after each payment"],
            ["When you’re paid", "Monthly on the 15th, once over $50"],
            ["Performance shares", "Up to 2.5% in five 0.5% steps"],
            ["Your rate is protected", "It can’t be lowered without your written consent"],
            ["Ending it", "Either side, with 30 days’ notice"],
            ["Your shares", "Separate. Ending this never affects them"],
          ],
        }
      : {
          title: "Affiliate Program Terms",
          sub: `Affiliate program (creators on TikTok, Facebook, Instagram, YouTube, blogs) · ${profile?.since ? `Accepted ${profile.since}` : "Accepted when you applied"} · Alberta law`,
          terms: [
            ["Your rate", rateLine],
            ["How long", "Each customer’s first 12 months"],
            ["Link tracking", "60 days after a click"],
            ["When it clears", "30 days after each payment"],
            ["When you’re paid", "Monthly on the 15th, once over $50"],
            ["Ending it", "Either side, with 30 days’ notice"],
          ],
        };
    const STEPS = [2500, 5000, 10000, 20000, 40000];
    const nextIdx = STEPS.findIndex((level) => refMrr < level);
    const stepsList = STEPS.map((lvl, i) => {
      const reached = refMrr >= lvl;
      const isNext = i === nextIdx;
      const st = reached
        ? ["Reached · held 3 months to earn", "#D5F879", "rgba(213,248,121,.06)", "rgba(213,248,121,.4)", "#D5F879", "#0A0B0D", `Your referrals bring in $${Math.round(refMrr).toLocaleString("en-US")} a month`]
        : isNext
          ? ["Next", "#4DA3FF", "#0A0B0D", "#1A1D22", "#1A1D22", "#F2F4F5", `$${Math.round(lvl - refMrr).toLocaleString("en-US")} a month to go`]
          : ["", "#7D848E", "#0A0B0D", "#1A1D22", "#1A1D22", "#7D848E", "0.5% of the company"];
      return { n: String(i + 1), at: `$${lvl.toLocaleString("en-US")}`, state: st[0], color: st[1], bg: st[2], border: st[3], numBg: st[4], numColor: st[5], note: st[6] };
    });
    const link = referralLink(handle);
    return {
      ag: { title: agData.title, sub: agData.sub, terms: agData.terms.map((t) => ({ label: t[0], value: t[1] })) },
      steps: stepsList,
      isFounding: F,
      isStandard: !F,
      dos: [
        "Say clearly that you earn a commission, every time you share your link.",
        "Describe Searchify accurately: what it does, and what it costs.",
        "Follow anti-spam laws: only email people who agreed to hear from you.",
        "Use the logos, banners and visuals from the kit below.",
      ],
      donts: [
        'Bid on "Searchify" or similar words in Google or Bing ads.',
        "Pretend to be Searchify, or make promises we don’t make (like guaranteed rankings).",
        "Sign up yourself, your own businesses or family through your link.",
      ],
      snips: [
        ["Social post or video", "I use Searchify for SEO on WordPress sites, and I earn a commission if you sign up through my link."],
        ["YouTube or podcast description", `Affiliate link: ${link}. I earn a commission if you subscribe, at no extra cost to you.`],
        ["Email or newsletter", "Heads up: this is a partner link, so I get paid if you become a customer. I only recommend tools I use."],
      ],
    };
  }, [ptype, profile, program, refMrr, handle]);

  const messages = useMemo(() => campaignMessages(handle), [handle]);
  const channelChips = [
    ["all", "All"],
    ["social", "Social"],
    ["video", "Video"],
    ["email", "Email"],
    ["pro", "LinkedIn & agencies"],
  ];
  const inChip = (m) => {
    const c = m.channel.toLowerCase();
    if (channel === "all") return true;
    if (channel === "social") return /instagram|facebook|x \/|threads|whatsapp|woocommerce|community/.test(c);
    if (channel === "video") return /tiktok|youtube|reels|shorts|podcast/.test(c);
    if (channel === "email") return /email|newsletter/.test(c);
    if (channel === "pro") return /linkedin|agenc/.test(c);
    return true;
  };

  const doCopy = (key, text) => {
    copyText(text);
    setCopied(key);
    window.setTimeout(() => setCopied((k) => (k === key ? "" : k)), 2200);
  };

  const KIT = [
    ["logos", "Logo pack", "SVG and PNG, light and dark versions, with spacing rules. One .zip.", "Download logos"],
    ["banners", "Banners", "PNG banners with your link: 1200×628, 1080×1080, 728×90, 300×250. One .zip.", "Download banners"],
    ["visuals", "Product visuals", "The scan, the approval queue and a before/after search result, as clean illustrations. One .zip.", "Download visuals"],
    ["copy", "Sample posts and emails", "All 10 campaign messages and a 3-email sequence with your link. Disclosure already included. One .txt.", "Download copy"],
  ];

  const getKit = async (id) => {
    setKitState((s) => ({ ...s, [id]: { busy: true } }));
    try {
      const n = await downloadKit(id, { handle, name });
      setKitState((s) => ({ ...s, [id]: { done: `Downloaded (${n} file${n === 1 ? "" : "s"}).` } }));
    } catch {
      setKitState((s) => ({ ...s, [id]: { error: "The download could not be made in this browser. Try Chrome, Edge or Safari." } }));
    }
  };

  const onPrint = () => {
    const ok = printAgreement({ ...ag, name: name || "Partner", email: profile?.email || "", handle });
    setPrintMsg(ok ? "Opened a printable copy. Choose “Save as PDF” in the print dialog." : "Your browser blocked the new window. Allow pop-ups for this site and try again.");
  };

  const btnGhost = { minHeight: 42, padding: "0 16px", borderRadius: 12, border: "1px solid #262A31", background: "transparent", color: "#F2F4F5", fontSize: 14 };

  return (
    <>
      <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "stretch" }}>
        <section
          aria-labelledby="ag-h"
          style={{ ...section, margin: 0, flex: "999 1 560px", minWidth: 0, border: "1px solid rgba(213,248,121,.35)", padding: 22, gap: 14 }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h1 id="ag-h" style={{ margin: 0, fontFamily: "'Bricolage Grotesque', Geist, sans-serif", fontSize: 30, letterSpacing: "-0.8px", fontWeight: 700 }}>
                {ag.title}
              </h1>
              <span style={{ fontSize: 14, color: "#9AA1AB" }}>{ag.sub}</span>
            </span>
            <button type="button" onClick={onPrint} style={btnGhost}>
              Download PDF
            </button>
          </div>
          {printMsg ? (
            <span role="status" style={{ fontSize: 13, color: "#9AA1AB" }}>
              {printMsg}
            </span>
          ) : null}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {ag.terms.map((t) => (
              <div key={t.label} style={{ ...tile, padding: "12px 14px", gap: 4 }}>
                <span style={{ fontSize: 12, color: "#7D848E" }}>{t.label}</span>
                <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>{t.value}</span>
              </div>
            ))}
          </div>
          {program && !program.steppedUp ? (
            <span style={{ fontSize: 13, color: "#9AA1AB" }}>
              {program.qualified6m} of {program.need} paying referrals in the last 6 months. {program.toGo} more and your rate moves to {pct(program.top)} automatically.
            </span>
          ) : null}
        </section>

        <section aria-labelledby="ps-h" style={{ ...section, margin: 0, flex: "1 1 340px", minWidth: 0, padding: 22 }}>
          <h2 id="ps-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            Performance shares
          </h2>
          {isFounding ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>
                Up to 2.5% more of the company, in five steps of 0.5%. A step is earned when monthly revenue from your referrals reaches its level and stays there for 3 months in a row.
              </span>
              <span style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span>Your referrals now bring in</span>
                <span style={{ fontFamily: "'Geist Mono', monospace", color: "#D5F879" }}>${Math.round(refMrr).toLocaleString("en-US")} / mo</span>
              </span>
              {steps.map((st) => (
                <div key={st.n} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 12, background: st.bg, border: `1px solid ${st.border}` }}>
                  <span style={{ width: 26, height: 26, flex: "none", borderRadius: 8, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, background: st.numBg, color: st.numColor }}>
                    {st.n}
                  </span>
                  <span style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 14 }}>{st.at} a month</span>
                    <span style={{ fontSize: 12, color: "#7D848E" }}>{st.note}</span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: st.color }}>{st.state}</span>
                </div>
              ))}
              <span style={{ fontSize: 12, color: "#7D848E" }}>
                Steps must be earned within 36 months of signing. Earned steps are granted under a board-approved plan.
              </span>
            </div>
          ) : null}
          {isStandard ? (
            <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>
              Performance shares are part of the Founding Partner Agreement for investors and developers only. Your rate and payouts are set out in the Affiliate Program Terms on the left.
            </span>
          ) : null}
        </section>
      </div>

      <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "stretch" }}>
        <section aria-labelledby="do-h" style={{ ...section, margin: 0, flex: "1 1 360px", minWidth: 0, gap: 10 }}>
          <h2 id="do-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            Do
          </h2>
          {dos.map((d) => (
            <div key={d} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden style={{ flex: "none", marginTop: 2 }}>
                <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#3DDC84" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{d}</span>
            </div>
          ))}
        </section>
        <section aria-labelledby="dont-h" style={{ ...section, margin: 0, flex: "1 1 360px", minWidth: 0, gap: 10 }}>
          <h2 id="dont-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            {"Don't"}
          </h2>
          {donts.map((d) => (
            <div key={d} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden style={{ flex: "none", marginTop: 2 }}>
                <path d="M7 7l10 10M17 7L7 17" fill="none" stroke="#FF8A80" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
              <span>{d}</span>
            </div>
          ))}
          <span style={{ fontSize: 12, color: "#7D848E", lineHeight: 1.5 }}>Breaking these can end the agreement, and commissions on those customers stop.</span>
        </section>
      </div>

      <section aria-labelledby="disc-h" style={section}>
        <h2 id="disc-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
          Say you earn a commission: wording you can copy
        </h2>
        <span style={{ fontSize: 14, color: "#9AA1AB" }}>
          Put it where people will see it before they click, not hidden at the bottom. US law (the FTC{"'s"} endorsement rules) requires it, and it builds trust.
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 10 }}>
          {snips.map((sn) => (
            <div key={sn[0]} style={tile}>
              <span style={{ fontSize: 12, color: "#7D848E" }}>{sn[0]}</span>
              <span style={{ fontSize: 14, lineHeight: 1.5 }}>{sn[1]}</span>
              <button
                type="button"
                onClick={() => doCopy(`d-${sn[0]}`, sn[1])}
                style={{ alignSelf: "flex-start", minHeight: 36, padding: "0 12px", borderRadius: 10, border: 0, background: copied === `d-${sn[0]}` ? "#3DDC84" : "#D5F879", color: "#0A0B0D", fontSize: 13, fontWeight: 600 }}
              >
                {copied === `d-${sn[0]}` ? "Copied" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="camp-h" style={section}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h2 id="camp-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            Campaign messages that work
          </h2>
          <span style={{ fontSize: 13, color: "#9AA1AB" }}>Your link and the disclosure are already in each one.</span>
        </div>
        <div role="group" aria-label="Filter by channel" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {channelChips.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={channel === id}
              onClick={() => setChannel(id)}
              style={{
                minHeight: 34,
                padding: "0 12px",
                borderRadius: 999,
                border: `1px solid ${channel === id ? "#D5F879" : "#262A31"}`,
                background: channel === id ? "rgba(213,248,121,.08)" : "transparent",
                color: channel === id ? "#D5F879" : "#9AA1AB",
                fontSize: 13,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 10 }}>
          {messages.filter(inChip).map((m, i) => (
            <article key={m.id} style={tile}>
              <span style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>
                  {i + 1}. {m.title}
                </span>
                <span style={{ fontSize: 12, color: "#7D848E", textAlign: "right" }}>{m.channel}</span>
              </span>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap", color: "#D7DADE" }}>{m.text}</p>
              <span style={{ display: "flex", gap: 8, alignItems: "center", marginTop: "auto" }}>
                <button
                  type="button"
                  onClick={() => doCopy(`m-${m.id}`, m.text)}
                  style={{ minHeight: 36, padding: "0 12px", borderRadius: 10, border: 0, background: copied === `m-${m.id}` ? "#3DDC84" : "#D5F879", color: "#0A0B0D", fontSize: 13, fontWeight: 600 }}
                >
                  {copied === `m-${m.id}` ? "Copied" : "Copy message"}
                </button>
                <span style={{ fontSize: 12, color: "#7D848E" }}>{m.text.length} characters</span>
              </span>
            </article>
          ))}
        </div>
      </section>

      <PitchStudio handle={handle} />

      <section aria-labelledby="kit-h" style={section}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h2 id="kit-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            Marketing kit
          </h2>
          <span style={{ fontSize: 13, color: "#9AA1AB" }}>
            Questions? <a href="mailto:partners@searchify.io">partners@searchify.io</a>
          </span>
        </div>
        {preview ? (
          <figure style={{ margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview of your 1200×628 Searchify banner with your referral link" style={{ width: "100%", maxWidth: 600, borderRadius: 14, border: "1px solid #1A1D22" }} />
            <figcaption style={{ fontSize: 12, color: "#7D848E" }}>Your 1200×628 banner, with your link: {referralLink(handle)}</figcaption>
          </figure>
        ) : null}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          {KIT.map(([id, title, desc, cta]) => {
            const st = kitState[id] || {};
            return (
              <div key={id} style={{ ...tile, gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
                <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.45 }}>{desc}</span>
                <button
                  type="button"
                  disabled={st.busy || !handle}
                  onClick={() => getKit(id)}
                  style={{ alignSelf: "flex-start", marginTop: 4, minHeight: 36, padding: "0 12px", borderRadius: 10, border: "1px solid #262A31", background: "transparent", color: "#F2F4F5", fontSize: 13, opacity: st.busy ? 0.7 : 1 }}
                >
                  {st.busy ? "Preparing…" : st.done ? "Download again" : cta}
                </button>
                {st.done ? (
                  <span role="status" style={{ fontSize: 12, color: "#3DDC84" }}>
                    {st.done}
                  </span>
                ) : null}
                {st.error ? (
                  <span role="alert" style={{ fontSize: 12, color: "#FF5A4E" }}>
                    {st.error}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

export default function PartnerTerms() {
  return (
    <PartnerShell active="terms" minHeight={1500} showSignOut>
      <PartnerTermsBody />
    </PartnerShell>
  );
}
