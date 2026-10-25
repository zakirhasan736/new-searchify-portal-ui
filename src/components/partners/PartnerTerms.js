"use client";

import { useEffect, useMemo, useState } from "react";
import PartnerShell, { usePartnerCtx } from "@/components/partners/PartnerShell";
import { getPartnerOverview } from "@/lib/partnerApi";

function PartnerTermsBody() {
  const { ptype, profile } = usePartnerCtx();
  // Real monthly revenue from this partner's referrals (drives the founding-partner share steps).
  const [refMrr, setRefMrr] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getPartnerOverview()
      .then((res) => {
        if (!cancelled && res?.ok) setRefMrr(Number(res.data?.refMrr) || 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const [copied, setCopied] = useState(-1);
  const [got, setGot] = useState({});
  const [dl, setDl] = useState(false);

  const { ag, steps, dos, donts, snips, kit, isFounding, isStandard } = useMemo(() => {
    const F = ptype === "founding";
    const agData = F
      ? {
          title: "Founding Partner Agreement",
          sub: `Founding partner${profile?.since ? ` since ${profile.since}` : ""} · Aequitas Marketing Corp. (Searchify) · Alberta law`,
          terms: [
            ["Your rate", "35%, rising to 40% for good after 10 qualified referrals in any 6 months"],
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
          title: "Partner Program Terms",
          sub: `${profile?.since ? `Accepted ${profile.since}` : "Accepted when you applied"} · Alberta law`,
          terms: [
            ["Your rate", "30% of every payment"],
            ["How long", "Each customer’s first 12 months"],
            ["Link tracking", "60 days after a click"],
            ["When it clears", "30 days after each payment"],
            ["When you’re paid", "Monthly on the 15th, once over $50"],
            ["Ending it", "Either side, with 30 days’ notice"],
          ],
        };
    const STEPS = [2500, 5000, 10000, 20000, 40000];
    const mrr = Number(refMrr) || 0;
    const nextIdx = STEPS.findIndex((level) => mrr < level);
    const stepsList = STEPS.map((s, i) => {
      // From real referral revenue: reached levels, the next level and how far away it is.
      const reached = mrr >= s;
      const isNext = i === nextIdx;
      const st = reached
        ? ["Reached · held 3 months to earn", "#D5F879", "rgba(213,248,121,.06)", "rgba(213,248,121,.4)", "#D5F879", "#0A0B0D", `Your referrals bring in $${Math.round(mrr).toLocaleString("en-US")} a month`]
        : isNext
          ? ["Next", "#4DA3FF", "#0A0B0D", "#1A1D22", "#1A1D22", "#F2F4F5", `$${Math.round(s - mrr).toLocaleString("en-US")} a month to go`]
          : ["", "#7D848E", "#0A0B0D", "#1A1D22", "#1A1D22", "#7D848E", "0.5% of the company"];
      return {
        n: String(i + 1),
        at: `$${s.toLocaleString("en-US")}`,
        state: st[0],
        color: st[1],
        bg: st[2],
        border: st[3],
        numBg: st[4],
        numColor: st[5],
        note: st[6],
      };
    });
    const handle = F ? "nickpetitt" : "samortiz";
    const SN = [
      ["Social post or video", "I use Searchify for SEO on WordPress sites, and I earn a commission if you sign up through my link."],
      ["YouTube or podcast description", `Affiliate link: searchify.io/?ref=${handle}. I earn a commission if you subscribe, at no extra cost to you.`],
      ["Email or newsletter", "Heads up: this is a partner link, so I get paid if you become a customer. I only recommend tools I use."],
    ];
    const KIT = [
      ["Logo pack", "SVG and PNG, light and dark versions, with spacing rules.", "Download logos"],
      ["Banners", "Ready-made sizes for websites and social: 1200×628, 1080×1080, 728×90, 300×250.", "Download banners"],
      ["Product screenshots", "The scan, the approval queue and before/after results, cleared for you to use.", "Download screenshots"],
      ["Sample posts and emails", "Short posts and a 3-email sequence you can edit. Disclosure line already included.", "Download copy"],
    ];
    return {
      ag: { title: agData.title, sub: agData.sub, terms: agData.terms.map((t) => ({ label: t[0], value: t[1] })) },
      steps: stepsList,
      isFounding: F,
      isStandard: !F,
      dos: [
        "Say clearly that you earn a commission, every time you share your link.",
        "Describe Searchify accurately: what it does, and what it costs.",
        "Follow anti-spam laws: only email people who agreed to hear from you.",
        "Use the logos and screenshots from the kit below.",
      ],
      donts: [
        'Bid on "Searchify" or similar words in Google or Bing ads.',
        "Pretend to be Searchify, or make promises we don’t make (like guaranteed rankings).",
        "Sign up yourself, your own businesses or family through your link.",
      ],
      snips: SN,
      kit: KIT,
    };
  }, [ptype, profile, refMrr]);

  const copySnip = (i, text) => {
    try {
      navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
    setCopied(i);
  };

  return (
    <>
      <div
        style={{
          maxWidth: 1180,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          alignItems: "stretch",
        }}
      >
        <section
          aria-labelledby="ag-h"
          style={{
            flex: "999 1 560px",
            minWidth: 0,
            borderRadius: 22,
            background: "#101215",
            border: "1px solid rgba(213,248,121,.35)",
            padding: 22,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <h1
                id="ag-h"
                style={{
                  margin: 0,
                  fontFamily: "'Bricolage Grotesque', Geist, sans-serif",
                  fontSize: 30,
                  letterSpacing: "-0.8px",
                  fontWeight: 700,
                }}
              >
                {ag.title}
              </h1>
              <span style={{ fontSize: 14, color: "#9AA1AB" }}>{ag.sub}</span>
            </span>
            <button
              type="button"
              onClick={() => setDl(true)}
              style={{
                minHeight: 42,
                padding: "0 16px",
                borderRadius: 12,
                border: "1px solid #262A31",
                background: "transparent",
                color: "#F2F4F5",
                fontSize: 14,
              }}
            >
              Download PDF
            </button>
          </div>
          {dl ? (
            <span role="status" style={{ fontSize: 13, color: "#3DDC84" }}>
              Downloaded: your signed copy.
            </span>
          ) : null}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {ag.terms.map((t) => (
              <div
                key={t.label}
                style={{
                  borderRadius: 14,
                  background: "#0A0B0D",
                  border: "1px solid #1A1D22",
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 12, color: "#7D848E" }}>{t.label}</span>
                <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>{t.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="ps-h"
          style={{
            flex: "1 1 340px",
            minWidth: 0,
            borderRadius: 22,
            background: "#101215",
            border: "1px solid #1A1D22",
            padding: 22,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
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
                <span style={{ fontFamily: "'Geist Mono', monospace", color: "#D5F879" }}>$2,747 / mo</span>
              </span>
              {steps.map((s) => (
                <div
                  key={s.n}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 12,
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                  }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      flex: "none",
                      borderRadius: 8,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      background: s.numBg,
                      color: s.numColor,
                    }}
                  >
                    {s.n}
                  </span>
                  <span style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 14 }}>{s.at} a month</span>
                    <span style={{ fontSize: 12, color: "#7D848E" }}>{s.note}</span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.state}</span>
                </div>
              ))}
              <span style={{ fontSize: 12, color: "#7D848E" }}>
                Steps must be earned by Feb 26, 2030 (36 months after signing). Earned steps are granted under a board-approved plan.
              </span>
            </div>
          ) : null}
          {isStandard ? (
            <span style={{ fontSize: 14, color: "#9AA1AB", lineHeight: 1.5 }}>
              Performance shares are part of the Founding Partner Agreement only. Your rate and payouts are set out in the Partner Program Terms on the left.
            </span>
          ) : null}
        </section>
      </div>

      <div
        style={{
          maxWidth: 1180,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          alignItems: "stretch",
        }}
      >
        <section
          aria-labelledby="do-h"
          style={{
            flex: "1 1 360px",
            minWidth: 0,
            borderRadius: 22,
            background: "#101215",
            border: "1px solid #1A1D22",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
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
        <section
          aria-labelledby="dont-h"
          style={{
            flex: "1 1 360px",
            minWidth: 0,
            borderRadius: 22,
            background: "#101215",
            border: "1px solid #1A1D22",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
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
          <span style={{ fontSize: 12, color: "#7D848E", lineHeight: 1.5 }}>
            Breaking these can end the agreement, and commissions on those customers stop.
          </span>
        </section>
      </div>

      <section
        aria-labelledby="disc-h"
        style={{
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
        }}
      >
        <h2 id="disc-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
          Say you earn a commission: wording you can copy
        </h2>
        <span style={{ fontSize: 14, color: "#9AA1AB" }}>
          Put it where people will see it before they click, not hidden at the bottom. US law (the FTC{"'s"} endorsement rules) requires it, and it builds trust.
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 10 }}>
          {snips.map((s, i) => (
            <div
              key={s[0]}
              style={{
                borderRadius: 14,
                background: "#0A0B0D",
                border: "1px solid #1A1D22",
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 12, color: "#7D848E" }}>{s[0]}</span>
              <span style={{ fontSize: 14, lineHeight: 1.5 }}>{s[1]}</span>
              <button
                type="button"
                onClick={() => copySnip(i, s[1])}
                style={{
                  alignSelf: "flex-start",
                  minHeight: 36,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: 0,
                  background: copied === i ? "#3DDC84" : "#D5F879",
                  color: "#0A0B0D",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {copied === i ? "Copied" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="kit-h"
        style={{
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
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <h2 id="kit-h" style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>
            Marketing kit
          </h2>
          <span style={{ fontSize: 13, color: "#9AA1AB" }}>
            Questions? <a href="mailto:partners@searchify.io">partners@searchify.io</a>
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
          {kit.map((k, i) => (
            <div
              key={k[0]}
              style={{
                borderRadius: 14,
                background: "#0A0B0D",
                border: "1px solid #1A1D22",
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600 }}>{k[0]}</span>
              <span style={{ fontSize: 13, color: "#9AA1AB", lineHeight: 1.45 }}>{k[1]}</span>
              <button
                type="button"
                onClick={() => setGot((g) => ({ ...g, [i]: true }))}
                style={{
                  alignSelf: "flex-start",
                  marginTop: 4,
                  minHeight: 36,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid #262A31",
                  background: "transparent",
                  color: "#F2F4F5",
                  fontSize: 13,
                }}
              >
                {got[i] ? "Downloaded" : k[2]}
              </button>
            </div>
          ))}
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
