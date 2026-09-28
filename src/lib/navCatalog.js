import { FEATURES } from "@/lib/featureCatalog";
import { RESEARCH, START } from "@/lib/tools";

/**
 * Semrush-style rail + flyout. Each path appears once across primary product rails.
 * Reports only lists Start + Account (not a second copy of every tool).
 */
export const NAV = [
  {
    id: "home",
    label: "Home",
    path: "/home",
    icon: "home",
    panels: [],
  },
  {
    id: "seo",
    label: "SEO",
    icon: "seo",
    panels: [
      {
        title: "Dashboard",
        items: [
          { title: "Dashboard", path: "/dashboard", kind: "seo-dashboard" },
          { title: "Domain Overview", path: "/domainoverview/home", kind: "domain-snapshot" },
        ],
      },
      {
        title: "Site Performance",
        items: [
          { title: "Site Audit", path: "/site/audit", kind: "site-audit" },
          { title: "Position Tracking", path: "/site/positions", kind: "position-tracking" },
          { title: "On Page SEO Checker", path: "/site/on-page", kind: "on-page-seo" },
          { title: "SEO Operator", path: "/operator", kind: "seo-operator" },
          { title: "Organic Traffic Insights", path: "/organicsearch/home", kind: "organic-research" },
        ],
      },
      {
        title: "Competitive Analysis",
        items: [
          { title: "Organic Rankings", path: "/SEOranking", kind: "keyword-ranking" },
          { title: "Keyword Gap", path: "/keywordgap/home", kind: "keyword-gap" },
          { title: "Backlink Analytics", path: "/backlink/home", kind: "backlink-analytics" },
        ],
      },
      {
        title: "Keyword Research",
        items: [
          { title: "Keyword Overview", path: "/keywordoverview/home", kind: "keyword-metrics" },
          { title: "Keyword Analyze", path: "/keywordanalyze/home", kind: "keyword-analyze" },
          { title: "Website Keywords", path: "/websitekeyword/home", kind: "website-keywords" },
          { title: "Generate Keywords", path: "/keywordgeneretor/home", kind: "generate-keywords" },
          { title: "Keyword Manager", path: "/keywordmannager/home", kind: "keyword-manager" },
        ],
      },
      {
        title: "Content Ideas",
        items: [
          { title: "SEO Writing Assistant", path: "/writing/assistant", kind: "seo-writing" },
          { title: "Topic Research", path: "/writing/topics", kind: "topic-research" },
          { title: "SEO Content Template", path: "/writing/template", kind: "seo-content-template" },
        ],
      },
      {
        title: "Link Building",
        items: [
          { title: "Link Building Tool", path: "/links/building", kind: "link-building" },
          { title: "Backlinks", path: "/links/backlinks", kind: "backlinks" },
          { title: "Referring Domains", path: "/links/referring-domains", kind: "referring-domains" },
          { title: "Backlink Audit", path: "/links/audit", kind: "backlink-audit" },
        ],
      },
    ],
  },
  {
    id: "ai",
    label: "AI",
    icon: "ai",
    panels: [
      {
        title: "AI Visibility",
        items: [
          { title: "AI Analysis", path: "/visibility/analysis", kind: "ai-analysis" },
          { title: "Visibility Overview", path: "/visibility/overview", kind: "visibility-overview" },
          { title: "Competitor Research", path: "/visibility/competitors", kind: "competitor-research" },
          { title: "Prompt Research", path: "/visibility/prompts", kind: "prompt-research" },
        ],
      },
      {
        title: "Brand Performance",
        items: [
          { title: "Brand Performance", path: "/brand/performance", kind: "brand-performance" },
          { title: "Perception", path: "/brand/perception", kind: "brand-perception" },
          { title: "Narrative Drivers", path: "/brand/narrative", kind: "brand-narrative" },
          { title: "Questions", path: "/brand/questions", kind: "brand-questions" },
        ],
      },
      {
        title: "Boost & Monitor",
        items: [
          { title: "Prompt Tracking", path: "/monitor/prompts", kind: "prompt-tracking" },
          { title: "Content Creation", path: "/monitor/content", kind: "content-creation" },
        ],
      },
      {
        title: "AI Search",
        items: [
          { title: "AI Search", path: "/ai-search", kind: "ai-search" },
          { title: "AI Search Audit", path: "/ai-search/audit", kind: "ai-search-audit" },
          { title: "AI Search Visibility Report", path: "/ai-search/report", kind: "ai-visibility-report" },
        ],
      },
    ],
  },
  {
    id: "traffic",
    label: "Traffic & Market",
    icon: "traffic",
    panels: [
      {
        title: "Get Started",
        items: [
          { title: "Get Started", path: "/market/get-started", kind: "get-started" },
          { title: "Google Services", path: "/market/google-services", kind: "google-services" },
        ],
      },
      {
        title: "Traffic Analytics",
        items: [
          { title: "Traffic Analytics", path: "/market/traffic-analytics", kind: "traffic-analytics" },
          { title: "Traffic Distribution", path: "/market/traffic-distribution", kind: "traffic-distribution" },
          { title: "GA4 Landing Pages", path: "/market/ga4-landing-pages", kind: "ga4-landing-pages" },
          { title: "AI Traffic", path: "/market/ai-traffic", kind: "ai-traffic" },
          { title: "Referral", path: "/market/referral", kind: "referral" },
          { title: "Research Traffic", path: "/trafficsAnalytics/home", kind: "traffic-home" },
        ],
      },
      {
        title: "Market Research",
        items: [
          { title: "Market Overview", path: "/market/overview", kind: "market-overview" },
          { title: "Top Pages", path: "/market/top-pages", kind: "top-pages" },
          { title: "Competitor Monitoring", path: "/market/competitor-monitoring", kind: "competitor-monitoring" },
        ],
      },
      {
        title: "Channels",
        items: [
          { title: "Organic Search", path: "/market/organic-search", kind: "organic-search" },
          { title: "GSC by Country", path: "/market/gsc-countries", kind: "gsc-countries" },
          { title: "GSC by Device", path: "/market/gsc-devices", kind: "gsc-devices" },
          { title: "Paid Search", path: "/market/paid-search", kind: "paid-search" },
          { title: "Organic Social", path: "/market/organic-social", kind: "organic-social" },
        ],
      },
    ],
  },
  {
    id: "local",
    label: "Local",
    icon: "local",
    panels: [
      {
        title: "Local",
        items: [
          { title: "Dashboard", path: "/local", kind: "local-dashboard" },
          { title: "Listing Management", path: "/local/listings", kind: "local-listings" },
          { title: "Review Management", path: "/local/reviews", kind: "local-reviews" },
          { title: "GBP Optimization", path: "/local/gbp", kind: "local-gbp" },
          { title: "Automations", path: "/local/automations", kind: "local-automations" },
          { title: "GBP AI Agent", path: "/local/ai-agent", kind: "local-ai-agent" },
          { title: "Competitive Analysis", path: "/local/competitors", kind: "local-competitors" },
          { title: "Map Rank Tracker", path: "/local/map-ranks", kind: "local-map-ranks" },
        ],
      },
    ],
  },
  {
    id: "content",
    label: "Content",
    icon: "content",
    panels: [
      {
        title: "Content",
        items: [
          { title: "Content Dashboard", path: "/content", kind: "content-dashboard" },
          { title: "AI Article Generator", path: "/content/article", kind: "ai-article" },
          { title: "Content Optimizer", path: "/content/optimizer", kind: "content-optimizer" },
          { title: "Content Repurposing", path: "/content/repurpose", kind: "content-repurposing" },
          { title: "Topic Finder", path: "/content/topics", kind: "topic-finder" },
          { title: "SEO Brief Generator", path: "/content/brief", kind: "seo-brief" },
          { title: "My Content", path: "/content/library", kind: "my-content" },
        ],
      },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: "reports",
    panels: [
      {
        title: "Start",
        items: START.map((item) => ({ title: item.title, path: item.path })),
      },
      {
        title: "Account",
        items: [
          { title: "Account", path: "/UserProfile" },
          { title: "Announcements", path: "/news" },
          { title: "AI features catalog", path: "/features" },
        ],
      },
    ],
  },
];

/** Palette search: unique paths from nav, then any FEATURES/RESEARCH routes not already listed. */
export function flatNavItems() {
  const seen = new Set();
  const items = [];
  const push = (item) => {
    if (!item?.path || seen.has(item.path)) return;
    seen.add(item.path);
    items.push(item);
  };
  push({ title: "Home", path: "/home", group: "Home" });
  NAV.forEach((rail) => {
    rail.panels.forEach((panel) => {
      panel.items.forEach((item) => {
        push({ ...item, group: rail.label, section: panel.title, description: panel.title });
      });
    });
  });
  [...START, ...RESEARCH, ...FEATURES].forEach((item) => {
    push({ ...item, group: item.group || "Workspace", section: item.group });
  });
  return items;
}

export function activeRailId(pathname) {
  if (!pathname || pathname === "/home") return "home";
  if (pathname.startsWith("/operator")) return "seo";
  if (pathname.startsWith("/market") || pathname.startsWith("/trafficsAnalytics")) return "traffic";
  if (pathname.startsWith("/ai-search") || pathname.startsWith("/visibility") || pathname.startsWith("/monitor") || pathname.startsWith("/brand")) return "ai";
  if (pathname.startsWith("/local")) return "local";
  if (pathname.startsWith("/content") || pathname.startsWith("/writing") || pathname.startsWith("/features")) return "content";
  if (pathname.startsWith("/UserProfile") || pathname.startsWith("/news") || pathname.startsWith("/admin")) return "reports";
  for (const rail of NAV) {
    if (rail.path && pathname === rail.path) return rail.id;
    for (const panel of rail.panels) {
      for (const item of panel.items) {
        if (pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path + "/"))) return rail.id;
        if (item.path === "/seooptimization" && pathname.startsWith("/seooptimization")) return rail.id;
      }
    }
  }
  return "seo";
}
