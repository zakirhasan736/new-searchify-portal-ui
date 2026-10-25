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
    all[key] = rows.filter((row) => !row.pending && !row.typing).slice(-40);
    sessionStorage.setItem(STORE, JSON.stringify(all));
  } catch {
    /* session storage can be full or blocked */
  }
}

const PROMPTS = [
  { q: "What should I do next?", keys: ["next", "start", "help", "what should", "begin"] },
  { q: "Did clicks and reach increase this week?", keys: ["click", "reach", "impression", "increased", "traffic", "this week"] },
  { q: "How do I regenerate a stronger listing?", keys: ["regenerate", "rewrite", "generate again", "stronger listing", "new draft"] },
  { q: "Why is this suggestion weaker than the live title?", keys: ["weaker", "stronger", "current better", "live title", "suggestion"] },
  { q: "How do I skip to the next approval?", keys: ["skip", "next card", "arrow", "cycle", "without approve"] },
  { q: "Connect my Google account", keys: ["google", "search console", "analytics", "gsc", "connect"] },
  { q: "Add another Google account", keys: ["another google", "multiple google", "second account", "google login"] },
  { q: "Connect WordPress", keys: ["wordpress", "publish", "website connect", "wp"] },
  { q: "Add another website", keys: ["another site", "multiple site", "add website", "second website"] },
  { q: "How are titles and descriptions written?", keys: ["title", "description", "generate", "draft", "williams", "competitor"] },
  { q: "What happens when I approve?", keys: ["approve", "publish", "live", "draft"] },
  { q: "Walk me through keywords", keys: ["keyword", "query", "rank"] },
  { q: "Open the month plan", keys: ["month", "content plan", "monthly", "calendar"] },
  { q: "Open the phone report", keys: ["phone", "pwa", "weekly report", "alerts"] },
  { q: "Walk me through backlinks", keys: ["backlink", "referring", "link"] },
  { q: "Walk me through AI visibility", keys: ["visibility", "ai ", "prompt", "answer engine"] },
  { q: "Which plan fits me?", keys: ["plan", "subscription", "usage", "billing", "package"] },
  { q: "Contact the team", keys: ["admin", "contact", "support", "person", "help me talk"] },
  { q: "Show me the tour", keys: ["tour", "guide", "show me"] },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function greeting(brief, name) {
  if (!brief.ready) {
    return {
      role: "assistant",
      text: `Hey — I’m your Searchify SEO guide for ${name}. Think of me as the friendly SEO person who’s done this for years on WordPress, Webflow, Shopify, and custom sites: titles, descriptions, Open Graph, technical checks, the works. Ask me anything, or tap a suggestion. Nothing goes live from this chat.`,
      note: "Searchify assistance",
    };
  }
  const aim = brief.goal ? ` We’re still aimed at “${brief.goal}”.` : "";
  return {
    role: "assistant",
    text: `Welcome back — ${brief.focus || name} is ready.${aim} I’m here as your SEO guy: drafts, keywords, clicks, audits, Open Graph, whatever you need next. Ask freely. Nothing is published from this chat.`,
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
  if (/skip|next (card|approval|update)|arrow key|cycle|without (approv|reject)/.test(lower)) {
    return {
      text: "You do not have to approve or reject to move on. On the review card use Previous or Skip, or press the left and right arrow keys when you are not typing. Reject also opens the next waiting card when one is left.",
      href: "/app/queue",
      label: "Open the approval queue",
    };
  }
  if (/\bjev\b|judge|evaluate|verify score/.test(lower)) {
    return {
      text: "JEV is Searchify’s own draft judge — Judge, Evaluate, Verify. It scores the listing package on the approval card (keyword fit, beat-live, not a paste). DataForSEO is separate: that is Searchify SEO research for keywords, competitors, and content drafts. Human approval still ships the change.",
      href: "/app/queue",
      label: "Open the approval queue",
    };
  }
  if (/regenerate|rewrite|generate again|stronger listing|new draft/.test(lower)) {
    return {
      text: "Open the approval card and tap Regenerate listing package. That re-analyzes keyword and competitors, replaces the draft, keeps Open Graph and JSON-LD on the same words, and runs JEV. Compare it to the live listing — approve only when it beats live. Nothing publishes from that tap.",
      href: "/app/queue",
      label: "Open the approval queue",
    };
  }
  if (/weaker|stronger|current better|live (title|one) better|prefer (the )?current|not as good/.test(lower)) {
    return {
      text: "Keep the live title when it is already stronger. Skip or reject the card. Load Keywords first, then regenerate so the package beats the live listing on a real keyword — Open Graph and JSON-LD stay on the same words.",
      href: "/app/queue",
      label: "Open the approval queue",
    };
  }
  if (/williams|sonoma|wrong competitor|meet .*on|cooking class|kitchen store/.test(lower)) {
    return {
      text: "That “Written to meet …” line should only name a competitor that sells the same kind of thing on the same keyword. A kitchen store or Places listing next door is not a web-design rival. Skip that card and regenerate the draft so the reason stays on a real competitor — or none, if none share the keyword.",
      href: "/app/queue",
      label: "Open the approval queue",
    };
  }
  if (/month|content plan|monthly email/.test(lower)) {
    return {
      text: "Month lists stored keyword ideas that Search Console does not already cover, with draft status and a date you choose. A date does not publish. You can copy the monthly email from that page; a drop in clicks stays in the text when the latest 14 days are lower.",
      href: "/app/month",
      label: "Open Month",
    };
  }
  if (/phone|pwa|home screen|push|alert/.test(lower)) {
    return {
      text: "The workspace uses the same login on a phone. Home shows the next move, and the approval queue holds anything waiting. A tap opens a card. It does not publish.",
      href: "/app",
      label: "Open the workspace",
    };
  }
  if (/keyword/.test(lower)) {
    return {
      text: "Keywords grow from what you sell and where you serve. The Keywords page loads real Google positions, monthly volume, difficulty, and fresh ideas from Searchify SEO research — nothing invented. A blank means nothing is stored yet.",
      href: "/app/keywords",
      label: "Open Keywords",
    };
  }
  if (/backlink|referring/.test(lower)) {
    return {
      text: "Backlinks are the referring domains stored for the selected website. An empty list means none are stored yet — not a failure. A lost link is a review cue; Searchify never disavows for you.",
      href: "/app/backlinks",
      label: "Open Backlinks",
    };
  }
  if (/visibility|answer engine|\bai prompt/.test(lower)) {
    return {
      text: "AI visibility is a short list of questions a customer might ask about your business. Live checks ask the connected answer engines, then show whether you are named or cited — with the answer and its sources.",
      href: "/app/visibility",
      label: "Open AI visibility",
    };
  }
  if (/plan|subscription|package|billing|usage|how many site/.test(lower)) {
    return {
      text: "Subscription shows your plan — websites, keywords, prompts, and audits — plus what this workspace has already used. Change the package when you need room for another site. Changing the package label does not reset your website limit.",
      href: "/app/billing",
      label: "Open Subscription",
    };
  }
  if (/why|benefit|what('?s| is) searchify|should i use/.test(lower)) {
    return {
      text: `Searchify prepares a clearer title and description for ${site} from your setup, the live page, Search Console, and Searchify SEO research. You still compare each card to the live listing and approve only what is stronger. The live page stays untouched until you say so.`,
    };
  }
  if (/approve|publish|draft|title|description|suggest|how.*(written|generat)/.test(lower)) {
    return {
      text: "Connect Google, let Searchify draft the listing package, then open the card. Compare live vs suggested — title, description, Open Graph, JSON-LD. Regenerate until it beats live, or Skip. Approve only what you ship. Next week check clicks and reach in Search Console. This chat never publishes.",
      href: "/app/queue",
      label: "Open the approval queue",
    };
  }
  return null;
}

function followUps(text) {
  const lower = String(text || "").toLowerCase();
  if (/google/.test(lower)) return ["How are titles and descriptions written?", "Walk me through keywords"];
  if (/wordpress|publish/.test(lower)) return ["What happens when I approve?", "Connect my Google account"];
  if (/keyword/.test(lower)) return ["Open the month plan", "How do I skip to the next approval?"];
  if (/month|phone/.test(lower)) return ["What should I do next?", "How do I skip to the next approval?"];
  if (/skip|weaker|stronger|williams|competitor|regenerate/.test(lower)) return ["How do I regenerate a stronger listing?", "Did clicks and reach increase this week?"];
  if (/backlink/.test(lower)) return ["Walk me through AI visibility", "Which plan fits me?"];
  if (/visibility/.test(lower)) return ["Walk me through keywords", "Open the phone report"];
  if (/click|reach|impression|traffic|week/.test(lower)) return ["How do I regenerate a stronger listing?", "What should I do next?"];
  if (/plan|subscription|usage/.test(lower)) return ["Add another website", "Contact the team"];
  if (/approve|title|description|draft/.test(lower)) return ["How do I regenerate a stronger listing?", "How do I skip to the next approval?"];
  if (/why|benefit/.test(lower)) return ["What should I do next?", "Show me the tour"];
  if (/contact|admin|support/.test(lower)) return ["Show me the tour", "Which plan fits me?"];
  return ["Did clicks and reach increase this week?", "How do I regenerate a stronger listing?"];
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
  const typingRef = useRef(0);
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

  const revealReply = async (history, reply, extras = {}) => {
    const token = (typingRef.current += 1);
    const full = String(reply || "").trim() || "I could not finish that answer. Try again in a moment.";
    setAsking(true);
    setChat([...history, { role: "assistant", text: "", note: "Searchify assistance", pending: true, typing: true }]);
    await sleep(450);
    if (typingRef.current !== token) return;
    let shown = "";
    const step = full.length > 280 ? 4 : full.length > 140 ? 3 : 2;
    for (let index = 0; index < full.length; index += step) {
      if (typingRef.current !== token) return;
      shown = full.slice(0, index + step);
      setChat([...history, { role: "assistant", text: shown, note: "Searchify assistance", typing: true }]);
      await sleep(18);
    }
    if (typingRef.current !== token) return;
    const finalRow = { role: "assistant", text: full, note: "Searchify assistance", ...extras };
    setChat([...history, finalRow]);
    setAsking(false);
  };

  const sendChat = async (event, preset) => {
    event?.preventDefault();
    const text = String(preset || draft).trim();
    if (!text || asking) return;
    const history = [...chat.filter((message) => !message.pending && !message.typing), { role: "user", text, note: "You" }];
    setDraft("");
    if (wantsTour(text)) {
      await revealReply(history, "Gladly — I’ll walk you through the workspace: the website, Google, drafts, keywords, backlinks, AI visibility, and the plan. Ask for the tour any time; I’m happy to start again.");
      window.dispatchEvent(new CustomEvent("sf-start-tour"));
      setOpen(false);
      return;
    }
    const guided = guideReply(text, brief);
    if (guided) {
      await revealReply(history, guided.text, { href: guided.href, label: guided.label });
      return;
    }
    setAsking(true);
    setChat([...history, { role: "assistant", text: "", note: "Searchify assistance", pending: true, typing: true }]);
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
    await revealReply(history, reply);
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
    typingRef.current += 1;
    const next = [greeting(brief, name)];
    setChat(next);
    setAsking(false);
    writeThread(key, next);
  };

  return (
    <>
      {open ? <button className="assistant-backdrop" type="button" aria-label="Close assistant" onClick={() => setOpen(false)} /> : null}
      <section className={`assistant-sheet${open ? " is-open" : ""}`} aria-hidden={open ? undefined : true} inert={open ? undefined : true} aria-label="Ask Searchify">
        <div className="assistant-sheet-head">
          <span className="mobile-more-handle" aria-hidden="true" />
          <div>
            <div className="dash-eyebrow">YOUR SEO GUIDE</div>
            <h2>Ask your SEO guy.</h2>
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
                {message.pending || (message.typing && !message.text) ? (
                  <p className="assistant-typing" aria-label="Assistant is typing"><span /><span /><span /></p>
                ) : (
                  <p>{message.text}{message.typing ? <span className="assistant-caret" aria-hidden="true" /> : null}</p>
                )}
                {!message.pending && !message.typing && message.href ? <button type="button" className="assistant-jump" onClick={() => { setOpen(false); router.push(message.href); }}>{message.label}</button> : null}
                {message.pending || message.typing ? null : <small>{message.note}</small>}
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
            placeholder="Ask about clicks, drafts, Skip, Google…"
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
        <p className="chat-note">Kept for this visit. Skip moves between cards without publishing. This chat never changes the live site.</p>
      </section>
      <button className="assistant-fab" type="button" data-tour="assistant" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true">s</span>
        Ask
      </button>
    </>
  );
}
