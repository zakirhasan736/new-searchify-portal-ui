"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import RegionSelector from "@/components/board/RegionSelector";
import { briefFromAnswers } from "@/lib/businessBrief";
import { activeJourneySite, loadJourney, readySites, selectJourneySite, websiteLabel } from "@/lib/journey";
import { clearPageSites, loadPageSites, pageScope, saveGlobalSite, setPageSiteKey } from "@/lib/siteScope";
import { getActiveSite, listCmsConnections, setActiveSite, useGoogleAccount } from "@/lib/v1Api";

function hostOfUrl(value) {
  const raw = String(value || "").replace(/^sc-domain:/i, "").trim();
  if (!raw) return "";
  try {
    const href = raw.startsWith("http") ? raw : `https://${raw}`;
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^www\./, "");
  }
}

function websiteOptions(journeySites, connections) {
  const connected = (connections || [])
    .filter((item) => item.status === "connected")
    .map((item) => ({
      key: `cms:${item.id}`,
      kind: "cms",
      id: item.id,
      label: hostOfUrl(item.siteUrl || item.site_url) || item.label || `Site ${item.id}`,
      siteUrl: item.siteUrl || item.site_url || "",
      answers: {},
    }));
  const seen = new Set(connected.map((item) => item.label));
  const added = journeySites.map((site, index) => {
    const named = websiteLabel(site);
    const answers = site.answers || {};
    return {
      key: `journey:${site.id}`,
      kind: "journey",
      id: site.id,
      label: named === "Website" ? `Website ${index + 1}` : named,
      siteUrl: answers.site || "",
      answers,
    };
  }).filter((item) => !seen.has(item.label));
  return [...connected, ...added];
}

function selectedOption(options, pathname) {
  const scope = pageScope(pathname);
  const saved = scope ? loadPageSites()[scope] : null;
  const localKey = typeof saved === "string" ? saved : saved?.key || "";
  const state = loadJourney();
  const activeJourney = String(activeJourneySite(state)?.id || "");
  const savedCms = getActiveSite();
  return options.find((item) => localKey && item.key === localKey)
    || options.find((item) => item.kind === "cms" && String(item.id) === String(savedCms))
    || options.find((item) => item.kind === "journey" && String(item.id) === activeJourney)
    || options[0]
    || null;
}

export default function WebsiteBar({ pill, onChange }) {
  const pathname = usePathname() || "/app";
  const scope = pageScope(pathname);
  const [sites, setSites] = useState([]);
  const [activeKey, setActiveKey] = useState("example");
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const ready = readySites(loadJourney());
    const apply = (options) => {
      setSites(options);
      const current = selectedOption(options, pathname);
      if (current) {
        setActiveKey(current.key);
        const local = Boolean(pageScope(pathname));
        if (!local) {
          saveGlobalSite(current);
          if (current.kind === "journey" && current.answers?.googleEmail) {
            useGoogleAccount(current.answers.googleEmail).catch(() => {});
          }
        }
        window.dispatchEvent(new CustomEvent("sf-site", {
          detail: {
            id: current.id,
            label: current.label,
            key: current.key,
            siteUrl: current.siteUrl || "",
            scope: pageScope(pathname),
            local,
          },
        }));
      } else onChangeRef.current?.("Example website");
    };
    listCmsConnections()
      .then((res) => apply(websiteOptions(ready, res.data?.connections)))
      .catch(() => apply(websiteOptions(ready, [])));
  }, [pathname]);

  const chooseSite = (event) => {
    const option = sites.find((item) => item.key === event.target.value);
    if (!option) return;
    setActiveKey(option.key);
    if (scope) {
      setPageSiteKey(scope, option);
      window.dispatchEvent(new CustomEvent("sf-site", {
        detail: { id: option.id, label: option.label, key: option.key, siteUrl: option.siteUrl || "", scope, local: true },
      }));
    } else {
      clearPageSites();
      saveGlobalSite(option);
      if (option.kind === "journey") {
        selectJourneySite(option.id);
        if (option.answers?.googleEmail) useGoogleAccount(option.answers.googleEmail).catch(() => {});
      } else setActiveSite(option.id);
      window.dispatchEvent(new CustomEvent("sf-site", {
        detail: { id: option.id, label: option.label, key: option.key, siteUrl: option.siteUrl || "", scope: "", local: false },
      }));
    }
    onChange?.(option.label);
  };

  const demo = sites.length === 0;
  const selected = sites.find((item) => item.key === activeKey);
  const statusPill = pill || (demo
    ? "DEMO DATA · THIS SESSION ONLY"
    : selected?.kind === "cms"
      ? "CONNECTED WEBSITE"
      : briefFromAnswers(selected?.answers).ready
        ? "FROM YOUR SETUP"
        : "SETUP INCOMPLETE");

  return (
    <div className="workspace-bar" data-tour="website">
      <div className="workspace-controls">
        <div>
          <label htmlFor="active-site">Website
            <select id="active-site" value={demo ? "example" : activeKey} onChange={chooseSite}>
              {demo ? <option value="example">Example website</option> : sites.map((site) => (
                <option key={site.key} value={site.key}>{site.label}</option>
              ))}
            </select>
          </label>
          <span className="site-scope-note">{scope ? "This page only" : "Applies to every page"}</span>
        </div>
        <RegionSelector
          siteUrl={selected?.siteUrl || (selected?.label && selected.label !== "Example website" ? `https://${selected.label}` : "")}
          siteId={selected?.kind === "journey" ? selected.id : null}
          disabled={demo}
        />
      </div>
      <span className="demo-pill">{statusPill}</span>
    </div>
  );
}
