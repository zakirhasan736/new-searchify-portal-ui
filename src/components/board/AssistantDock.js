"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { wantsTour } from "@/components/board/OverviewTour";
import { useWorkspaceSite } from "@/components/board/useBusinessBrief";
import { BREADTH_LABELS, loadGuardrails } from "@/lib/guardrails";
import { loadDecisions, sampleCards } from "@/lib/previewQueue";
import { askAssistant } from "@/lib/v1Api";

const STORE = "sf_assistant_v1";

function readThread(key) {
  if (!key) return null;
  try {
    const all = JSON.parse(sessionStorage.getItem(STORE) || "{}");
    return Array.isArray(all[key]) && all[key].length ? all[key] : null;
  } catch {
    return null;
  }
}

function writeThread(key, rows) {
  if (!key) return;
  try {
    const all = JSON.parse(sessionStorage.getItem(STORE) || "{}");
    all[key] = rows.filter((row) => !row.pending).slice(-40);
    sessionStorage.setItem(STORE, JSON.stringify(all));
  } catch {
    /* session storage can be full or blocked */
  }
}

const PROMPTS = [
  { q: "Why should I use Searchify?", keys: ["why", "benefit", "searchify", "use", "help me"] },
  { q: "Connect my Google account", keys: ["google", "search console", "analytics", "gsc", "connect"] },
  { q: "Add another Google account", keys: ["another google", "multiple google", "second account", "google login"] },
  { q: "Connect WordPress", keys: ["wordpress", "publish", "website connect", "wp"] },
  { q: "Add another website", keys: ["another site", "multiple site", "add website", "second website"] },
  { q: "How are titles and descriptions written?", keys: ["title", "description", "generate", "draft", "suggestion"] },
  { q: "What happens when I approve?", keys: ["approve", "publish", "live", "draft"] },
  { q: "Explain keywords", keys: ["keyword", "query", "rank"] },
  { q: "Explain backlinks", keys: ["backlink", "referring", "link"] },
  { q: "Explain AI visibility", keys: ["visibility", "ai ", "prompt", "answer engine"] },
  { q: "Which plan do I need?", keys: ["plan", "subscription", "usage", "billing", "package"] },
  { q: "Contact the team", keys: ["admin", "contact", "support", "person", "help me talk"] },
  { q: "Show me the tour", keys: ["tour", "guide", "show me"] },
];

function greeting(brief, name) {
  if (!brief.ready) {
    return {
      role: "assistant",
      text: `I’m here with you on ${name}. Searchify can draft a title and description from your setup, then wait for you to approve it. Tell me what you want to do, or tap a question below. I can also open Connections or the contact page if you want.`,
      note: "Searchify assistance",
    };
  }
  const aim = brief.goal ? ` You said the 90-day aim is: ${brief.goal}` : "";
  return {
    role: "assistant",
    text: `Your setup is in for ${brief.focus || name}.${aim} I can talk through a suggestion, how Google and WordPress connect, or why a step is worth doing. Nothing is published from this chat.`,
    note: "Using your setup brief",
  };
}

function guideReply(text, brief) {
  const lower = text.toLowerCase();
  const site = brief.hostname || "this website";
  if (/\b(admin|contact|support|talk to (a |the )?(person|team|human))\b/.test(lower)) {
    return {
      text: "I can open the contact page so you can write to the Searchify team. Mention the website and what you were trying to do. I don’t send the message myself.",
      href: "/contact",
      label: "Contact the team",
    };
  }
  if (/another google|multiple google|second google|different google|google login/.test(lower)) {
    return {
      text: `Each website can keep its own Google login. Open Manage workspace, choose Add Google account, sign in with the next login, then pick that email on the website it belongs to. Searchify switches to that login when you open the site. I can’t sign in for you.`,
      href: "/app/workspace",
      label: "Open Manage workspace",
    };
  }
  if (/another (website|site)|multiple (website|site)|add (a |another )?(website|site)/.test(lower)) {
    return {
      text: "Add a website from Manage workspace. Setup asks the same questions again, and the plan limits how many sites you can keep. Overview and Settings then follow whichever site you select.",
      href: "/app/workspace",
      label: "Open Manage workspace",
    };
  }
  if (/wordpress|publish the site|connect (my |the )?site|connect (my |the )?website/.test(lower)) {
    return {
      text: `WordPress is how an approved title and description can be published to ${site}. Open Connections and connect WordPress for that address. Connecting does not publish the page. You still approve the draft first. I can’t enter the site password for you.`,
      href: "/app/connections",
      label: "Open Connections",
    };
  }
  if (/google|search console|analytics|gsc/.test(lower)) {
    return {
      text: `Search Console shows the queries people already use to find ${site}, and Analytics shows which pages they open. Open Connections, continue with Google, then choose this website’s property. A dash on the overview stays a dash until that property is selected. I can’t sign in for you.`,
      href: "/app/connections",
      label: "Open Connections",
    };
  }
  if (/keyword/.test(lower)) {
    return {
      text: "Keywords start from what you sell and where you serve. The Keywords page loads real Google positions, monthly volume, difficulty, and new ideas for your website. Track an idea with one tap. Nothing is invented: a blank means there is no data yet.",
      href: "/app/keywords",
      label: "Open Keywords",
    };
  }
  if (/backlink|referring/.test(lower)) {
    return {
      text: "Backlinks are referring domains stored for the selected website. If the list is empty, none are stored yet. A lost link is only a cue to review it. Searchify does not disavow a link for you.",
      href: "/app/backlinks",
      label: "Open Backlinks",
    };
  }
  if (/visibility|answer engine|\bai prompt/.test(lower)) {
    return {
      text: "AI visibility is a short list of questions a customer might ask about your business. Run live checks and Searchify asks ChatGPT, Gemini, Perplexity, or Claude, then shows whether your business is named or your site is cited, with the full answer and its sources.",
      href: "/app/visibility",
      label: "Open AI visibility",
    };
  }
  if (/plan|subscription|package|billing|usage|how many site/.test(lower)) {
    return {
      text: "Subscription shows the plan and what it includes: websites, keywords, prompts, and audits. The usage line is how much of that this workspace has used. Change the plan there when you need room for another site.",
      href: "/app/billing",
      label: "Open Subscription",
    };
  }
  if (/why|benefit|what('?s| is) searchify|should i use/.test(lower)) {
    return {
      text: `Searchify prepares the next title and description for ${site} from your setup, and from Google once it is connected. You still read each card and approve it. The useful part is that the draft is ready, and the live page does not change until you say so.`,
    };
  }
  if (/approve|publish|draft|title|description|suggest/.test(lower)) {
    return {
      text: "A suggestion is a draft. Open the card to see the current title and the suggested one, plus the description. Approve keeps it for the next step. Dismiss sets it aside. Publishing happens later, and only after approval. This chat cannot publish the page.",
      href: "/app/queue",
      label: "Open the approval queue",
    };
  }
  return null;
}

function followUps(text) {
  const lower = String(text || "").toLowerCase();
  if (/google/.test(lower)) return ["Add another Google account", "How are titles and descriptions written?"];
  if (/wordpress|publish/.test(lower)) return ["What happens when I approve?", "Connect my Google account"];
  if (/keyword/.test(lower)) return ["Connect my Google account", "Explain backlinks"];
  if (/backlink/.test(lower)) return ["Explain AI visibility", "Which plan do I need?"];
  if (/visibility/.test(lower)) return ["Explain keywords", "Why should I use Searchify?"];
  if (/plan|subscription|usage/.test(lower)) return ["Add another website", "Contact the team"];
  if (/approve|title|description|draft/.test(lower)) return ["Connect WordPress", "Connect my Google account"];
  if (/why|benefit/.test(lower)) return ["Connect my Google account", "Show me the tour"];
  if (/contact|admin|support/.test(lower)) return ["Show me the tour", "Which plan do I need?"];
  return ["What should I do next?", "Show me the tour"];
}

export default function AssistantDock({ pathname }) {
  const router = useRouter();
  const { brief, site, key } = useWorkspaceSite();
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState([]);
  const [draft, setDraft] = useState("");
  const [asking, setAsking] = useState(false);
  const [decisions, setDecisions] = useState({});
  const threadRef = useRef(null);
  const name = brief.hostname || "your website";

  useEffect(() => {
    const stored = readThread(key);
    setChat(stored || [greeting(brief, name)]);
    setDraft("");
  }, [key]); // brief greeting is applied below when setup becomes ready

  useEffect(() => {
    if (!key || !brief.ready) return;
    setChat((current) => {
      if (current.length !== 1 || current[0]?.note === "Using your setup brief") return current;
      const next = [greeting(brief, name)];
      writeThread(key, next);
      return next;
    });
  }, [key, brief.ready, brief.focus, brief.goal, name]);

  useEffect(() => {
    if (!key || !chat.length || chat.some((row) => row.pending)) return;
    writeThread(key, chat);
  }, [chat, key]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const read = () => setDecisions(loadDecisions(site?.id));
    read();
    window.addEventListener("sf-preview-queue", read);
    return () => window.removeEventListener("sf-preview-queue", read);
  }, [site?.id]);

  useEffect(() => {
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [chat, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const cards = sampleCards(site);
  const guard = loadGuardrails();
  const market = brief.market || "your market";
  const offer = brief.businessType || "your business";

  const localReply = (text) => {
    const pendingCards = cards.filter((card) => !decisions[card.key]);
    const target = pendingCards[0] || cards[0];
    const lower = text.toLowerCase();
    if (target && (lower.includes("why") || lower.includes("first") || lower.includes("card") || lower.includes("suggest"))) {
      const origin = target.liveId ? "This one is from the connected page data." : "This one is from the setup brief, not Search Console yet.";
      return `I’d start with “${target.title}” on ${target.url}. Current title: “${target.before}”. Suggestion: “${target.after}”. ${origin} The brief is ${offer} in ${market}.`;
    }
    if (lower.includes("cost") || lower.includes("price") || lower.includes("how much")) {
      return "Writing the title and description is the small part. One page is under a cent. Five pages is about 3 cents, and ten pages is about 6 cents. If a draft is rewritten, that page costs about twice. That is the writing step only. If you want, I can walk you through the next card.";
    }
    if (lower.includes("next") || lower.includes("how") || lower.includes("help") || lower.includes("start")) {
      return pendingCards.length
        ? `You have ${pendingCards.length} suggestion${pendingCards.length === 1 ? "" : "s"} waiting. I’d open “${target?.title || "the first card"}” first, then dismiss it or approve it on the card. Writing again skips pages already in the queue.`
        : `For ${offer} in ${market}, connect Search Console and sync, then press Generate. You’ll get one title and one description per page. You still approve each card.`;
    }
    if (lower.includes("approve") || lower.includes("publish")) {
      return "Approving here does not publish from the chat. Use Approve draft on the card. A live recommendation still waits for the publishing step, and brief-only cards stay in review until Search Console is connected.";
    }
    const count = pendingCards.length;
    return count
      ? `There are ${count} open item${count === 1 ? "" : "s"} for ${offer} in ${market}. Want me to start with the first one, or talk through what approve does?`
      : `The brief I have is ${offer} in ${market}. This queue is clear. Connect Search Console when you want live pages in these cards.`;
  };

  const sendChat = async (event, preset) => {
    event?.preventDefault();
    const text = String(preset || draft).trim();
    if (!text || asking) return;
    if (wantsTour(text)) {
      const history = [...chat.filter((message) => !message.pending), { role: "user", text, note: "You" }];
      setDraft("");
      const next = [...history, { role: "assistant", text: "I’ll walk you through the workspace: the website, Google, drafts, keywords, backlinks, AI visibility, and the plan. Ask for the tour any time.", note: "Searchify assistance" }];
      setChat(next);
      window.dispatchEvent(new CustomEvent("sf-start-tour"));
      setOpen(false);
      return;
    }
    const guided = guideReply(text, brief);
    if (guided) {
      const history = [...chat.filter((message) => !message.pending), { role: "user", text, note: "You" }];
      setDraft("");
      setChat([...history, { role: "assistant", text: guided.text, note: "Searchify assistance", href: guided.href, label: guided.label }]);
      return;
    }
    const history = [...chat.filter((message) => !message.pending), { role: "user", text, note: "You" }];
    setDraft("");
    setAsking(true);
    setChat([...history, { role: "assistant", text: "Looking at your workspace…", note: "Searchify assistance", pending: true }]);
    const res = await askAssistant({
      messages: history.slice(-8).map((message) => ({ role: message.role, text: message.text })),
      queue: cards.slice(0, 8).map((card) => ({
        title: card.title,
        url: card.url,
        before: card.before,
        after: card.after,
        afterDescription: card.afterDescription || "",
        reason: card.reason || "",
        kind: card.kind,
        sources: card.sources || [],
        decision: decisions[card.key] || "pending",
        live: Boolean(card.liveId),
      })),
      breadth: BREADTH_LABELS[guard.breadth] || BREADTH_LABELS[1],
      mode: guard.mode === "drafts" ? "Prepare drafts automatically" : "Review every change",
    });
    const reply = res.ok && res.data?.reply ? res.data.reply : localReply(text);
    setAsking(false);
    setChat([...history, { role: "assistant", text: reply, note: "Searchify assistance" }]);
  };

  const lastUser = [...chat].reverse().find((message) => message.role === "user" && !message.pending);
  const typed = draft.trim().toLowerCase();
  const matched = PROMPTS.filter((item) => {
    if (!typed) return false;
    if (typed.length < 2) return false;
    return item.q.toLowerCase().includes(typed) || item.keys.some((word) => word.includes(typed));
  });
  const suggestions = (typed ? matched : lastUser ? [] : PROMPTS.slice(0, 4)).slice(0, 4);
  const nextQuestions = !typed && lastUser ? followUps(lastUser.text) : [];

  const clearChat = () => {
    const next = [greeting(brief, name)];
    setChat(next);
    writeThread(key, next);
  };

  return (
    <>
      {open ? <button className="assistant-backdrop" type="button" aria-label="Close assistant" onClick={() => setOpen(false)} /> : null}
      <section className={`assistant-sheet${open ? " is-open" : ""}`} aria-hidden={open ? undefined : true} inert={open ? undefined : true} aria-label="Ask Searchify">
        <div className="assistant-sheet-head">
          <span className="mobile-more-handle" aria-hidden="true" />
          <div>
            <div className="dash-eyebrow">CONTEXTUAL ASSISTANT</div>
            <h2>Ask Searchify</h2>
          </div>
          <div className="assistant-sheet-actions">
            <button type="button" onClick={clearChat}>Clear</button>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant">×</button>
          </div>
        </div>
        <div className="chat-messages" aria-live="polite" ref={threadRef}>
          {chat.map((message, index) => (
            <div className={`message ${message.role}${message.pending ? " pending" : ""}`} key={`${message.role}-${index}`}>
              {message.role === "assistant" ? <span className="message-mark">s</span> : null}
              <div>
                <p>{message.text}</p>
                {message.href ? <button type="button" className="assistant-jump" onClick={() => { setOpen(false); router.push(message.href); }}>{message.label}</button> : null}
                {message.pending ? null : <small>{message.note}</small>}
              </div>
            </div>
          ))}
        </div>
        {suggestions.length ? (
          <div className="assistant-suggest" aria-label="Suggested questions">
            {suggestions.map((item, index) => (
              <button key={item.q} type="button" className={index === 0 && typed ? "is-best" : undefined} onClick={() => sendChat(null, item.q)}>{item.q}</button>
            ))}
          </div>
        ) : null}
        {nextQuestions.length ? (
          <div className="assistant-suggest" aria-label="Next questions">
            <span className="assistant-next">Next</span>
            {nextQuestions.map((item) => (
              <button key={item} type="button" onClick={() => sendChat(null, item)}>{item}</button>
            ))}
          </div>
        ) : null}
        <form className="chat-form" onSubmit={sendChat}>
          <label className="sr-only" htmlFor="assistant-input">Ask Searchify</label>
          <textarea
            id="assistant-input"
            rows={1}
            placeholder="Ask, or start typing a question…"
            value={draft}
            disabled={asking}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendChat(event);
              }
            }}
          />
          <button type="submit" disabled={asking || !draft.trim()}>{asking ? "…" : "Send"} <span aria-hidden="true">↗</span></button>
        </form>
        <p className="chat-note">Kept for this visit. Approving a card still does not publish the website.</p>
      </section>
      <button className="assistant-fab" type="button" data-tour="assistant" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true">s</span>
        Ask
      </button>
    </>
  );
}
