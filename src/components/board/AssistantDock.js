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
  { q: "What should I do next?", keys: ["next", "start", "help", "what should", "begin"] },
  { q: "Why should I use Searchify?", keys: ["why", "benefit", "searchify", "use", "help me"] },
  { q: "Connect my Google account", keys: ["google", "search console", "analytics", "gsc", "connect"] },
  { q: "Add another Google account", keys: ["another google", "multiple google", "second account", "google login"] },
  { q: "Connect WordPress", keys: ["wordpress", "publish", "website connect", "wp"] },
  { q: "Add another website", keys: ["another site", "multiple site", "add website", "second website"] },
  { q: "How are titles and descriptions written?", keys: ["title", "description", "generate", "draft", "suggestion"] },
  { q: "What happens when I approve?", keys: ["approve", "publish", "live", "draft"] },
  { q: "Walk me through keywords", keys: ["keyword", "query", "rank"] },
  { q: "Walk me through backlinks", keys: ["backlink", "referring", "link"] },
  { q: "Walk me through AI visibility", keys: ["visibility", "ai ", "prompt", "answer engine"] },
  { q: "Which plan fits me?", keys: ["plan", "subscription", "usage", "billing", "package"] },
  { q: "Contact the team", keys: ["admin", "contact", "support", "person", "help me talk"] },
  { q: "Show me the tour", keys: ["tour", "guide", "show me"] },
];

function greeting(brief, name) {
  if (!brief.ready) {
    return {
      role: "assistant",
      text: `Hi — I’m Searchify assistance, right here with you on ${name}. Think of me as a calm co-pilot: I can draft a clearer title and description from your setup, then wait for your say-so. Ask me anything, tap a suggestion below, or say “what should I do next?” Nothing goes live from this chat.`,
      note: "Searchify assistance",
    };
  }
  const aim = brief.goal ? ` Your 90-day aim — “${brief.goal}” — is already in mind.` : "";
  return {
    role: "assistant",
    text: `Welcome back. I’ve got your setup for ${brief.focus || name}.${aim} Ask about a draft, Google, WordPress, keywords, or the next gentle step — I’ll keep it clear, honest, and unhurried. Nothing is published from this chat.`,
    note: "Using your setup brief",
  };
}

function guideReply(text, brief) {
  const lower = text.toLowerCase();
  const site = brief.hostname || "this website";
  if (/\b(admin|contact|support|talk to (a |the )?(person|team|human))\b/.test(lower)) {
    return {
      text: "Of course — I can open the contact page so you can write to the Searchify team. Mention the website and what you were hoping to finish; that helps them help you. I don’t send the message myself.",
      href: "/contact",
      label: "Contact the team",
    };
  }
  if (/another google|multiple google|second google|different google|google login/.test(lower)) {
    return {
      text: `Each website can keep its own Google login — neat and separate. Open Manage workspace, choose Add Google account, sign in with the next login, then attach that email to the site it belongs to. Searchify switches with you when you open the site. I can’t sign in for you, but I’ll keep the path clear.`,
      href: "/app/workspace",
      label: "Open Manage workspace",
    };
  }
  if (/another (website|site)|multiple (website|site)|add (a |another )?(website|site)/.test(lower)) {
    return {
      text: "Add another website from Manage workspace — setup asks the same calm questions again. Your plan sets how many sites you can keep. Overview and Settings then follow whichever site you select.",
      href: "/app/workspace",
      label: "Open Manage workspace",
    };
  }
  if (/wordpress|publish the site|connect (my |the )?site|connect (my |the )?website/.test(lower)) {
    return {
      text: `WordPress is the bridge from an approved draft to ${site}. Open Connections and connect WordPress for that address — connecting alone never publishes. You still approve the draft first. I can’t enter the password for you.`,
      href: "/app/connections",
      label: "Open Connections",
    };
  }
  if (/google|search console|analytics|gsc/.test(lower)) {
    return {
      text: `Search Console shows the searches people already use to find ${site}; Analytics shows which pages they open. Open Connections, continue with Google, then choose this website’s property. A dash on the overview stays a dash until that property is selected — honest, not empty inventing. I can’t sign in for you.`,
      href: "/app/connections",
      label: "Open Connections",
    };
  }
  if (/keyword/.test(lower)) {
    return {
      text: "Keywords grow from what you sell and where you serve. The Keywords page loads real Google positions, monthly volume, difficulty, and fresh ideas — nothing invented. A blank simply means there’s no data yet. Want me to open it?",
      href: "/app/keywords",
      label: "Open Keywords",
    };
  }
  if (/backlink|referring/.test(lower)) {
    return {
      text: "Backlinks are the referring domains stored for the selected website. An empty list means none are stored yet — not a failure. A lost link is a gentle cue to review; Searchify never disavows for you.",
      href: "/app/backlinks",
      label: "Open Backlinks",
    };
  }
  if (/visibility|answer engine|\bai prompt/.test(lower)) {
    return {
      text: "AI visibility is a short, curious list of questions a customer might ask about your business. Live checks ask ChatGPT, Gemini, Perplexity, or Claude, then show whether you’re named or cited — with the full answer and its sources.",
      href: "/app/visibility",
      label: "Open AI visibility",
    };
  }
  if (/plan|subscription|package|billing|usage|how many site/.test(lower)) {
    return {
      text: "Subscription shows your plan — websites, keywords, prompts, and audits — plus what this workspace has already used. Change the package when you need room for another site. Happy to help you choose a path.",
      href: "/app/billing",
      label: "Open Subscription",
    };
  }
  if (/why|benefit|what('?s| is) searchify|should i use/.test(lower)) {
    return {
      text: `Searchify prepares a clearer title and description for ${site} from your setup — and from Google once it’s connected. You still read each card and approve it. The useful part: the draft is ready, and the live page stays untouched until you say so.`,
    };
  }
  if (/approve|publish|draft|title|description|suggest/.test(lower)) {
    return {
      text: "A suggestion is just a draft — open the card to compare the current title with the proposed one, plus the description. Approve keeps it for the next step; dismiss sets it aside. Publishing happens later, and only after approval. This chat never publishes the page.",
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
  if (/keyword/.test(lower)) return ["Connect my Google account", "Walk me through backlinks"];
  if (/backlink/.test(lower)) return ["Walk me through AI visibility", "Which plan fits me?"];
  if (/visibility/.test(lower)) return ["Walk me through keywords", "Why should I use Searchify?"];
  if (/plan|subscription|usage/.test(lower)) return ["Add another website", "Contact the team"];
  if (/approve|title|description|draft/.test(lower)) return ["Connect WordPress", "Connect my Google account"];
  if (/why|benefit/.test(lower)) return ["What should I do next?", "Show me the tour"];
  if (/contact|admin|support/.test(lower)) return ["Show me the tour", "Which plan fits me?"];
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
      return "Happy to demystify that. Writing is the light part — under a cent for one page, about 3 cents for five, about 6 cents for ten. A rewrite is roughly twice. That’s only the writing step; this chat never publishes. Want me to walk you through the next card?";
    }
    if (lower.includes("next") || lower.includes("how") || lower.includes("help") || lower.includes("start")) {
      return pendingCards.length
        ? `You have ${pendingCards.length} suggestion${pendingCards.length === 1 ? "" : "s"} waiting — lovely progress. I’d open “${target?.title || "the first card"}” first, then keep or dismiss it on the card. Writing again skips pages already in the queue.`
        : `For ${offer} in ${market}, a calm next step is Connections: pick Search Console, sync, then press Generate. You’ll get one title and one description per page — and you still approve each card.`;
    }
    if (lower.includes("approve") || lower.includes("publish")) {
      return "Good instinct to check — approving here never publishes the site. Use Approve draft on the card. Live recommendations still wait for a separate publishing step, and brief-only cards stay in review until Search Console is connected.";
    }
    const count = pendingCards.length;
    return count
      ? `There are ${count} open item${count === 1 ? "" : "s"} for ${offer} in ${market}. Want me to start with the first one, or talk through what approve does — no rush either way?`
      : `I’ve got your brief for ${offer} in ${market}, and the queue is quiet. Connect Search Console when you’re ready for live pages in these cards — I’ll stay with you.`;
  };

  const sendChat = async (event, preset) => {
    event?.preventDefault();
    const text = String(preset || draft).trim();
    if (!text || asking) return;
    if (wantsTour(text)) {
      const history = [...chat.filter((message) => !message.pending), { role: "user", text, note: "You" }];
      setDraft("");
      const next = [...history, { role: "assistant", text: "Gladly — I’ll walk you through the workspace: the website, Google, drafts, keywords, backlinks, AI visibility, and the plan. Ask for the tour any time; I’m happy to start again.", note: "Searchify assistance" }];
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
    setChat([...history, { role: "assistant", text: "One moment — I’m looking at your workspace…", note: "Searchify assistance", pending: true }]);
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
            <div className="dash-eyebrow">YOUR GUIDE</div>
            <h2>Ask Searchify</h2>
          </div>
          <div className="assistant-sheet-actions">
            <button type="button" onClick={clearChat}>Fresh chat</button>
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
            <span className="assistant-next">You might ask</span>
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
            placeholder="Ask anything — or start typing…"
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
        <p className="chat-note">Kept for this visit. Approving a card still never publishes the website — you’re always in control.</p>
      </section>
      <button className="assistant-fab" type="button" data-tour="assistant" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true">s</span>
        Ask
      </button>
    </>
  );
}
