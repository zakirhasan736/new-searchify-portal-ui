"use client";

import { useEffect, useState } from "react";

/** Latest confirmed SEO target market from the dashboard region selector. */
export default function useTargetMarket() {
  const [market, setMarket] = useState(null);

  useEffect(() => {
    const onMarket = (event) => setMarket(event.detail || null);
    window.addEventListener("sf-market", onMarket);
    return () => window.removeEventListener("sf-market", onMarket);
  }, []);

  const country = market?.countryIso || market?.countryName || "";
  const label = market?.countryName || market?.label || country || "";
  return { market, country, label, language: market?.language || "en", ready: Boolean(country) };
}
