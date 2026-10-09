"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { userIsAuthenticated } from "@/utils/users/Helpers";
import { completeDraft, draftForSetup, loadJourney, markConnection, profileFromAnswers, saveDraft } from "@/lib/journey";
import { saveBusinessProfile } from "@/lib/v1Api";
import { QUESTIONS } from "@/components/guide/questions";
import ConnectDialog from "@/components/board/ConnectDialog";

function validUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function GuidedSetup() {
  const reduce = useReducedMotion();
  const router = useRouter();
  const params = useSearchParams();
  const isNew = params.get("new") === "1";
  const googleBack = params.get("google");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  useEffect(() => {
    if (!userIsAuthenticated()) {
      router.replace("/login");
      return;
    }
    const draft = draftForSetup(isNew);
    if (!draft) {
      router.replace("/app");
      return;
    }
    const nextAnswers = { ...(draft.answers || {}) };
    if (googleBack === "connected") {
      nextAnswers.gsc = "Connected";
      nextAnswers.ga = nextAnswers.ga || "Connected";
      markConnection("gsc", "Connected");
      markConnection("ga", nextAnswers.ga);
    }
    setAnswers(nextAnswers);
    setIndex(Math.min(Number(draft.step) || 0, QUESTIONS.length - 1));
    setReady(true);
  }, [googleBack, isNew, router]);

  const question = QUESTIONS[index];
  const total = QUESTIONS.length;

  const advance = (nextAnswers, from) => {
    const current = QUESTIONS[from];
    const value = nextAnswers[current.key];
    if (current.required && current.inputType === "url" && !validUrl(String(value || "").trim())) {
      setError("Enter a full website address, including https://");
      return;
    }
    if (current.required && !String(value || "").trim()) {
      setError("Add an answer to continue.");
      return;
    }
    setError("");
    saveDraft(nextAnswers, from + 1);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (current.last || from === total - 1) {
      saveBusinessProfile(profileFromAnswers(nextAnswers)).catch(() => {});
      router.push(completeDraft(nextAnswers));
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      setIndex(from + 1);
      setLoading(false);
    }, reduce ? 0 : 420);
  };

  const choose = (title) => {
    const next = { ...answers, [question.key]: title };
    setAnswers(next);
    advance(next, index);
  };

  const connect = (value) => {
    const next = { ...answers, [question.key]: value };
    setAnswers(next);
    advance(next, index);
  };

  const submitText = () => {
    const field = document.getElementById("answer-input");
    const value = field ? field.value.trim() : String(answers[question.key] || "").trim();
    const next = { ...answers, [question.key]: value };
    setAnswers(next);
    advance(next, index);
  };

  if (!ready) return <div className="sf-guide" />;

  return (
    <div className="sf-guide">
      <main className="shell">
        <header className="topbar">
          <Link className="brand" href="/" aria-label="Searchify home">
            <span className="mark">s</span>
            <span>searchify</span>
          </Link>
          <div className="topmeta">
            <span>{isNew ? "New website" : "Setup"}</span>
            <button className="skip-all" type="button" onClick={() => { saveBusinessProfile(profileFromAnswers(answers)).catch(() => {}); router.push(completeDraft(answers)); }}>
              Skip questionnaire <span aria-hidden="true">↗</span>
            </button>
          </div>
        </header>
        <section className="onboard" aria-label="Searchify setup">
          <div className="progresshead">
            <div>
              <span className="step-label">QUESTION {String(index + 1).padStart(2, "0")} / {total}</span>
              <span className="step-caption">{question.section}</span>
            </div>
            <span className="progress-percent">{index} / {total} answered</span>
          </div>
          <ol className="progress-lights" aria-label="Question progress">
            {QUESTIONS.map((item, itemIndex) => {
              const complete = itemIndex < index;
              const current = itemIndex === index;
              return (
                <li
                  key={item.key}
                  className={`progress-light${complete ? " is-complete" : ""}${current ? " is-current" : ""}`}
                  aria-current={current ? "step" : undefined}
                >
                  <span className="light-dot" aria-hidden="true" />
                  <span className="light-number" aria-hidden="true">{itemIndex + 1}</span>
                </li>
              );
            })}
          </ol>
          <AnimatePresence mode="wait">
          <motion.div
            className="question-wrap"
            key={question.key}
            initial={reduce ? false : { opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -20 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="eyebrow">{question.last ? "LAST THING!" : question.section}</div>
            <h1 className="question-title">{question.question}</h1>
            <p className="question-desc">{error || question.note}</p>
            {question.type === "choice" ? (
              <>
                <div className="response-grid" role="group" aria-label={question.question}>
                  {question.options.map(([title, icon, note]) => (
                    <button
                      key={title}
                      className="answer-option"
                      type="button"
                      aria-pressed={answers[question.key] === title}
                      onClick={() => choose(title)}
                    >
                      <span className="option-icon" aria-hidden="true">{icon}</span>
                      <span>
                        <span className="option-title">{title}</span>
                        <span className="option-note">{note}</span>
                      </span>
                    </button>
                  ))}
                </div>
                {question.key === "industry" ? (
                  <div className="policy-note">
                    <strong>Search policy context: </strong>
                    Google Ads policies and organic Search policies differ. This answer is a review cue, not an eligibility decision.
                  </div>
                ) : null}
              </>
            ) : null}
            {question.type === "text" ? (
              <>
                <input
                  className="answer-field"
                  id="answer-input"
                  type={question.inputType || "text"}
                  inputMode={question.inputType === "url" ? "url" : undefined}
                  defaultValue={answers[question.key] || ""}
                  key={`${question.key}-${index}`}
                  placeholder={question.placeholder}
                  aria-label={question.question}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitText();
                    }
                  }}
                />
                <p className="fieldnote">{question.optional ? "Optional · you can skip this." : "You can edit this later."}</p>
              </>
            ) : null}
            {question.type === "connect" ? (
              <>
                <div className="connection-card">
                  <span className="connection-mark" aria-hidden="true">{question.icon}</span>
                  <div>
                    <h3>{question.title}</h3>
                    <p>{question.body}</p>
                    <div className="connection-actions">
                      <button className="connection-action" type="button" onClick={() => setConnectOpen(true)}>
                        {question.action}
                      </button>
                      <button className="connection-action secondary" type="button" onClick={() => connect("Connect later")}>
                        I’ll connect later
                      </button>
                    </div>
                    {question.providerNote ? <p className="provider-note">{question.providerNote}</p> : null}
                  </div>
                </div>
                <p className="demo-note">If you skip this, open Connections in the dashboard and finish it there. Nothing is published until you approve it.</p>
              </>
            ) : null}
          </motion.div>
          </AnimatePresence>
          <div className="bottomrow">
            <button className="backbtn" type="button" disabled={index === 0} onClick={() => { setError(""); setIndex((value) => Math.max(0, value - 1)); }}>
              Back
            </button>
            {question.type === "text" ? (
              <button className="continuebtn" type="button" onClick={submitText}>
                {question.last ? (loadJourney().planId ? "Open my dashboard" : "See plans") : "Continue"} <span aria-hidden="true">↗</span>
              </button>
            ) : (
              <span />
            )}
          </div>
          <div className="trustline">
            <span className="shield" aria-hidden="true">✓</span>
            You can edit your answers later. Searchify asks when it lacks enough context.
          </div>
        </section>
        <footer className="foot">
          <span>SEARCHIFY · GUIDED SETUP</span>
          <span>Find a need. Understand it. Review before action.</span>
        </footer>
      </main>
      {loading ? (
        <div className="loader" role="status">
          <div>
            <span className="loader-ring" aria-hidden="true" />
            <div className="loader-title">Adding context…</div>
            <div className="loader-sub">{index < 3 ? "Just a little more context" : index < 8 ? "Adding context to your working brief" : "Almost there"}</div>
          </div>
        </div>
      ) : null}
      {connectOpen && question?.type === "connect" ? (
        <ConnectDialog
          provider={question.key === "wordpress" ? "wordpress" : "gsc"}
          siteUrl={answers.site || ""}
          onClose={() => setConnectOpen(false)}
          onDone={(value) => {
            setConnectOpen(false);
            connect(value);
          }}
        />
      ) : null}
    </div>
  );
}
