"use client";

import { useEffect, useRef, useState } from "react";
import { getMarket, saveMarket } from "@/lib/v1Api";
import { researchApi } from "@/store/researchApi";
import { useDispatch } from "react-redux";

const FALLBACK = [
  { iso: "CA", name: "Canada", flag: "🇨🇦" },
  { iso: "US", name: "United States", flag: "🇺🇸" },
  { iso: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { iso: "AU", name: "Australia", flag: "🇦🇺" },
  { iso: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { iso: "IN", name: "India", flag: "🇮🇳" },
  { iso: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
];

export default function RegionSelector({ siteUrl = "", siteId = null, disabled = false }) {
  const dispatch = useDispatch();
  const [countries, setCountries] = useState(FALLBACK);
  const [market, setMarket] = useState(null);
  const [confirmedIso, setConfirmedIso] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const req = useRef(0);

  useEffect(() => {
    if (!siteUrl && !siteId) {
      setMarket(null);
      setConfirmedIso("");
      return undefined;
    }
    const id = ++req.current;
    setError("");
    getMarket({ site: siteUrl, siteId })
      .then((res) => {
        if (id !== req.current) return;
        if (!res.ok) {
          setError(typeof res.data?.detail === "string" ? res.data.detail : "Market could not be loaded.");
          return;
        }
        const next = res.data.market || null;
        setMarket(next);
        setConfirmedIso(next?.countryIso || "");
        if (Array.isArray(res.data.countries) && res.data.countries.length) setCountries(res.data.countries);
        window.dispatchEvent(new CustomEvent("sf-market", { detail: next }));
      })
      .catch(() => {
        if (id === req.current) setError("Market could not be loaded.");
      });
    return () => { req.current += 1; };
  }, [siteUrl, siteId]);

  const choose = async (event) => {
    const iso = event.target.value;
    if (!iso || iso === confirmedIso || busy) return;
    const previous = confirmedIso;
    setConfirmedIso(iso);
    setBusy(true);
    setError("");
    const res = await saveMarket({ site: siteUrl, siteId, countryIso: iso });
    setBusy(false);
    if (!res.ok) {
      setConfirmedIso(previous);
      setError(typeof res.data?.detail === "string" ? res.data.detail : "Could not save the target market.");
      return;
    }
    const next = res.data.market;
    setMarket(next);
    setConfirmedIso(next.countryIso || iso);
    dispatch(researchApi.util.invalidateTags(["Usage"]));
    dispatch(researchApi.util.resetApiState());
    window.dispatchEvent(new CustomEvent("sf-market", { detail: next }));
    window.dispatchEvent(new CustomEvent("sf-journey"));
  };

  const selected = countries.find((row) => row.iso === confirmedIso) || null;
  const hint = !confirmedIso && market?.domainSuggestion
    ? `Suggested from the domain: ${countries.find((c) => c.iso === market.domainSuggestion)?.name || market.domainSuggestion}`
    : market?.source === "domain" && !market?.explicit
      ? "Suggested from the domain. Change it if this is not your SEO market."
      : "SEO target market for research and reports";

  return (
    <div className="region-selector" data-tour="region">
      <label htmlFor="active-region">
        Region
        <span className="region-select-wrap">
          <span className="region-flag" aria-hidden="true">{selected?.flag || "🌎"}</span>
          <select
            id="active-region"
            value={confirmedIso}
            onChange={choose}
            disabled={disabled || busy || (!siteUrl && !siteId)}
          >
            <option value="">{market?.needsChoice ? "Choose target market…" : "No market set"}</option>
            {countries.map((row) => (
              <option key={row.iso} value={row.iso}>{row.flag} {row.name}</option>
            ))}
          </select>
        </span>
      </label>
      <span className="site-scope-note">{error || hint}</span>
    </div>
  );
}
