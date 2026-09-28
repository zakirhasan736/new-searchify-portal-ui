"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import {
  changePath,
  dismissChange,
  generateMetaCopy,
  listChanges,
  patchChange,
} from "@/lib/v1Api";

export default function ReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const toast = useV3Toast();
  const [change, setChange] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("Clear & direct");
  const [options, setOptions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = useState(false);

  const load = useCallback(async () => {
    const { data } = await listChanges();
    const list = Array.isArray(data) ? data : [];
    const c = list.find((x) => String(x.id) === String(id));
    setChange(c || null);
    if (c) {
      setTitle(c.proposed?.title || "");
      setDescription(c.proposed?.metaDescription || "");
    }
    setBooted(true);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!booted) return <PageSkeleton />;

  if (!change) {
    return (
      <div className="sf-empty sf-gap">
        <h2>Change not found</h2>
        <Btn href="/app/queue">← Work queue</Btn>
      </div>
    );
  }

  const evidence = change.proposed?.evidence || {};
  const beforeTitle = change.proposed?.beforeTitle || change.proposed?.currentTitle || "—";
  const beforeDesc = change.proposed?.beforeDescription || change.proposed?.currentDescription || "No custom description.";

  const saveDraft = async () => {
    await patchChange(change.id, { title, metaDescription: description });
  };

  const onGenerate = async () => {
    setBusy(true);
    await saveDraft();
    const res = await generateMetaCopy(change.id, { tone });
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Could not generate alternatives.");
      return;
    }
    setOptions(res.data?.options || []);
    toast("Alternatives ready. Review accuracy before publishing.");
  };

  const goConfirm = async () => {
    if (!title.trim() || !description.trim()) {
      toast("Add a title and description before publishing.");
      return;
    }
    setBusy(true);
    await patchChange(change.id, { title, metaDescription: description });
    setBusy(false);
    router.push(`/app/queue/${change.id}/confirm`);
  };

  return (
    <>
      <Link className="sf-link" href="/app/queue">
        ← Work queue
      </Link>
      <div style={{ marginTop: 18 }}>
        <Hero label={change.changeType === "meta" ? "Title & description" : change.changeType} line1="REVIEW IT." line2="THEN GO LIVE." sub={changePath(change)} />
      </div>

      <div className="sf-box sf-gap">
        <div className="sf-row sf-between">
          <h3>Why this page?</h3>
          <span className="sf-small">Search Console · Last 28 days</span>
        </div>
        <p style={{ fontSize: 13, marginTop: 5 }}>{change.opportunity}</p>
        <div className="sf-evidence">
          <div className="sf-small">
            <strong>{evidence.impressions ?? "—"}</strong>
            Impressions
          </div>
          <div className="sf-small">
            <strong>{evidence.clicks ?? "—"}</strong>
            Clicks
          </div>
          <div className="sf-small">
            <strong>{evidence.position ?? "—"}</strong>
            Average position
          </div>
        </div>
      </div>

      <div className="sf-box sf-ai sf-gap">
        <div className="sf-row sf-between">
          <div>
            <h2>Try a stronger title.</h2>
            <p>Generate alternatives using this page’s service and location.</p>
          </div>
          <Pill neutral>AI writing</Pill>
        </div>
        <div className="sf-toolform sf-gap">
          <label className="sf-field">
            Writing style
            <select value={tone} onChange={(e) => setTone(e.target.value)}>
              <option>Clear & direct</option>
              <option>Service focused</option>
            </select>
          </label>
          <Btn primary onClick={onGenerate} disabled={busy}>
            {options.length ? "Generate again" : "Generate title & description"}
          </Btn>
        </div>
        {options.length ? (
          <div className="sf-aioptions">
            {options.map((opt, i) => (
              <div className="sf-aioption" key={i}>
                <div className="sf-small">
                  Option {i + 1} · {(opt.title || "").length} title characters
                </div>
                <h3 style={{ marginTop: 8 }}>{opt.title}</h3>
                <p style={{ margin: "10px 0" }}>{opt.description}</p>
                <Btn
                  onClick={() => {
                    setTitle(opt.title || "");
                    setDescription(opt.description || "");
                    setOptions([]);
                    toast("Alternative applied to your editable draft. Nothing has been published.");
                  }}
                >
                  Use this version
                </Btn>
              </div>
            ))}
          </div>
        ) : null}
        <div className="sf-livewarning">Review accuracy before publishing. Page content and URLs stay unchanged.</div>
      </div>

      <div className="sf-grid sf-gap">
        <div className="sf-box">
          <div className="sf-label">Currently published</div>
          <div className="sf-before">
            <strong>Title</strong>
            <div style={{ marginTop: 5 }}>{beforeTitle}</div>
          </div>
          <div className="sf-before">
            <strong>Description</strong>
            <div style={{ marginTop: 5 }}>{beforeDesc}</div>
          </div>
          <div className="sf-divider" />
          <span className="sf-small">The original values are retained for undo.</span>
        </div>
        <div className="sf-box">
          <div className="sf-row sf-between">
            <div className="sf-label">Suggested update</div>
            <Pill>Editable</Pill>
          </div>
          <label className="sf-field">
            Page title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="sf-field">
            Meta description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="sf-small">Uses your confirmed service and location. Page content and URLs stay unchanged.</div>
        </div>
      </div>

      <div className="sf-preview">
        <div className="sf-label">Search listing preview</div>
        <div className="sf-small" style={{ marginTop: 13 }}>
          {changePath(change)}
        </div>
        <div className="sf-searchtitle">{title || "Page title"}</div>
        <p style={{ fontSize: 13 }}>{description || "Meta description"}</p>
        <div className="sf-small" style={{ marginTop: 10 }}>
          Illustrative preview. Search engines may display different wording.
        </div>
      </div>

      <div className="sf-row sf-between sf-gap">
        <Btn
          onClick={async () => {
            await dismissChange(change.id);
            toast("Saved for later. Your website has not changed.");
            router.push("/app/queue");
          }}
        >
          Save for later
        </Btn>
        <div className="sf-row">
          <span className="sf-small">One page · Title & description</span>
          <Btn primary onClick={goConfirm} disabled={busy}>
            Review publication
          </Btn>
        </div>
      </div>

      <div className="sf-note sf-gap">
        Publishing scope: titles and descriptions only · Supported WordPress + Yoast · Saved values are checked before applying a change.
      </div>
    </>
  );
}
