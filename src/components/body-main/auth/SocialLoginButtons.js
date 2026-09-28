"use client";

import { useEffect, useState } from "react";

export default function SocialLoginButtons({ onError }) {
  const [providers, setProviders] = useState({ google: false, github: false });
  const [busy, setBusy] = useState("");

  useEffect(() => {
    fetch("/api/v1/auth/oauth/providers")
      .then((r) => r.json())
      .then(setProviders)
      .catch(() => setProviders({ google: false, github: false }));
  }, []);

  const start = async (provider) => {
    setBusy(provider);
    try {
      const response = await fetch(`/api/v1/auth/oauth/${provider}/start`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.authUrl) {
        onError?.(data.detail || `${provider} login is not configured`);
        setBusy("");
        return;
      }
      window.location.href = data.authUrl;
    } catch {
      onError?.("Could not start social login");
      setBusy("");
    }
  };

  if (!providers.google && !providers.github) return null;

  return (
    <div className="sf-auth-social">
      <div className="sf-auth-or">or continue with</div>
      <div className="sf-auth-social-row">
        {providers.google ? (
          <button type="button" className="sf-btn" disabled={Boolean(busy)} onClick={() => start("google")}>
            {busy === "google" ? "…" : "Google"}
          </button>
        ) : null}
        {providers.github ? (
          <button type="button" className="sf-btn" disabled={Boolean(busy)} onClick={() => start("github")}>
            {busy === "github" ? "…" : "GitHub"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
