"use client";

import { useEffect, useId, useState } from "react";

const SEEN = "sf_overview_tour_v1";

const STEPS = [
  {
    target: "website",
    title: "Choose the website",
    body: "This menu is the website you are working on. Change it on Overview or Settings and every page follows. Keywords, Backlinks, AI visibility, and the completion log can stay on a different site for that page only. Add another website from More, then Manage workspace. The plan decides how many sites you can add.",
  },
  {
    target: "overview",
    title: "Your next moves",
    body: "The overview uses what you told us in setup: what you sell, where you serve, and the 90-day aim. Titles, descriptions, keywords, and prompts start from that brief. You can change the answers without a developer.",
  },
  {
    target: "metrics",
    title: "Read the signals",
    body: "A dash means that source is not connected yet. Searchify does not invent an audit score, a ranking, or a referring domain. The numbers appear after Google, PageSpeed, or live link data is connected.",
  },
  {
    target: "route",
    href: "/app/connections",
    title: "Connect Google and the website",
    body: "Connections is where evidence and publishing are set up. Continue with Google, then choose the Search Console property and the Analytics property for this site. WordPress is the path that can publish an approved title and description. Connecting does not publish anything by itself.",
  },
  {
    target: "route",
    href: "/app/workspace",
    title: "More than one Google login",
    body: "Each website can use its own Google account. Open More, then Manage workspace. Add Google account, sign in with the next login, and choose that email on the website it belongs to. Unlink removes a site from this workspace. Disconnect WordPress only stops publishing.",
  },
  {
    target: "queue",
    title: "From suggestion to published",
    body: "A card is a draft: a title, a description, or a keyword focus. Open it to compare the current line with the suggestion. Approve keeps it for the next step. Dismiss sets it aside. Publishing is a separate step, and only after you approve. This chat cannot publish the page.",
  },
  {
    target: "route",
    href: "/app/keywords",
    title: "Keywords",
    body: "Keywords begin with your setup: the offer and the place you serve. Live data adds the Google position, monthly volume, difficulty, the searches you already rank for, and new ideas you can track. Searchify does not invent a rank or a volume.",
  },
  {
    target: "route",
    href: "/app/visibility",
    title: "AI visibility",
    body: "AI visibility is a short list of questions a customer might ask about your business. Run live checks to ask ChatGPT, Gemini, Perplexity, or Claude and see whether your business is named or your site is cited. Each check keeps the full answer and its sources.",
  },
  {
    target: "route",
    href: "/app/backlinks",
    title: "Backlinks",
    body: "Backlinks are the referring domains stored for the selected website. An empty list means none are stored yet. A lost link is a cue to review it. Searchify does not disavow a link for you.",
  },
  {
    target: "route",
    href: "/app/billing",
    title: "Plan and usage",
    body: "Subscription is your plan: how many websites, keywords, prompts, and audits the workspace can hold. Change the plan there when you need another site. The usage line shows what this workspace has already used.",
  },
  {
    target: "guardrails",
    title: "How tightly to work",
    body: "Settings holds the working style. Keyword specificity stays close to your brief or explores a little wider. You still approve every live change. On a phone, open More, then Settings.",
  },
  {
    target: "assistant",
    title: "Ask, and take the next question",
    body: "Ask can suggest a question while you type, then offer the next useful one. It can walk you to Connections, Manage workspace, or the contact page if you want a person. Ask for this tour any time.",
  },
  {
    target: "nav",
    title: "Move through the workspace",
    body: "On a phone, Home, Keywords, Visibility, and Links sit on the bottom bar. More holds approval, Connections, the audit, Settings, Subscription, and Manage workspace. The completion log keeps setup and the actions you take.",
  },
];

function shown(node) {
  if (!node) return false;
  const style = getComputedStyle(node);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = node.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function findNav(href) {
  const mobile = document.querySelector(`.mobile-tabbar a.mobile-tab[href="${href}"]`);
  if (shown(mobile)) return mobile;
  const side = document.querySelector(`.dash-sidebar a.side-link[href="${href}"]`);
  if (shown(side)) return side;
  const more = document.querySelector(".mobile-tabbar button.mobile-tab");
  if (shown(more)) return more;
  return side;
}

function findTarget(step) {
  if (step.href) {
    const route = findNav(step.href);
    if (route) return route;
  }
  if (step.target === "nav") {
    const tabs = document.querySelector(".mobile-tabbar");
    if (shown(tabs)) return tabs;
    const toggle = document.querySelector(".nav-toggle");
    if (shown(toggle)) return toggle;
  }
  const node = document.querySelector(`[data-tour="${step.target}"]`);
  if (step.target === "guardrails" && !shown(node)) {
    const more = document.querySelector(".mobile-tabbar button.mobile-tab");
    if (shown(more)) return more;
  }
  return shown(node) ? node : node;
}

export default function OverviewTour() {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [box, setBox] = useState(null);

  useEffect(() => {
    const start = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener("sf-start-tour", start);
    let timer = 0;
    try {
      if (localStorage.getItem(SEEN) !== "done") timer = window.setTimeout(start, 600);
    } catch {
      timer = 0;
    }
    return () => {
      window.removeEventListener("sf-start-tour", start);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const node = findTarget(STEPS[step]);
      if (!node) {
        setBox(null);
        return;
      }
      node.scrollIntoView({ block: "nearest", inline: "nearest" });
      const rect = node.getBoundingClientRect();
      setBox({
        top: Math.max(8, rect.top - 6),
        left: Math.max(8, rect.left - 6),
        width: Math.min(rect.width + 12, window.innerWidth - 16),
        height: rect.height + 12,
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, step]);

  const close = (finished) => {
    try {
      localStorage.setItem(SEEN, "done");
    } catch {
      /* storage can be blocked; the tour still closes */
    }
    setOpen(false);
    if (finished) window.dispatchEvent(new CustomEvent("sf-tour-finished"));
  };

  if (!open) return null;
  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className="tour-layer" role="presentation">
      <div className="tour-hole" style={box ? { top: box.top, left: box.left, width: box.width, height: box.height } : { top: "40%", left: "50%", width: 0, height: 0 }} />
      <div className="tour-card" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="tour-kicker">Workspace tour · {step + 1} of {STEPS.length}</div>
        <h2 id={titleId}>{current.title}</h2>
        <p>{current.body}</p>
        <div className="tour-actions">
          <button type="button" className="tour-skip" onClick={() => close(false)}>Skip</button>
          <div>
            {step > 0 ? <button type="button" className="w-button" onClick={() => setStep((value) => value - 1)}>Back</button> : null}
            <button type="button" className="w-button primary" onClick={() => (last ? close(true) : setStep((value) => value + 1))}>{last ? "Done" : "Next"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function wantsTour(text) {
  const lower = String(text || "").toLowerCase();
  return /\btour\b|\bwalk me\b|\bshow me around\b|\bguide me\b|\bhow (does|do) (this|everything|the overview|it) work/.test(lower);
}
