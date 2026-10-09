"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getGoogleStatus, listCmsConnections, saveCmsConnection, startGoogleOAuth } from "@/lib/v1Api";
import { markConnection } from "@/lib/journey";

const COPY = {
  wordpress: {
    title: "WordPress connection",
    body: "Publish approved meta titles and meta descriptions to this site. Searchify never renames WordPress pages or menus. The application password stays on the server.",
  },
  gsc: {
    title: "Google Search Console",
    body: "Read-only access to the Search Console property you select. Nothing is published from this step.",
  },
  ga: {
    title: "Google Analytics",
    body: "Read-only reporting access to the GA4 property you select.",
  },
};

export default function ConnectDialog({ provider, siteUrl = "", onClose, onDone }) {
  const dialogRef = useRef(null);
  const copy = COPY[provider] || COPY.gsc;
  const [url, setUrl] = useState(siteUrl || "https://");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleOn, setGoogleOn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const node = dialogRef.current;
    if (node && !node.open) node.showModal();
    getGoogleStatus().then((res) => setGoogleOn(Boolean(res.data?.connection?.gscSiteUrl || res.data?.connection?.status === "connected"))).catch(() => {});
    return () => {
      window.removeEventListener("keydown", onKey);
      if (node?.open) node.close();
    };
  }, [onClose]);

  const finish = (value) => {
    const key = provider === "wordpress" ? "wordpress" : provider === "ga" ? "ga" : "gsc";
    markConnection(key, value);
    onDone(value);
  };

  const saveWordPress = async (event) => {
    event.preventDefault();
    if (!/^https?:\/\//i.test(url.trim())) {
      setError("Use a full address, including https://");
      return;
    }
    if (!username.trim() || !password.trim()) {
      setError("Username and application password are required.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await saveCmsConnection({
      provider: "wordpress",
      label: "WordPress",
      site_url: url.trim(),
      credentials: { username: username.trim(), applicationPassword: password.trim(), defaultPostId: "" },
    });
    setBusy(false);
    if (!res.ok) {
      setError(typeof res.data?.detail === "string" ? res.data.detail : "WordPress could not be connected.");
      return;
    }
    finish("Connected");
  };

  const startGoogle = async (services) => {
    setBusy(true);
    setError("");
    const res = await startGoogleOAuth(services);
    setBusy(false);
    if (res.data?.url) {
      window.location.href = res.data.url;
      return;
    }
    if (res.data?.alreadyConnected) {
      onDone("signed-in");
      return;
    }
    setError(typeof res.data?.detail === "string" ? res.data.detail : "Google could not be opened.");
  };

  return (
    <dialog className="connect-dialog" ref={dialogRef} aria-labelledby="connect-heading" onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <button className="connect-dialog-close" type="button" aria-label="Close" onClick={onClose}>×</button>
      <p className="connect-kicker">Searchify · Connect</p>
      <h2 id="connect-heading">{provider === "wordpress" ? "Connect WordPress" : copy.title}</h2>
      <p className="connect-lead">{copy.body}</p>
      {provider === "wordpress" ? (
        <form onSubmit={saveWordPress}>
          <label>
            <span>Website</span>
            <input value={url} onChange={(event) => setUrl(event.target.value)} type="url" inputMode="url" autoComplete="url" required />
          </label>
          <label>
            <span>WordPress username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
            <small>The user who can edit posts on this site.</small>
          </label>
          <label>
            <span>Application password</span>
            <span className="connect-secret">
              <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} autoComplete="new-password" spellCheck={false} required />
              <button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button>
            </span>
            <small>In WordPress, open Users → Profile → Application Passwords. Spaces are fine.</small>
          </label>
          {error ? <p className="connect-error" role="alert">{error}</p> : null}
          <div className="connect-dialog-actions">
            <button className="connect-later" type="button" onClick={() => finish("Connect later")}>I’ll do this later</button>
            <button className="connect-verify" type="submit" disabled={busy}>{busy ? "Checking the site…" : "Verify connection"}</button>
          </div>
        </form>
      ) : (
        <div className="connect-dialog-actions">
          {error ? <p className="connect-error" role="alert">{error}</p> : null}
          <button className="connect-later" type="button" onClick={() => finish("Connect later")}>I’ll do this later</button>
          <button className="connect-verify" type="button" disabled={busy} onClick={() => (googleOn ? onDone("signed-in") : startGoogle("gsc,ga4"))}>
            {googleOn ? "Choose the property" : "Continue with Google"}
          </button>
        </div>
      )}
    </dialog>
  );
}

export function useConnectionStatus() {
  const [status, setStatus] = useState({ wordpress: false, gsc: false, ga: false, wordpressId: null, wordpressUrl: "", google: null });
  const refresh = useCallback(() => {
    Promise.all([listCmsConnections({ force: true }), getGoogleStatus({ force: true })]).then(([cms, google]) => {
      const sites = cms.data?.connections || [];
      const wp = sites.find((item) => item.provider === "wordpress" && item.status === "connected");
      const g = google.data?.connection || {};
      setStatus({
        wordpress: Boolean(wp),
        wordpressId: wp?.id || null,
        wordpressUrl: wp?.siteUrl || "",
        gsc: g.gsc?.status === "connected",
        ga: g.ga4?.status === "connected",
        gscStatus: g.gsc?.status || (g.gscSiteUrl ? "unverified" : "not_selected"),
        gaStatus: g.ga4?.status || (g.ga4PropertyId ? "unverified" : "not_selected"),
        googleAccount: g.account?.status || (g.connected ? "connected" : "disconnected"),
        google: g,
      });
    }).catch(() => {});
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return [status, refresh];
}
