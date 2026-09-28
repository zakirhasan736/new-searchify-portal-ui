"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import { usePageBoot } from "@/lib/usePageBoot";
import { featurePayload, getGoogleStatus, loadFeature, syncAds } from "@/lib/v1Api";

export default function AdsPage({ detailId = null }) {
  const params = useParams();
  const toast = useV3Toast();
  const activeDetail = detailId || params?.id || null;
  const [google, setGoogle] = useState(null);
  const [payload, setPayload] = useState({});
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = usePageBoot((s) => s.getGoogle() && s.getFeature("google-ads"));

  const load = useCallback(async () => {
    const [g, ads] = await Promise.all([getGoogleStatus(), loadFeature("google-ads", { force: true })]);
    setGoogle(g.data?.connection || null);
    setPayload(featurePayload(ads));
    setBooted(true);
  }, [setBooted]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async () => {
    setBusy(true);
    const res = await syncAds();
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Ads sync failed.");
      return;
    }
    toast(`Ads synced · ${res.data?.campaigns ?? 0} campaigns`);
    await load();
  };

  if (!booted) return <PageSkeleton />;

  const campaigns = payload.rows || [];
  const terms = payload.searchTerms || [];
  const linked = Boolean(google?.adsCustomerId && payload.live !== false && (campaigns.length || payload.customerId));
  const signedIn = Boolean(google?.connected || google?.status === "connected");

  return (
    <>
      <Hero
        label={linked ? `Google Ads · ${payload.customerName || google?.adsCustomerName || "Connected"}` : "Google Ads"}
        line1="WATCH YOUR"
        line2="AD SPEND."
        sub={
          linked
            ? `Last 30 days from Ads customer ${payload.customerId || google?.adsCustomerId}.`
            : "Connect the Google Ads account you already run. Searchify only reads campaigns — it does not create ads."
        }
      />

      {!signedIn ? (
        <div className="sf-empty sf-box">
          <Pill neutral>Google not connected</Pill>
          <h2 style={{ marginTop: 14 }}>Sign in with Google first</h2>
          <p>Ads uses the same Google sign-in, then an extra Ads permission and customer picker.</p>
          <div className="sf-row sf-gap" style={{ marginTop: 18 }}>
            <Btn primary href="/app/connections">
              Open connections →
            </Btn>
          </div>
        </div>
      ) : !google?.adsScope || !google?.adsCustomerId ? (
        <div className="sf-empty sf-box">
          <Pill neutral>{google?.adsScope ? "Pick an Ads account" : "Ads permission needed"}</Pill>
          <h2 style={{ marginTop: 14 }}>Pick the Ads customer on this Google account</h2>
          <p>
            Google is already connected. Choose the Ads customer you already run — you do not sign in with Google again.
          </p>
          {!google?.adsConfigured ? (
            <p className="sf-small">Backend still needs GOOGLE_ADS_DEVELOPER_TOKEN from Google Ads → Tools → API Center.</p>
          ) : null}
          <div className="sf-row sf-gap" style={{ marginTop: 18 }}>
            <Btn primary href="/app/connections/ads">
              Choose Ads account →
            </Btn>
            <Btn href="/app/connections">Connections</Btn>
          </div>
        </div>
      ) : (
        <>
          <div className="sf-three sf-gap">
            {(payload.kpis || []).slice(0, 4).map((row) => (
              <div className="sf-box" key={row[0]}>
                <div className="sf-small">{row[0]}</div>
                <div className="sf-metric" style={{ fontSize: 28 }}>
                  {row[1]}
                </div>
              </div>
            ))}
          </div>

          <div className="sf-row sf-between sf-gap">
            <div>
              <h2>Campaigns · last 30 days</h2>
              <p className="sf-small">
                {payload.customerName || google.adsCustomerName} · {payload.customerId || google.adsCustomerId}
              </p>
            </div>
            <div className="sf-row">
              <Btn onClick={refresh} disabled={busy}>
                {busy ? "Syncing…" : "Sync Ads"}
              </Btn>
              <Btn href="/app/connections/ads">Change account</Btn>
            </div>
          </div>

          <div className="sf-list sf-gap">
            <div className="sf-tablewrap">
              <table className="sf-ranktable">
                <thead>
                  <tr>
                    {(payload.columns || ["Campaign", "Status", "Cost", "Clicks", "Impressions", "Conversions"]).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.length ? (
                    campaigns.map((row, ix) => (
                      <tr key={`${row[0]}-${ix}`} aria-selected={activeDetail && String(ix) === String(activeDetail)}>
                        {row.map((cell, ci) => (
                          <td key={ci}>{String(cell)}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>No campaigns in the last 30 days for this customer.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sf-box sf-gap">
            <h2>Search terms</h2>
            <div className="sf-tablewrap">
              <table className="sf-ranktable">
                <thead>
                  <tr>
                    <th>Term</th>
                    <th>Clicks</th>
                    <th>Impressions</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {terms.length ? (
                    terms.map((row, ix) => (
                      <tr key={`${row[0]}-${ix}`}>
                        {row.map((cell, ci) => (
                          <td key={ci}>{String(cell)}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>No search terms returned for this account.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
