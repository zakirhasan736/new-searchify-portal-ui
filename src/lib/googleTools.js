/** Maps tool kinds to Google live sources + conceptual UI mode. */
export const GOOGLE_TOOLS = {
  "get-started": { source: "OAuth", label: "Google connect", path: "/market/get-started" },
  "google-services": { source: "Hub", label: "All Google services", path: "/market/google-services" },
  "organic-search": { source: "Search Console", label: "GSC queries", path: "/market/organic-search" },
  "organic-research": { source: "Search Console", label: "GSC research", path: "/organicsearch/home" },
  "website-keywords": { source: "Search Console", label: "GSC keywords", path: "/websitekeyword/home" },
  "top-pages": { source: "Search Console", label: "GSC pages", path: "/market/top-pages" },
  "gsc-countries": { source: "Search Console", label: "GSC countries", path: "/market/gsc-countries" },
  "gsc-devices": { source: "Search Console", label: "GSC devices", path: "/market/gsc-devices" },
  "traffic-analytics": { source: "GA4", label: "GA4 sessions", path: "/market/traffic-analytics" },
  "traffic-home": { source: "GA4", label: "GA4 daily", path: "/trafficsAnalytics/home" },
  "traffic-distribution": { source: "GA4", label: "GA4 channels", path: "/market/traffic-distribution" },
  "ga4-landing-pages": { source: "GA4", label: "GA4 landings", path: "/market/ga4-landing-pages" },
  referral: { source: "GA4", label: "GA4 referral", path: "/market/referral" },
  "ai-traffic": { source: "GA4", label: "AI referrers", path: "/market/ai-traffic" },
  "position-tracking": { source: "Search Console", label: "GSC positions", path: "/site/positions" },
  "topic-research": { source: "GSC + OpenAI", label: "Topic clusters", path: "/writing/topics" },
  "topic-finder": { source: "GSC + OpenAI", label: "Topic ideas", path: "/content/topics" },
  "generate-keywords": { source: "GSC + OpenAI", label: "Keyword expand", path: "/keywordgeneretor/home" },
  "prompt-research": { source: "GSC + OpenAI", label: "Prompt ideas", path: "/visibility/prompts" },
  "prompt-tracking": { source: "GSC + OpenAI", label: "Prompt set", path: "/monitor/prompts" },
  "ai-analysis": { source: "GSC/GA4 + OpenAI", label: "AI narrative", path: "/visibility/analysis" },
  "ai-visibility-report": { source: "GSC/GA4 + OpenAI", label: "Visibility report", path: "/ai-search/report" },
  "brand-narrative": { source: "GSC/GA4 + OpenAI", label: "Brand narrative", path: "/brand/narrative" },
  "seo-operator": { source: "Operator", label: "Approve → CMS → monitor", path: "/operator" },
  "cms-connectors": { source: "CMS", label: "WP · Shopify · Webflow · custom", path: "/operator" },
  "change-history": { source: "Operator", label: "Applied changes", path: "/operator" },
  "outcome-monitor": { source: "GSC", label: "Post-change outcomes", path: "/operator" },
  "site-audit": { source: "PageSpeed", label: "Core Web Vitals", path: "/site/audit" },
  "on-page-seo": { source: "Crawl + PSI", label: "On-page checks", path: "/site/on-page" },
  "local-dashboard": { source: "Places", label: "Local snapshot", path: "/local" },
  "local-listings": { source: "Places", label: "Listings", path: "/local/listings" },
  "local-reviews": { source: "Places", label: "Reviews", path: "/local/reviews" },
  "local-gbp": { source: "Places", label: "GBP checklist", path: "/local/gbp" },
  "local-automations": { source: "Places", label: "Automations", path: "/local/automations" },
  "local-ai-agent": { source: "Places + AI", label: "AI replies", path: "/local/ai-agent" },
  "local-competitors": { source: "Places", label: "Places rivals", path: "/local/competitors" },
  "local-map-ranks": { source: "Places", label: "Map pack", path: "/local/map-ranks" },
  "seo-dashboard": { source: "Composite", label: "GSC · GA4 · PSI", path: "/dashboard" },
  "visibility-overview": { source: "Composite", label: "Visibility signals", path: "/visibility/overview" },
  "domain-snapshot": { source: "Composite", label: "Domain live snapshot", path: "/domainoverview/home" },
};

export function googleMeta(kind) {
  return GOOGLE_TOOLS[kind] || null;
}

export function isGoogleLiveKind(kind) {
  return Boolean(GOOGLE_TOOLS[kind]);
}
