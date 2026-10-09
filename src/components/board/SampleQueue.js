"use client";

import { useEffect, useState } from "react";
import { briefFromAnswers } from "@/lib/businessBrief";
import { loadDecisions, sampleCards, savePreviewDecision } from "@/lib/previewQueue";

export default function SampleQueue({ site }) {
  const [decisions, setDecisions] = useState({});
  const cards = sampleCards(site);
  const brief = briefFromAnswers(site?.answers);

  useEffect(() => {
    const read = () => setDecisions(loadDecisions(site?.id));
    read();
    window.addEventListener("sf-preview-queue", read);
    return () => window.removeEventListener("sf-preview-queue", read);
  }, [site?.id]);

  const pending = cards.filter((card) => !decisions[card.key]).length;
  const decide = (card, decision) => {
    if (decisions[card.key]) return;
    setDecisions(savePreviewDecision(card, decision, site?.id));
  };

  return (
    <section className="queue-panel" id="queue-panel" data-tour="queue" aria-labelledby="queue-title">
      <div className="queue-header">
        <div>
          <div className="dash-eyebrow">THE OPERATOR QUEUE</div>
          <h2 id="queue-title">Ready for your review</h2>
        </div>
        <span className="pending-count" id="pending-count">{pending ? `${pending} to review` : "Queue reviewed"}</span>
      </div>
      <div className="signal-flow">
        <div className="signal-sources"><span>Search Console</span><span>Page content</span><span>Business brief</span></div>
        <div className="signal-line" aria-hidden="true"><i /></div>
        <p>{`These drafts are for ${brief.hostname || "the website selected above"}.`} <span>Nothing is published yet.</span></p>
      </div>
      <div className="task-list" id="task-list">
        {cards.map((card) => {
          const decision = decisions[card.key];
          return (
            <article className={`task-card${decision ? " decided" : ""}`} key={card.key} data-decision={decision || "pending"}>
              <div className="task-meta">
                <span className="task-kind">{card.kind}</span>
                <span className="task-state">{decision === "approved" ? "Approved · preview" : decision === "dismissed" ? "Dismissed" : "Needs review"}</span>
              </div>
              <h3 className="task-title">{card.title}</h3>
              <p className="task-url">{card.url}</p>
              <div className="change-pair">
                <div className="change-cell"><small>Current / known</small><span>{card.before}</span></div>
                <div className="change-cell suggested"><small>Suggested next step</small><span>{card.after}</span></div>
              </div>
              <div className="evidence-row">
                <span className="source-caption">WHY IT APPEARED</span>
                {card.sources.map((source) => <span key={source}>{source}</span>)}
              </div>
              {decision ? (
                <div className="decision-note">
                  {decision === "approved"
                    ? "Approved in this preview. A live product would now wait for its publishing confirmation."
                    : "Dismissed in this preview. This will not appear in the active queue."}
                </div>
              ) : (
                <div className="task-actions">
                  <button className="deny" type="button" onClick={() => decide(card, "dismissed")}>Dismiss</button>
                  <button className="approve" type="button" onClick={() => decide(card, "approved")}>Approve draft</button>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <p className="queue-footnote">Approving or dismissing here records your decision for this session. No site content is published.</p>
    </section>
  );
}
