"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import { createAiDraft } from "@/lib/clientApi";
import { usePageBoot } from "@/lib/usePageBoot";
import { getBusinessProfile, getGoogleStatus, loadFeature, syncGoogleLive, syncPlaces } from "@/lib/v1Api";

const TABS = [
  { id: "Overview", path: "/app/local" },
  { id: "Business details", path: "/app/local/details" },
  { id: "Reviews", path: "/app/local/reviews" },
];

export default function LocalPage({ screen = "Overview" }) {
  const toast = useV3Toast();
  const router = useRouter();
  const pathname = usePathname();
  const [places, setPlaces] = useState([]);
  const [profile, setProfile] = useState({});
  const [google, setGoogle] = useState(null);
  const [reply, setReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = usePageBoot((s) => s.getFeature("local-seo"));

  const load = useCallback(async () => {
    const [p, g, bp, loc] = await Promise.all([
      loadFeature("local-seo"),
      getGoogleStatus(),
      getBusinessProfile(),
      loadFeature("local-listings"),
    ]);
    setGoogle(g.data?.connection || null);
    setProfile(bp.data?.profile || {});
    const rows = loc?.data?.payload?.rows || p?.data?.payload?.rows || p?.data?.rows || [];
    setPlaces(rows);
    setBooted(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const syncPlacesData = async () => {
    setBusy(true);
    await syncGoogleLive();
    const res = await syncPlaces();
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Places sync failed. Check Places API key.");
      return;
    }
    toast(`Synced ${res.data?.count || 0} places.`);
    load();
  };

  const draftReply = async () => {
    setBusy(true);
    const res = await createAiDraft({
      kind: "review-reply",
      brief: `Draft a short professional reply for a 5-star review. Business: ${profile.business || "business"}. No invented claims.`,
      writingType: "Review reply",
      tokens: 200,
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setReply(true);
    setReplyText(data.body || data.draft?.body || "");
  };

  if (!booted) return <PageSkeleton />;

  return (
    <>
      <Hero label="Local SEO" line1="SHOW UP" line2="LOCALLY." sub="Review how your business appears to nearby customers." />

      <div className="sf-row sf-between">
        <div>
          <h3>
            {profile.business || "Business profile incomplete"} · {profile.areas || "Add a service area"}
          </h3>
          <div className="sf-small">Google Places · Business profile context</div>
        </div>
        {google?.status === "connected" ? <Pill>Google connected</Pill> : <Btn href="/app/connections">Connect Google</Btn>}
      </div>

      <div className="sf-toolbar">
        {TABS.map((t) => (
          <button key={t.path} type="button" className={pathname === t.path ? "active" : ""} onClick={() => router.push(t.path)}>
            {t.id}
          </button>
        ))}
      </div>

      {screen === "Overview" ? (
        <>
          <div className="sf-three sf-gap">
            <div className="sf-box">
              <div className="sf-small">Places synced</div>
              <div className="sf-metric">{places.length || "—"}</div>
              <div className="sf-small">Nearby / related places</div>
            </div>
            <div className="sf-box">
              <div className="sf-small">Top rating</div>
              <div className="sf-metric">{places[0]?.[2] || "—"}</div>
              <div className="sf-small">From Places API</div>
            </div>
            <div className="sf-box">
              <div className="sf-small">Review count</div>
              <div className="sf-metric">{places[0]?.[3] || "—"}</div>
              <div className="sf-small">Top listing</div>
            </div>
          </div>
          <div className="sf-box sf-gap">
            <div className="sf-row sf-between">
              <h2>Places from Google</h2>
              <Btn onClick={syncPlacesData} disabled={busy}>
                {busy ? "Syncing…" : "Sync Places"}
              </Btn>
            </div>
            <div className="sf-locations">
              {places.length ? (
                places.slice(0, 8).map((x, i) => (
                  <div className="sf-location" key={i}>
                    <div className="sf-small">{Array.isArray(x) ? x[0] : x.name}</div>
                    <strong>{Array.isArray(x) ? x[2] || "—" : x.rating || "—"}</strong>
                  </div>
                ))
              ) : (
                <div className="sf-empty" style={{ width: "100%" }}>
                  No Places listings yet. Connect Google, then sync Places.
                </div>
              )}
            </div>
            <div className="sf-row sf-gap">
              <Btn href="/app/local/details">Business details →</Btn>
              <Btn href="/app/local/reviews">Reviews →</Btn>
            </div>
          </div>
        </>
      ) : null}

      {screen === "Business details" ? (
        <div className="sf-box">
          <h2>Profile consistency</h2>
          <div className="sf-listrow">
            <div>
              <h3>Business name</h3>
              <p>{profile.business || "Add in Business profile"}</p>
            </div>
            <Pill warn={!profile.business}>{profile.business ? "Matches" : "Review"}</Pill>
          </div>
          <div className="sf-listrow">
            <div>
              <h3>Service area</h3>
              <p>{profile.areas || "Add service areas"}</p>
            </div>
            <Pill warn={!profile.areas}>{profile.areas ? "Matches" : "Review"}</Pill>
          </div>
          <div className="sf-note sf-gap">Verify operating hours with the business before updating any profile.</div>
          <div className="sf-gap sf-row">
            <Btn href="/app/local">← Overview</Btn>
            <Btn href="/app/profile">Review business information</Btn>
          </div>
        </div>
      ) : null}

      {screen === "Reviews" ? (
        <div className="sf-box">
          <div className="sf-row sf-between">
            <h2>Recent customer feedback</h2>
            <Pill neutral>Places · live counts only</Pill>
          </div>
          <div className="sf-divider" />
          {places.length ? (
            places.slice(0, 5).map((x, i) => (
              <div className="sf-listrow" key={i} style={{ paddingLeft: 0, paddingRight: 0 }}>
                <div>
                  <h3>{Array.isArray(x) ? x[0] : x.name}</h3>
                  <p>
                    Rating {Array.isArray(x) ? x[2] || "—" : x.rating || "—"} · Reviews{" "}
                    {Array.isArray(x) ? x[3] || "—" : x.reviews || "—"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p style={{ margin: "12px 0" }}>No Places review counts yet. Sync Places after Google is connected.</p>
          )}
          <Btn primary onClick={draftReply} disabled={busy || !profile.business}>
            Draft a reply with AI
          </Btn>
          {reply ? (
            <>
              <label className="sf-field">
                Reply draft
                <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} />
              </label>
              <div className="sf-row">
                <Btn primary onClick={() => toast("Reply draft saved. Nothing was posted to Google.")}>
                  Save draft
                </Btn>
                <Btn
                  onClick={() => {
                    setReply(false);
                    setReplyText("");
                  }}
                >
                  Discard
                </Btn>
              </div>
              <div className="sf-livewarning">Saving a draft does not post it to Google.</div>
            </>
          ) : null}
          <div className="sf-gap">
            <Btn href="/app/local">← Overview</Btn>
          </div>
        </div>
      ) : null}
    </>
  );
}
