"use client";

import { useEffect, useState } from "react";
import { Btn, Pill, useV3Toast } from "@/components/v3/V3Shell";
import { listAdsAccounts, selectAdsAccount, startGoogleOAuth } from "@/lib/v1Api";

export default function GoogleAdsPicker({ google, onSaved, cmsConnectionId = null, siteLabel = "" }) {
  const toast = useV3Toast();
  const [accounts, setAccounts] = useState([]);
  const [customerId, setCustomerId] = useState(google?.adsCustomerId || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needAdsGrant, setNeedAdsGrant] = useState(false);

  useEffect(() => {
    setCustomerId(google?.adsCustomerId || "");
  }, [google?.adsCustomerId]);

  useEffect(() => {
    if (!google?.connected && google?.status !== "connected") return;
    listAdsAccounts(cmsConnectionId).then((res) => {
      if (res.status === 409) {
        setNeedAdsGrant(true);
        setError("");
        return;
      }
      if (!res.ok) {
        const detail = typeof res.data?.detail === "string" ? res.data.detail : "Could not load Ads accounts.";
        setError(detail);
        toast(detail);
        return;
      }
      setNeedAdsGrant(false);
      setError("");
      setAccounts(res.data?.accounts || []);
      if (res.data?.selectedCustomerId) setCustomerId(res.data.selectedCustomerId);
    });
  }, [google?.connected, google?.status, cmsConnectionId, toast]);

  const grantAds = async () => {
    setBusy(true);
    const res = await startGoogleOAuth("gsc,ga4,ads");
    setBusy(false);
    if (res.data?.alreadyConnected && !res.data?.url) {
      toast("Google is already connected. Pick an Ads account.");
      setNeedAdsGrant(false);
      const list = await listAdsAccounts(cmsConnectionId);
      if (list.ok) setAccounts(list.data?.accounts || []);
      return;
    }
    if (res.data?.url) {
      window.location.href = res.data.url;
      return;
    }
    toast(res.data?.detail || "Could not request Ads access on this Google account.");
  };

  const save = async () => {
    if (!customerId) {
      toast("Select a Google Ads account.");
      return;
    }
    setBusy(true);
    const chosen = accounts.find((a) => String(a.customerId) === String(customerId));
    const res = await selectAdsAccount({
      customer_id: customerId,
      customer_name: chosen?.descriptiveName || google?.adsCustomerName || "",
      cms_connection_id: cmsConnectionId || undefined,
    });
    setBusy(false);
    if (!res.ok) {
      toast(typeof res.data?.detail === "string" ? res.data.detail : "Could not save Ads account.");
      return;
    }
    toast(`Google Ads linked · ${res.data?.adsCustomerName || customerId}`);
    onSaved?.(res.data);
  };

  if (needAdsGrant) {
    return (
      <div className="sf-box sf-ai sf-gap">
        <div className="sf-row sf-between">
          <h2>Allow Ads on this Google account</h2>
          <Pill neutral>Same Google sign-in</Pill>
        </div>
        <p style={{ fontSize: 13 }}>
          You are already signed in{google?.googleEmail ? ` as ${google.googleEmail}` : ""}. Google only needs to confirm
          Ads read access on this same account — you do not create a new Google connection.
        </p>
        <Btn primary onClick={grantAds} disabled={busy}>
          {busy ? "Opening Google…" : "Allow Ads on this account"}
        </Btn>
      </div>
    );
  }

  return (
    <div className="sf-box sf-ai sf-gap">
      <div className="sf-row sf-between">
        <h2>Choose a Google Ads account</h2>
        <Pill neutral>Same Google sign-in</Pill>
      </div>
      <p style={{ fontSize: 13 }}>
        Using the Google account already connected{google?.googleEmail ? ` (${google.googleEmail})` : ""}. Pick the Ads
        customer{siteLabel ? ` for ${siteLabel}` : ""}.
      </p>
      {error ? <div className="sf-small">{error}</div> : null}
      <label className="sf-field">
        Ads customer
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">Select an Ads account</option>
          {accounts.map((a) => (
            <option key={a.customerId} value={a.customerId}>
              {a.descriptiveName || "Account"} · {a.customerId}
              {a.manager ? " · manager" : ""}
              {a.currencyCode ? ` · ${a.currencyCode}` : ""}
            </option>
          ))}
        </select>
      </label>
      <div className="sf-row sf-gap">
        <Btn primary onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save & load campaigns"}
        </Btn>
      </div>
    </div>
  );
}
