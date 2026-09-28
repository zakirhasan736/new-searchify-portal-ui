"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import GooglePropertyPicker from "@/components/v3/GooglePropertyPicker";
import {
  getBusinessProfile,
  getGoogleStatus,
  deleteCmsConnection,
  listCmsConnections,
  proposeFromGsc,
  saveBusinessProfile,
  saveCmsConnection,
  startGoogleOAuth,
  syncGoogleLive,
} from "@/lib/v1Api";

const STEPS = [
  { n: 1, label: "Your website", path: "/app/setup" },
  { n: 2, label: "Connections", path: "/app/setup/connections" },
  { n: 3, label: "Confirm details", path: "/app/setup/profile" },
];

function validSiteUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function SetupPage({ step = 1 }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useV3Toast();
  const current = STEPS.find((s) => s.path === pathname)?.n || step;
  const [url, setUrl] = useState("https://");
  const [wpOk, setWpOk] = useState(false);
  const [wpConnId, setWpConnId] = useState(null);
  const [gscOk, setGscOk] = useState(false);
  const [googleConn, setGoogleConn] = useState(null);
  const [showWpForm, setShowWpForm] = useState(false);
  const [profile, setProfile] = useState({ business: "", services: "", areas: "" });
  const [wpCreds, setWpCreds] = useState({ username: "", applicationPassword: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("sf_setup") || "{}");
      if (saved.url) setUrl(saved.url);
      if (saved.wpOk) setWpOk(true);
      if (saved.gscOk) setGscOk(true);
      if (saved.profile) setProfile((p) => ({ ...p, ...saved.profile }));
    } catch {
      /* ignore */
    }

    (async () => {
      const [bp, cms, google] = await Promise.all([getBusinessProfile(), listCmsConnections(), getGoogleStatus()]);
      if (bp.data?.profile) setProfile((p) => ({ ...p, ...bp.data.profile }));
      const wpConn = (cms.data?.connections || []).find((x) => x.provider === "wordpress" && x.status === "connected");
      if (wpConn) {
        setWpOk(true);
        setWpConnId(wpConn.id);
        if (wpConn.siteUrl) setUrl(wpConn.siteUrl);
        persist({ wpOk: true, url: wpConn.siteUrl || url });
      }
      const g = google.data?.connection;
      setGoogleConn(g || null);
      if (g?.gscSiteUrl) {
        setGscOk(true);
        persist({ gscOk: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (patch) => {
    try {
      const prev = JSON.parse(localStorage.getItem("sf_setup") || "{}");
      localStorage.setItem("sf_setup", JSON.stringify({ ...prev, url, wpOk, gscOk, profile, ...patch }));
    } catch {
      /* ignore */
    }
  };

  const connectWp = async () => {
    if (!validSiteUrl(url)) {
      toast("Enter a valid website address in step 1 first.");
      router.push("/app/setup");
      return;
    }
    if (!showWpForm) {
      setShowWpForm(true);
      return;
    }
    if (!wpCreds.username.trim() || !wpCreds.applicationPassword.trim()) {
      toast("Enter WordPress username and Application Password.");
      return;
    }
    setBusy(true);
    const res = await saveCmsConnection({
      provider: "wordpress",
      label: "WordPress",
      site_url: url.trim(),
      credentials: {
        username: wpCreds.username.trim(),
        applicationPassword: wpCreds.applicationPassword.trim(),
      },
    });
    setBusy(false);
    if (!res.ok) {
      toast(typeof res.data?.detail === "string" ? res.data.detail : "Could not connect WordPress.");
      return;
    }
    setWpOk(true);
    setWpConnId(res.data?.connection?.id || null);
    setShowWpForm(false);
    setWpCreds((s) => ({ ...s, applicationPassword: "" }));
    persist({ wpOk: true, url: url.trim() });
    toast("WordPress connected. Next: connect Google and pick Search Console + GA4.");
  };

  const connectGsc = async () => {
    setBusy(true);
    const res = await startGoogleOAuth("gsc,ga4,ads");
    setBusy(false);
    if (res.data?.url) {
      persist({ gscOk: true });
      window.location.href = res.data.url;
      return;
    }
    toast(res.data?.detail || "Could not start Google OAuth.");
  };

  const finish = async () => {
    setBusy(true);
    await saveBusinessProfile(profile);
    if (gscOk) {
      const sync = await syncGoogleLive();
      if (sync.ok) {
        const proposed = await proposeFromGsc();
        setBusy(false);
        toast(
          proposed.ok
            ? `Setup complete · ${proposed.data?.created ?? 0} title & description opportunities ready.`
            : "Setup saved. Open Work queue to refresh from Search Console.",
        );
        router.push("/app/queue");
        return;
      }
    }
    setBusy(false);
    toast("Setup saved. Connect Google and refresh the work queue to see suggestions.");
    router.push("/app");
  };

  return (
    <>
      <Hero label="Add a website" line1="LET’S GET" line2="YOU SET UP." sub="A few details. Then you’re in." />

      <div className="sf-steps">
        {STEPS.map((s) => (
          <button
            key={s.n}
            type="button"
            className={`sf-step ${current === s.n ? "active" : ""}`}
            style={{ background: "transparent", border: 0, color: "inherit" }}
            onClick={() => router.push(s.path)}
          >
            <span className="sf-stepnum">{current > s.n ? "✓" : s.n}</span>
            {s.label}
          </button>
        ))}
      </div>

      {current === 1 ? (
        <div className="sf-box">
          <h2>Which website are we working on?</h2>
          <label className="sf-field">
            Website address
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yoursite.com" />
          </label>
          <div className="sf-note">WordPress sites supported in this first version.</div>
          <div className="sf-row sf-between sf-gap">
            <span className="sf-small">Titles & descriptions workflow</span>
            <Btn
              primary
              onClick={() => {
                if (!validSiteUrl(url)) {
                  toast("Enter a valid website address.");
                  return;
                }
                persist({ url: url.trim() });
                router.push("/app/setup/connections");
              }}
            >
              Continue →
            </Btn>
          </div>
        </div>
      ) : null}

      {current === 2 ? (
        <>
          <div className="sf-list">
            <div className="sf-listrow" style={{ alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <h3>Connect WordPress</h3>
                <p style={{ fontSize: 13 }}>Allow approved title and description updates.</p>
                <div className="sf-small" style={{ marginTop: 6 }}>
                  Site: {validSiteUrl(url) ? url : "Set website in step 1"}
                </div>
                {showWpForm && !wpOk ? (
                  <form
                    className="sf-grid"
                    style={{ marginTop: 12 }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      connectWp();
                    }}
                  >
                    <label className="sf-field">
                      Username
                      <input
                        value={wpCreds.username}
                        onChange={(e) => setWpCreds({ ...wpCreds, username: e.target.value })}
                        autoComplete="username"
                      />
                    </label>
                    <label className="sf-field">
                      Application password
                      <input
                        type="password"
                        value={wpCreds.applicationPassword}
                        onChange={(e) => setWpCreds({ ...wpCreds, applicationPassword: e.target.value })}
                        autoComplete="current-password"
                        placeholder="From WP Users → Application Passwords"
                      />
                    </label>
                  </form>
                ) : null}
              </div>
              {wpOk ? (
                <div className="sf-row">
                  <Pill>Connected</Pill>
                  <Btn
                    onClick={async () => {
                      if (!wpConnId) {
                        router.push("/app/connections");
                        return;
                      }
                      setBusy(true);
                      const res = await deleteCmsConnection(wpConnId);
                      setBusy(false);
                      if (!res.ok) {
                        toast(res.data?.detail || "Could not disconnect WordPress.");
                        return;
                      }
                      setWpOk(false);
                      setWpConnId(null);
                      persist({ wpOk: false });
                      toast("WordPress disconnected.");
                    }}
                    disabled={busy}
                  >
                    Disconnect
                  </Btn>
                </div>
              ) : (
                <Btn primary onClick={connectWp} disabled={busy}>
                  {showWpForm ? (busy ? "Saving…" : "Save WordPress") : "Connect WordPress"}
                </Btn>
              )}
            </div>
            <div className="sf-listrow">
              <div>
                <h3>Connect Google</h3>
                <p style={{ fontSize: 13 }}>One sign-in. Then pick Search Console and GA4.</p>
                {googleConn?.googleEmail ? <div className="sf-small">{googleConn.googleEmail}</div> : null}
              </div>
              {gscOk ? (
                <Pill>Connected</Pill>
              ) : googleConn?.connected || googleConn?.status === "connected" ? (
                <Pill neutral>Pick properties</Pill>
              ) : (
                <Btn onClick={connectGsc} disabled={busy}>
                  Connect Google
                </Btn>
              )}
            </div>
          </div>
          {googleConn?.connected || googleConn?.status === "connected" ? (
            <div className="sf-gap">
              <GooglePropertyPicker
                google={googleConn}
                compact
                onSaved={(conn) => {
                  setGoogleConn(conn);
                  if (conn?.gscSiteUrl) {
                    setGscOk(true);
                    persist({ gscOk: true });
                  }
                }}
              />
            </div>
          ) : null}
          <div className="sf-note sf-gap">
            Step 2 of 3 · WordPress publishes approved titles and descriptions. Google fills the work queue.
          </div>
          <div className="sf-row sf-between sf-gap">
            <Btn href="/app/setup">Back</Btn>
            <Btn
              primary
              onClick={() => {
                if (!wpOk || !gscOk) {
                  toast("Connect WordPress and Google to continue.");
                  return;
                }
                router.push("/app/setup/profile");
              }}
            >
              Continue →
            </Btn>
          </div>
        </>
      ) : null}

      {current === 3 ? (
        <div className="sf-box">
          <h2>Confirm what your business does</h2>
          <p style={{ fontSize: 13 }}>Review these details before suggestions are prepared.</p>
          <label className="sf-field">
            Business name
            <input value={profile.business} onChange={(e) => setProfile({ ...profile, business: e.target.value })} />
          </label>
          <div className="sf-grid">
            <label className="sf-field">
              Services
              <input value={profile.services} onChange={(e) => setProfile({ ...profile, services: e.target.value })} />
            </label>
            <label className="sf-field">
              Service areas
              <input value={profile.areas} onChange={(e) => setProfile({ ...profile, areas: e.target.value })} />
            </label>
          </div>
          <div className="sf-note">Nothing is published automatically. You review each proposed change.</div>
          <div className="sf-row sf-between sf-gap">
            <Btn href="/app/setup/connections">Back</Btn>
            <Btn primary onClick={finish} disabled={busy}>
              Find my opportunities →
            </Btn>
          </div>
        </div>
      ) : null}
    </>
  );
}
