"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Btn, Hero, Pill, useV3Toast } from "@/components/v3/V3Shell";
import PageSkeleton from "@/components/v3/PageSkeleton";
import GooglePropertyPicker from "@/components/v3/GooglePropertyPicker";
import GoogleAdsPicker from "@/components/v3/GoogleAdsPicker";
import { usePageBoot } from "@/lib/usePageBoot";
import {
  deleteCmsConnection,
  disconnectAds,
  disconnectGoogle,
  featureKpi,
  featurePayload,
  getGoogleStatus,
  listCmsConnections,
  loadFeature,
  resetWorkspace,
  runPageSpeed,
  saveCmsConnection,
  setActiveSite,
  startGoogleOAuth,
  syncAds,
  syncGoogleLive,
  syncPlaces,
} from "@/lib/v1Api";

function validSiteUrl(value) {
  try {
    const u = new URL(value);
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".");
  } catch {
    return false;
  }
}

export default function ConnectionsPage({ panel: panelProp = null }) {
  const toast = useV3Toast();
  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();
  const panel = panelProp || (typeof params?.panel === "string" ? params.panel : null);
  const panelRef = useRef(null);
  const [google, setGoogle] = useState(null);
  const [cms, setCms] = useState([]);
  const [busy, setBusy] = useState(false);
  const [booted, setBooted] = usePageBoot((s) => s.getGoogle() && s.getCms());
  const [wpStep, setWpStep] = useState(1);
  const [health, setHealth] = useState({
    gsc: "—",
    ga4: "—",
    psi: "—",
    places: "—",
    lastSync: "—",
  });
  const [siteLimit, setSiteLimit] = useState(5);
  const [editingId, setEditingId] = useState(null);
  const [wp, setWp] = useState({
    site_url: "https://",
    username: "",
    applicationPassword: "",
    defaultPostId: "",
    label: "WordPress",
  });

  const loadHealth = useCallback(async () => {
    const [organic, traffic, psi, places] = await Promise.all([
      loadFeature("organic-search"),
      loadFeature("traffic-analytics"),
      loadFeature("site-audit"),
      loadFeature("local-seo"),
    ]);
    const gsc = featurePayload(organic);
    const ga = featurePayload(traffic);
    const speed = featurePayload(psi);
    const local = featurePayload(places);
    setHealth({
      gsc: featureKpi(gsc, "click", gsc.rows?.length ? `${gsc.rows.length} queries` : "Not synced"),
      ga4: featureKpi(ga, "session", ga.rows?.length ? "Synced" : "Not synced"),
      psi: featureKpi(speed, "performance", speed.rows?.length ? "Synced" : "Not synced"),
      places: String((local.rows || []).length || "0"),
      lastSync: gsc.syncedAt || ga.syncedAt || speed.syncedAt || google?.lastSyncAt || "—",
    });
  }, [google?.lastSyncAt]);

  const load = useCallback(async () => {
    const [g, c] = await Promise.all([getGoogleStatus(), listCmsConnections()]);
    setGoogle(g.data?.connection || null);
    setCms(c.data?.connections || []);
    setSiteLimit(Number(c.data?.limit) || 5);
    setBooted(true);
  }, []);

  useEffect(() => {
    load().then(() => loadHealth());
  }, [load, loadHealth]);

  useEffect(() => {
    if (panel && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (panel === "wordpress") {
      const edit = Number(search?.get("edit") || 0) || null;
      setEditingId(edit);
      setWpStep(1);
      if (edit) {
        const found = cms.find((c) => c.id === edit);
        if (found?.siteUrl) {
          setWp((s) => ({
            ...s,
            site_url: found.siteUrl,
            label: found.label || "WordPress",
            username: found.credentialsMasked?.username || s.username,
          }));
        }
      } else {
        setWp({ site_url: "https://", username: "", applicationPassword: "", defaultPostId: "", label: "WordPress" });
      }
    }
    const flag = search?.get("google");
    if (flag === "connected") {
      try {
        const pending = sessionStorage.getItem("sf_google_site");
        if (pending && !search.get("site")) {
          router.replace(`/app/connections/google?site=${pending}&google=connected&email=${encodeURIComponent(search.get("email") || "")}`);
          return;
        }
      } catch {
        /* ignore */
      }
      toast(`Google signed in${search.get("email") ? ` · ${search.get("email")}` : ""}. Choose Search Console + GA4 below.`);
    } else if (flag === "ads-connected") {
      toast(`Google Ads access granted${search.get("email") ? ` · ${search.get("email")}` : ""}. Pick an Ads account below.`);
    } else if (flag === "error") {
      toast(`Google connect failed: ${search.get("detail") || "unknown"}`);
    }
  }, [panel, search, toast, cms, router]);

  const wpSites = cms.filter((c) => c.provider === "wordpress");
  const wpConn = editingId ? wpSites.find((c) => c.id === editingId) : null;
  const canAddSite = cms.length < siteLimit;
  const googleSignedIn = Boolean(google?.connected || google?.status === "connected");
  const gscOn = Boolean(google?.gscSiteUrl);
  const gaOn = Boolean(google?.ga4PropertyId);
  const pickerSiteId = Number(search?.get("site") || 0) || null;
  const showGooglePicker =
    panel === "google" ||
    panel === "gsc" ||
    panel === "ga4" ||
    search?.get("google") === "connected" ||
    (Boolean(pickerSiteId) && panel !== "ads") ||
    (googleSignedIn && !wpSites.length && (!gscOn || !gaOn) && panel !== "ads");
  const showGoogleAdsPicker = panel === "ads" || search?.get("google") === "ads-connected";

  const siteGoogle = (site) => {
    const meta = site?.meta || {};
    const inherit = wpSites.length <= 1;
    return {
      gsc: meta.gscSiteUrl || (inherit ? google?.gscSiteUrl : "") || "",
      ga4: meta.ga4PropertyId || (inherit ? google?.ga4PropertyId : "") || "",
      ga4Name: meta.ga4PropertyName || (inherit ? google?.ga4PropertyName : "") || "",
      adsId: meta.adsCustomerId || (inherit ? google?.adsCustomerId : "") || "",
      adsName: meta.adsCustomerName || (inherit ? google?.adsCustomerName : "") || "",
    };
  };

  const connectGoogle = async (services = "gsc,ga4,ads") => {
    const value =
      typeof services === "string" && services && !String(services).includes("[object")
        ? services
        : "gsc,ga4,ads";
    setBusy(true);
    const res = await startGoogleOAuth(value);
    setBusy(false);
    if (res.data?.alreadyConnected && !res.data?.url) {
      toast("Google is already connected. Pick Search Console, GA4, or Ads below.");
      router.push(value.includes("ads") ? "/app/connections/ads" : "/app/connections/google");
      return;
    }
    if (res.data?.url) {
      window.location.href = res.data.url;
      return;
    }
    toast(res.data?.detail || "Could not start Google OAuth.");
  };

  const disconnectAllGoogle = async () => {
    if (!window.confirm("Disconnect Google? This removes Search Console, GA4, Ads access, cached reports, and the work queue. Reconnect and sync to start again.")) {
      return;
    }
    setBusy(true);
    const res = await disconnectGoogle();
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Could not disconnect Google.");
      return;
    }
    toast(`Google disconnected. Work queue cleared${res.data?.queueCleared != null ? ` · ${res.data.queueCleared} items` : ""}.`);
    setGoogle(null);
    await load();
    await loadHealth();
    router.push("/app/connections");
  };

  const disconnectAdsAccount = async (cmsConnectionId = null) => {
    if (!window.confirm("Disconnect Google Ads from this workspace? Search Console and GA4 stay connected.")) {
      return;
    }
    setBusy(true);
    const res = await disconnectAds(cmsConnectionId);
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Could not disconnect Google Ads.");
      return;
    }
    toast("Google Ads disconnected.");
    await load();
    router.push("/app/connections");
  };

  const syncAdsAccount = async (cmsConnectionId = null) => {
    setBusy(true);
    const res = await syncAds(cmsConnectionId);
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Ads sync failed.");
      return;
    }
    toast(`Ads synced · ${res.data?.campaigns ?? 0} campaigns`);
    await load();
  };

  const startFresh = async () => {
    if (
      !window.confirm(
        "Start completely fresh?\n\nThis will disconnect Google + WordPress, clear the work queue, and wipe cached GSC/GA4/PageSpeed/Places data (including old site metrics like Refixa).\n\nYou can reconnect afterward.",
      )
    ) {
      return;
    }
    setBusy(true);
    const res = await resetWorkspace();
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Reset failed.");
      return;
    }
    try {
      localStorage.removeItem("sf_setup");
    } catch {
      /* ignore */
    }
    const c = res.data?.cleared || {};
    toast(
      `Fresh start — cleared Google:${c.google || 0} WP:${c.cms || 0} queue:${c.changes || 0} metrics:${c.features || 0}`,
    );
    setGoogle(null);
    setCms([]);
    setHealth({ gsc: "—", ga4: "—", psi: "—", places: "—", lastSync: "—" });
    router.push("/app/setup");
  };

  const syncAll = async () => {
    setBusy(true);
    toast("Syncing GSC + GA4 + PageSpeed + Places + AI enrich… this can take a minute.");
    const res = await syncGoogleLive();
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Sync failed. Connect Google first.");
      return;
    }
    const s = res.data?.synced || {};
    toast(`Live data updated — GSC:${s.gsc ? "✓" : "–"} GA4:${s.ga4 ? "✓" : "–"} PSI:${s.pagespeed ? "✓" : "–"} Places:${s.places ? "✓" : "–"}`);
    await load();
    await loadHealth();
  };

  const doPageSpeed = async () => {
    setBusy(true);
    toast("Running PageSpeed Insights…");
    const res = await runPageSpeed();
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "PageSpeed failed. Check API key + site URL.");
      return;
    }
    const score = res.data?.mobile?.scores?.performance || res.data?.scores?.performance || "ok";
    toast(`PageSpeed updated · mobile performance ${score}`);
    await loadHealth();
  };

  const doPlaces = async () => {
    setBusy(true);
    toast("Syncing Google Places…");
    const res = await syncPlaces();
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Places failed. Check Places API key.");
      return;
    }
    toast(`Places synced (${res.data?.count || 0} listings).`);
    await loadHealth();
  };

  const saveWp = async () => {
    if (!validSiteUrl(wp.site_url)) {
      toast("Enter a valid WordPress site URL (https://…).");
      setWpStep(1);
      return;
    }
    if (!wp.username.trim() || (!editingId && !wp.applicationPassword.trim())) {
      toast("Username and Application Password are required.");
      setWpStep(2);
      return;
    }
    setBusy(true);
    const res = await saveCmsConnection({
      provider: "wordpress",
      label: wp.label || "WordPress",
      site_url: wp.site_url.trim(),
      credentials: {
        username: wp.username.trim(),
        applicationPassword: wp.applicationPassword.trim(),
        defaultPostId: wp.defaultPostId.trim(),
      },
    });
    setBusy(false);
    if (!res.ok) {
      toast(typeof res.data?.detail === "string" ? res.data.detail : "Could not save WordPress.");
      return;
    }
    toast("WordPress connected. Next: attach Search Console and GA4 for this site.");
    setWp((s) => ({ ...s, applicationPassword: "" }));
    setWpStep(3);
    if (res.data?.connection?.id) setActiveSite(res.data.connection.id);
    await load();
    setTimeout(() => router.push("/app/connections"), 900);
  };

  const disconnectWp = async (site) => {
    if (!window.confirm(`Disconnect ${site.siteUrl || "this WordPress site"}? Publishing to it will stop. Google can stay connected.`)) {
      return;
    }
    setBusy(true);
    const res = await deleteCmsConnection(site.id);
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Could not disconnect WordPress.");
      return;
    }
    toast("WordPress disconnected.");
    await load();
    router.push("/app/connections");
  };

  const syncSite = async (site) => {
    setBusy(true);
    toast(`Syncing Search Console, GA4, PageSpeed and Places for ${site.siteUrl || "this site"}…`);
    const res = await syncGoogleLive(site.id);
    setBusy(false);
    if (!res.ok) {
      toast(res.data?.detail || "Sync failed. Connect Google and pick Search Console + GA4 first.");
      return;
    }
    const s = res.data?.synced || {};
    toast(`Synced — GSC:${s.gsc ? "✓" : "–"} GA4:${s.ga4 ? "✓" : "–"} PSI:${s.pagespeed ? "✓" : "–"} Places:${s.places ? "✓" : "–"}`);
    await load();
    await loadHealth();
  };

  if (!booted) return <PageSkeleton />;

  return (
    <>
      <Hero
        label="Integrations"
        line1="GET"
        line2="CONNECTED."
        sub={`Your plan allows ${siteLimit} website projects. Connect WordPress, then attach Search Console, GA4, and Ads to each one.`}
        action={
          <div className="sf-row">
            <Btn onClick={startFresh} disabled={busy}>
              {busy ? "Resetting…" : "Start fresh"}
            </Btn>
            <Btn primary onClick={syncAll} disabled={busy}>
              {busy ? "Updating live data…" : "Sync all Google data"}
            </Btn>
          </div>
        }
      />

      <div className="sf-box sf-gap">
        <div className="sf-row sf-between">
          <div>
            <h2>Connections hub</h2>
            <p>WordPress · Search Console · GA4 · health · reconnect · disconnect</p>
          </div>
          <Pill warn={Boolean(google?.lastError || google?.status === "error")}>
            {google?.lastError || google?.status === "error" ? "Needs reconnect" : "Healthy"}
          </Pill>
        </div>
        <div className="sf-list">
          <div className="sf-listrow" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <div>
              <h3>WordPress</h3>
              <div className="sf-small">{wpSites.length ? `${wpSites.length} site${wpSites.length === 1 ? "" : "s"} connected` : "Not connected"}</div>
            </div>
            {wpSites.length ? (
              <span className="sf-small">Disconnect per site below</span>
            ) : (
              <Btn primary href="/app/connections/wordpress">
                Connect
              </Btn>
            )}
          </div>
          <div className="sf-listrow" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <div>
              <h3>Search Console</h3>
              <div className="sf-small">{gscOn ? google.gscSiteUrl : "Not selected"}</div>
            </div>
            {gscOn ? (
              <Btn href="/app/connections/google">Change</Btn>
            ) : (
              <Btn primary href="/app/connections/google">
                Attach
              </Btn>
            )}
          </div>
          <div className="sf-listrow" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <div>
              <h3>GA4</h3>
              <div className="sf-small">{gaOn ? google.ga4PropertyName || google.ga4PropertyId : "Not selected"}</div>
            </div>
            {gaOn ? (
              <Btn href="/app/connections/google">Change</Btn>
            ) : (
              <Btn primary href="/app/connections/google">
                Attach
              </Btn>
            )}
          </div>
          <div className="sf-listrow" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <div>
              <h3>Google account health</h3>
              <div className="sf-small">
                {google?.lastError || (googleSignedIn ? `Last sync ${String(google?.lastSyncAt || health.lastSync).slice(0, 19)}` : "Disconnected")}
              </div>
            </div>
            <div className="sf-row">
              {googleSignedIn ? (
                <>
                  <Btn onClick={() => (google.lastError ? connectGoogle() : syncAll())} disabled={busy}>
                    {google.lastError ? "Reconnect" : "Sync"}
                  </Btn>
                  <Btn onClick={disconnectAllGoogle} disabled={busy}>
                    Disconnect
                  </Btn>
                </>
              ) : (
                <Btn primary onClick={() => connectGoogle()} disabled={busy}>
                  Connect Google
                </Btn>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="sf-box sf-gap">
        <div className="sf-row sf-between">
          <div>
            <h2>Switching sites?</h2>
            <p style={{ fontSize: 13 }}>
              Old Search Console / GA4 metrics stay cached until you clear them. Use <strong>Start fresh</strong> to
              disconnect everything and empty the work queue, then reconnect WordPress + Google for the new site.
            </p>
          </div>
          <Btn onClick={startFresh} disabled={busy}>
            Disconnect all & clear data
          </Btn>
        </div>
      </div>

      {panel === "wordpress" ? (
        <div className="sf-box sf-ai sf-gap" ref={panelRef} id="sf-wp-connect">
          <div className="sf-row sf-between">
            <h2>{wpConn ? "Manage" : "Connect"} WordPress</h2>
            <Pill neutral>3 steps · Application Password</Pill>
          </div>
          <div className="sf-steps" style={{ marginBottom: 8 }}>
            {[
              { n: 1, label: "Site URL" },
              { n: 2, label: "Credentials" },
              { n: 3, label: "Confirm" },
            ].map((s) => (
              <button
                key={s.n}
                type="button"
                className={`sf-step ${wpStep === s.n ? "active" : ""}`}
                style={{ background: "transparent", border: 0, color: "inherit" }}
                onClick={() => setWpStep(s.n)}
              >
                <span className="sf-stepnum">{wpStep > s.n || (wpConn && s.n < 3) ? "✓" : s.n}</span>
                {s.label}
              </button>
            ))}
          </div>

          {wpStep === 1 ? (
            <>
              <label className="sf-field">
                WordPress site URL
                <input
                  value={wp.site_url}
                  onChange={(e) => setWp({ ...wp, site_url: e.target.value })}
                  placeholder="https://yoursite.com"
                />
              </label>
              <div className="sf-note">Must be the public site root where /wp-json/ is reachable.</div>
              <div className="sf-row sf-between sf-gap">
                <Btn href="/app/connections">Cancel</Btn>
                <Btn
                  primary
                  onClick={() => {
                    if (!validSiteUrl(wp.site_url)) {
                      toast("Enter a valid https:// site URL.");
                      return;
                    }
                    setWpStep(2);
                  }}
                >
                  Continue →
                </Btn>
              </div>
            </>
          ) : null}

          {wpStep === 2 ? (
            <>
              <form className="sf-grid" onSubmit={(e) => e.preventDefault()}>
                <label className="sf-field">
                  Username
                  <input
                    value={wp.username}
                    onChange={(e) => setWp({ ...wp, username: e.target.value })}
                    autoComplete="username"
                  />
                </label>
                <label className="sf-field">
                  Application password
                  <input
                    type="password"
                    value={wp.applicationPassword}
                    onChange={(e) => setWp({ ...wp, applicationPassword: e.target.value })}
                    placeholder={wpConn ? "•••• leave blank to keep" : "WP → Users → Application Passwords"}
                    autoComplete="current-password"
                  />
                </label>
              </form>
              <label className="sf-field">
                Default post/page ID (optional)
                <input value={wp.defaultPostId} onChange={(e) => setWp({ ...wp, defaultPostId: e.target.value })} />
              </label>
              <div className="sf-row sf-between sf-gap">
                <Btn onClick={() => setWpStep(1)}>Back</Btn>
                <Btn
                  primary
                  onClick={() => {
                    if (!wp.username.trim() || (!editingId && !wp.applicationPassword.trim())) {
                      toast("Enter username and Application Password.");
                      return;
                    }
                    setWpStep(3);
                  }}
                >
                  Continue →
                </Btn>
              </div>
            </>
          ) : null}

          {wpStep === 3 ? (
            <>
              <div className="sf-list">
                <div className="sf-listrow" style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <span>Site</span>
                  <span className="sf-small">{wp.site_url}</span>
                </div>
                <div className="sf-listrow" style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <span>Username</span>
                  <span className="sf-small">{wp.username || "—"}</span>
                </div>
                <div className="sf-listrow" style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <span>Publishing scope</span>
                  <span className="sf-small">Titles and descriptions only</span>
                </div>
              </div>
              <div className="sf-note">Nothing publishes until you approve each change in the work queue.</div>
              <div className="sf-row sf-between sf-gap">
                <Btn onClick={() => setWpStep(2)}>Back</Btn>
                <div className="sf-row">
                  {wpConn ? <Btn onClick={() => disconnectWp(wpConn)}>Disconnect</Btn> : null}
                  <Btn primary onClick={saveWp} disabled={busy}>
                    {busy ? "Saving…" : wpConn ? "Save changes" : "Connect WordPress"}
                  </Btn>
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {showGooglePicker ? (
        <div ref={panelRef} className="sf-gap">
          {googleSignedIn ? (
            <GooglePropertyPicker
              google={
                pickerSiteId
                  ? {
                      ...google,
                      gscSiteUrl: siteGoogle(wpSites.find((s) => s.id === pickerSiteId)).gsc,
                      ga4PropertyId: siteGoogle(wpSites.find((s) => s.id === pickerSiteId)).ga4,
                      ga4PropertyName: siteGoogle(wpSites.find((s) => s.id === pickerSiteId)).ga4Name,
                    }
                  : google
              }
              cmsConnectionId={pickerSiteId}
              siteLabel={wpSites.find((s) => s.id === pickerSiteId)?.siteUrl || ""}
              onSaved={async () => {
                try {
                  sessionStorage.removeItem("sf_google_site");
                } catch {
                  /* ignore */
                }
                await load();
                await loadHealth();
                router.replace("/app/connections");
              }}
            />
          ) : (
            <div className="sf-box sf-ai sf-gap">
              <div className="sf-row sf-between">
                <h2>Connect Google</h2>
                <Pill neutral>One sign-in</Pill>
              </div>
              <p>Sign in once. Then choose Search Console and GA4 properties. Analytics and Search Console stay read-only.</p>
              <div className="sf-row sf-between sf-gap">
                <Btn href="/app/connections">Cancel</Btn>
                <Btn primary onClick={() => connectGoogle()} disabled={busy}>
                  Connect with Google
                </Btn>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {showGoogleAdsPicker ? (
        <div ref={panelRef} className="sf-gap">
          {googleSignedIn ? (
            <GoogleAdsPicker
              google={
                pickerSiteId
                  ? {
                      ...google,
                      adsCustomerId: siteGoogle(wpSites.find((s) => s.id === pickerSiteId)).adsId,
                      adsCustomerName: siteGoogle(wpSites.find((s) => s.id === pickerSiteId)).adsName,
                    }
                  : google
              }
              cmsConnectionId={pickerSiteId}
              siteLabel={wpSites.find((s) => s.id === pickerSiteId)?.siteUrl || ""}
              onSaved={async () => {
                await load();
                router.replace("/app/ads");
              }}
            />
          ) : (
            <div className="sf-box sf-ai sf-gap">
              <div className="sf-row sf-between">
                <h2>Connect Google Ads</h2>
                <Pill neutral>Needs Google first</Pill>
              </div>
              <p>Sign in with Google once for Search Console, GA4, and Ads. After that, only pick the Ads customer.</p>
              <div className="sf-row sf-gap">
                <Btn href="/app/connections">Back</Btn>
                <Btn primary onClick={() => connectGoogle("gsc,ga4,ads")} disabled={busy}>
                  Connect Google
                </Btn>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="sf-three sf-gap">
        <div className="sf-box">
          <div className="sf-small">Search Console</div>
          <div className="sf-metric" style={{ fontSize: 28 }}>{health.gsc}</div>
          <Pill>{gscOn ? "Connected" : "Connect"}</Pill>
        </div>
        <div className="sf-box">
          <div className="sf-small">GA4 / PageSpeed</div>
          <div className="sf-metric" style={{ fontSize: 28 }}>{health.ga4} · {health.psi}</div>
          <Pill neutral>Live APIs</Pill>
        </div>
        <div className="sf-box">
          <div className="sf-small">Places listings</div>
          <div className="sf-metric">{health.places}</div>
          <span className="sf-small">Last sync: {String(health.lastSync).slice(0, 19)}</span>
        </div>
      </div>

      <div className="sf-box sf-gap">
        <div className="sf-row sf-between">
          <div>
            <h2>Projects · {wpSites.length} / {siteLimit}</h2>
            <p>Each website is a project. Open them here, or switch the active project from the left sidebar.</p>
          </div>
          {canAddSite ? (
            <Btn primary href="/app/connections/wordpress">
              Connect another site
            </Btn>
          ) : (
            <Pill warn>Limit reached</Pill>
          )}
        </div>
      </div>

      <div className="sf-list sf-gap">
        {wpSites.length ? (
          wpSites.map((site) => {
            const g = siteGoogle(site);
            return (
              <div className="sf-listrow" key={site.id}>
                <div>
                  <div className="sf-row" style={{ marginBottom: 8 }}>
                    <span className="sf-connectlogo">W</span>
                    <h3>{site.label || "WordPress"}</h3>
                    <Pill>{site.status === "connected" ? "WordPress connected" : site.status}</Pill>
                  </div>
                  <div className="sf-small">{site.siteUrl}</div>
                  <div className="sf-small">
                    Search Console · {g.gsc || "Not selected"}
                    {" · "}
                    GA4 · {g.ga4Name || g.ga4 || "Not selected"}
                    {" · "}
                    Ads · {g.adsName || g.adsId || "Not selected"}
                  </div>
                </div>
                <div className="sf-row" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {googleSignedIn ? (
                    <Btn href={`/app/connections/google?site=${site.id}`}>
                      {g.gsc ? "Change GSC / GA4" : "Attach Search Console"}
                    </Btn>
                  ) : (
                    <Btn
                      onClick={() => {
                        try {
                          sessionStorage.setItem("sf_google_site", String(site.id));
                        } catch {
                          /* ignore */
                        }
                        router.push("/app/connections/google");
                      }}
                    >
                      Connect Google
                    </Btn>
                  )}
                  <Btn href={`/app/connections/ads?site=${site.id}`}>
                    {g.adsId ? "Change Ads" : "Attach Ads"}
                  </Btn>
                  <Btn onClick={() => syncSite(site)} disabled={busy || !googleSignedIn}>
                    Sync
                  </Btn>
                  <Btn href={`/app/connections/wordpress?edit=${site.id}`}>Manage</Btn>
                  <Btn onClick={() => disconnectWp(site)} disabled={busy}>
                    Disconnect
                  </Btn>
                </div>
              </div>
            );
          })
        ) : (
          <div className="sf-listrow">
            <div>
              <h3>No WordPress sites yet</h3>
              <p>Connect up to {siteLimit} websites. Then attach Search Console and GA4 to each one.</p>
            </div>
            <Btn primary href="/app/connections/wordpress">
              Connect WordPress
            </Btn>
          </div>
        )}
        <div className="sf-listrow">
          <div className="sf-row" style={{ flexWrap: "nowrap" }}>
            <span className="sf-connectlogo">G</span>
            <div>
              <h3>Google</h3>
              <p>One Google sign-in for the workspace. Then attach Search Console + GA4 on each website and sync reports.</p>
              {google?.googleEmail ? <div className="sf-small">{google.googleEmail}</div> : null}
              {google?.gscSiteUrl ? <div className="sf-small">Search Console · {google.gscSiteUrl}</div> : null}
              {google?.ga4PropertyName || google?.ga4PropertyId ? (
                <div className="sf-small">GA4 · {google.ga4PropertyName || google.ga4PropertyId}</div>
              ) : null}
            </div>
          </div>
          {googleSignedIn ? (
            <div className="sf-row">
              <Pill>{gscOn && gaOn ? "Connected" : "Pick properties"}</Pill>
              <Btn href="/app/connections/google">Manage</Btn>
              <Btn onClick={disconnectAllGoogle} disabled={busy}>
                Disconnect
              </Btn>
            </div>
          ) : (
            <Btn primary href="/app/connections/google">
              Connect
            </Btn>
          )}
        </div>
        <div className="sf-listrow">
          <div className="sf-row" style={{ flexWrap: "nowrap" }}>
            <span className="sf-connectlogo">P</span>
            <div>
              <h3>PageSpeed Insights</h3>
              <p>Mobile and desktop performance scores for your site URL.</p>
              <div className="sf-small">Current mobile score: {health.psi}</div>
            </div>
          </div>
          <Btn onClick={doPageSpeed} disabled={busy}>
            Run PageSpeed
          </Btn>
        </div>
        <div className="sf-listrow">
          <div className="sf-row" style={{ flexWrap: "nowrap" }}>
            <span className="sf-connectlogo">L</span>
            <div>
              <h3>Google Places</h3>
              <p>Nearby / related local business listings for Local SEO.</p>
              <div className="sf-small">{health.places} listings stored</div>
            </div>
          </div>
          <Btn onClick={doPlaces} disabled={busy}>
            Sync Places
          </Btn>
        </div>
      </div>

      <div className="sf-box sf-gap">
        <div className="sf-row sf-between">
          <div>
            <h2>Google Ads</h2>
            <p>
              {google?.adsCustomerName || google?.adsCustomerId
                ? `${google.adsCustomerName || "Account"} · ${google.adsCustomerId}`
                : "Uses the Google account already connected. Pick the Ads customer — no second Google sign-in."}
            </p>
            {google?.adsScope ? <div className="sf-small">Ads permission granted</div> : null}
            {!google?.adsConfigured ? (
              <div className="sf-small">Server still needs GOOGLE_ADS_DEVELOPER_TOKEN from Ads → API Center.</div>
            ) : null}
          </div>
          <div className="sf-row" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
            {google?.adsCustomerId ? (
              <>
                <Btn href="/app/connections/ads">Change account</Btn>
                <Btn onClick={() => syncAdsAccount()} disabled={busy}>
                  Sync Ads
                </Btn>
                <Btn href="/app/ads">Open Ads</Btn>
                <Btn onClick={() => disconnectAdsAccount()} disabled={busy}>
                  Disconnect Ads
                </Btn>
              </>
            ) : (
              <Btn primary href="/app/connections/ads">
                Connect Google Ads
              </Btn>
            )}
          </div>
        </div>
      </div>

      <div className="sf-box sf-gap">
        <h3>You control the permissions</h3>
        <p>
          Analytics, Search Console, and Google Ads are read-only. Website edits require approval. OpenAI is used only
          for drafts you review. Google Tag Manager is not a separate connector — tag events appear through GA4 when
          configured.
        </p>
      </div>

      <div className="sf-row sf-gap">
        <Btn href="/app/setup">Explore 3-step setup flow</Btn>
        <Btn href="/app/results">Open performance →</Btn>
      </div>
    </>
  );
}
