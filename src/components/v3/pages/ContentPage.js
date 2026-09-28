"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Btn, Hero, useV3Toast } from "@/components/v3/V3Shell";
import { createAiDraft } from "@/lib/clientApi";
import { getBusinessProfile, loadFeature } from "@/lib/v1Api";

const TABS = [
  { id: "Brief", path: "/app/content" },
  { id: "Draft", path: "/app/content/draft" },
  { id: "Library", path: "/app/content/library" },
];

const DRAFT_KEY = "sf_content_draft";
const SAVED_KEY = "sf_content_saved";

export default function ContentPage({ screen = "Brief" }) {
  const toast = useV3Toast();
  const router = useRouter();
  const pathname = usePathname();
  const [topicParam, setTopicParam] = useState("");
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState("");
  const [profile, setProfile] = useState({});
  const [topics, setTopics] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("topic") || "";
      setTopicParam(q);
    } catch {
      /* ignore */
    }
  }, [pathname]);

  useEffect(() => {
    getBusinessProfile().then((r) => setProfile(r.data?.profile || {}));
    loadFeature("organic-search").then((f) => {
      const rows = f?.data?.payload?.rows || f?.data?.rows || [];
      const list = rows.slice(0, 6).map((r) => String(r[0]));
      setTopics(topicParam ? [topicParam, ...list.filter((t) => t !== topicParam)] : list);
    });
    try {
      setDraft(localStorage.getItem(DRAFT_KEY) || "");
      setSaved(localStorage.getItem(SAVED_KEY) || "");
    } catch {
      /* ignore */
    }
  }, [topicParam]);

  useEffect(() => {
    try {
      if (draft) localStorage.setItem(DRAFT_KEY, draft);
    } catch {
      /* ignore */
    }
  }, [draft]);

  const active = TABS.find((t) => t.id === screen)?.id || "Brief";
  const mainTopic = topicParam || topics[0] || "";

  const prepareDraft = async () => {
    if (!mainTopic) {
      toast("Pick a live Search Console topic first, or add one in Keywords.");
      return;
    }
    setBusy(true);
    const brief = `Write a practical guide draft.\nBusiness: ${profile.business || ""}\nServices: ${profile.services || ""}\nAreas: ${profile.areas || ""}\nRules: ${profile.rules || "No invented claims."}\nTopic: ${mainTopic}\nKeep factual. Editorial draft only. Use only the facts given.`;
    const res = await createAiDraft({ kind: "article", brief, writingType: "Content draft", tokens: 900 });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      toast(data.detail || "Could not prepare draft.");
      return;
    }
    const body = data.body || data.draft?.body || "";
    setDraft(body);
    try {
      localStorage.setItem(DRAFT_KEY, body);
    } catch {
      /* ignore */
    }
    router.push("/app/content/draft");
  };

  return (
    <>
      <Hero label="Content workspace" line1="PLAN IT." line2="WRITE IT." sub="Prepare useful content from your saved topics and confirmed business details." />

      <div className="sf-toolbar">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={active === t.id || pathname === t.path ? "active" : ""} onClick={() => router.push(t.path)}>
            {t.id}
          </button>
        ))}
      </div>

      {screen === "Brief" ? (
        <>
          <div className="sf-box">
            <h2>{mainTopic ? `${mainTopic}: a practical guide` : "Choose a live topic"}</h2>
            <p>Topic · {profile.areas || "Add areas in the business profile"} · From Search Console or Keywords</p>
            <div className="sf-divider" />
            {mainTopic ? (
              <>
                <h3>Questions to answer</h3>
                <ul>
                  <li>What problem does the visitor need solved?</li>
                  <li>Which warning signs call for professional help?</li>
                  <li>What should a customer expect when booking?</li>
                </ul>
                <h3>Business facts to confirm</h3>
                <p>Use only confirmed profile facts. Avoid unsupported prices, guarantees, or emergency availability.</p>
                <div className="sf-gap sf-row">
                  <Btn primary onClick={prepareDraft} disabled={busy}>
                    {busy ? "Preparing…" : "Prepare draft"}
                  </Btn>
                  <Btn href="/app/queue">Open work queue</Btn>
                </div>
              </>
            ) : (
              <div className="sf-empty">
                No topic yet. Sync Google, pick a query in Keywords, or open a page from the work queue.
                <div className="sf-row sf-gap" style={{ marginTop: 16 }}>
                  <Btn primary href="/app/keywords">
                    Keywords →
                  </Btn>
                  <Btn href="/app/queue">Work queue</Btn>
                </div>
              </div>
            )}
          </div>
          <div className="sf-box sf-gap">
            <h2>Topics from your keyword plan</h2>
            {topics.length ? (
              topics.map((t) => (
                <div className="sf-listrow" key={t}>
                  <div>
                    <h3>{t}</h3>
                    <span className="sf-small">From Research · Keywords</span>
                  </div>
                  <Btn
                    onClick={() => {
                      setTopicParam(t);
                      router.push(`/app/content?topic=${encodeURIComponent(t)}`);
                    }}
                  >
                    Use topic
                  </Btn>
                </div>
              ))
            ) : (
              <p>
                No topics yet.{" "}
                <button type="button" className="sf-link" onClick={() => router.push("/app/keywords")}>
                  Add topics in Research → Keywords
                </button>
              </p>
            )}
          </div>
        </>
      ) : null}

      {screen === "Draft" ? (
        <div className="sf-box">
          <h2>Review your draft</h2>
          <label className="sf-field">
            Article draft
            <textarea style={{ minHeight: 240 }} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Prepare a draft from a live topic on the Brief tab." />
          </label>
          <div className="sf-row">
            <Btn href="/app/content">← Brief</Btn>
            <Btn
              primary
              onClick={() => {
                if (!draft.trim()) {
                  toast("Prepare or enter a draft first.");
                  return;
                }
                setSaved(draft);
                try {
                  localStorage.setItem(SAVED_KEY, draft);
                } catch {
                  /* ignore */
                }
                toast("Draft saved for this session. Nothing published.");
                router.push("/app/content/library");
              }}
            >
              Save to library
            </Btn>
          </div>
          <div className="sf-note sf-gap">Editorial draft only. Verify factual claims before using it.</div>
        </div>
      ) : null}

      {screen === "Library" ? (
        <div className="sf-box">
          <h2>Saved content</h2>
          {saved ? (
            <>
              <h3>{mainTopic}</h3>
              <p>Draft · Saved in this session</p>
              <div className="sf-gap">
                <Btn
                  onClick={() => {
                    setDraft(saved);
                    router.push("/app/content/draft");
                  }}
                >
                  Open draft
                </Btn>
              </div>
            </>
          ) : (
            <p>
              Your saved draft will appear here.{" "}
              <button type="button" className="sf-link" onClick={() => router.push("/app/content")}>
                Start from Brief →
              </button>
            </p>
          )}
        </div>
      ) : null}
    </>
  );
}
