import { FEATURES } from "@/lib/featureCatalog";

export const RESEARCH = [
  { group: "Research", path: "/dashboard", kind: "seo-dashboard", title: "Dashboard", description: "SEO dashboard widgets for this project." },
  { group: "Research", path: "/SEOranking", kind: "keyword-ranking", title: "Keywords", description: "Rank cards and the keyword table." },
  { group: "Research", path: "/keywordanalyze/home", kind: "keyword-analyze", title: "Keyword Analyze", description: "Search keywords and save groups." },
  { group: "Research", path: "/websitekeyword/home", kind: "website-keywords", title: "Website Keywords", description: "Organic and paid keywords for a domain." },
  { group: "Research", path: "/keywordgeneretor/home", kind: "generate-keywords", title: "Generate Keywords", description: "Keyword ideas with volume and visits." },
  { group: "Research", path: "/organicsearch/home", kind: "organic-research", title: "Organic Traffic Insights", description: "Domain organic keywords and pages from the stored index." },
  { group: "Research", path: "/trafficsAnalytics/home", kind: "traffic-home", title: "Research Traffic", description: "Weekly research crawl sessions for the project." },
  { group: "Research", path: "/keywordgap/home", kind: "keyword-gap", title: "Keyword Gap", description: "Keywords you miss against competitors." },
  { group: "Research", path: "/keywordmannager/home", kind: "keyword-manager", title: "Keyword Manager", description: "Your lists and lists shared with you." },
  { group: "Research", path: "/keywordoverview/home", kind: "keyword-metrics", title: "Keyword Overview", description: "Volume, difficulty, and intent." },
  { group: "Research", path: "/domainoverview/home", kind: "domain-snapshot", title: "Domain Overview", description: "A domain-level SEO snapshot." },
  { group: "Research", path: "/backlink/home", kind: "backlink-analytics", title: "Backlink Analytics", description: "Referring links and the filtered detail view." },
];

export const START = [
  { group: "Start", path: "/works", title: "My works", description: "Project catalog for the sites you track." },
  { group: "Start", path: "/seooptimization", title: "Site optimization", description: "Crawl a saved site and review the page." },
];

const GROUPS = {
  "website-overview": "Overview",
  "domain-snapshot": "Overview",
  "get-started": "Overview",
  "google-services": "Overview",
  "seo-dashboard": "Overview",
  "keyword-ranking": "Keywords",
  "keyword-analyze": "Keywords",
  "website-keywords": "Keywords",
  "generate-keywords": "Keywords",
  "keyword-gap": "Keywords",
  "keyword-manager": "Keywords",
  "keyword-metrics": "Keywords",
  "topic-research": "Keywords",
  "topic-finder": "Keywords",
  "paid-search": "Keywords",
  "traffic-home": "Traffic",
  "traffic-analytics": "Traffic",
  "market-overview": "Traffic",
  "top-pages": "Traffic",
  "ga4-landing-pages": "Traffic",
  "competitor-monitoring": "Traffic",
  "traffic-distribution": "Traffic",
  "referral": "Traffic",
  "organic-search": "Traffic",
  "gsc-countries": "Traffic",
  "gsc-devices": "Traffic",
  "organic-research": "Traffic",
  "organic-social": "Traffic",
  "ai-search": "AI",
  "ai-search-audit": "AI",
  "ai-visibility-report": "AI",
  "ai-traffic": "AI",
  "ai-analysis": "AI",
  "visibility-overview": "AI",
  "competitor-research": "AI",
  "prompt-research": "AI",
  "prompt-tracking": "AI",
  "seo-writing": "AI",
  "ai-article": "AI",
  "brand-performance": "AI",
  "brand-perception": "AI",
  "brand-narrative": "AI",
  "brand-questions": "AI",
  "backlink-analytics": "Links",
  "backlinks": "Links",
  "referring-domains": "Links",
  "backlink-audit": "Links",
  "link-building": "Links",
  "on-page-seo": "Site",
  "site-audit": "Site",
  "position-tracking": "Site",
  "seo-operator": "Site",
  "cms-connectors": "Site",
  "change-history": "Site",
  "outcome-monitor": "Site",
  "local-dashboard": "Local",
  "local-listings": "Local",
  "local-reviews": "Local",
  "local-gbp": "Local",
  "local-automations": "Local",
  "local-ai-agent": "Local",
  "local-competitors": "Local",
  "local-map-ranks": "Local",
  "content-dashboard": "Content",
  "seo-content-template": "Content",
  "content-creation": "Content",
  "content-optimizer": "Content",
  "content-repurposing": "Content",
  "seo-brief": "Content",
  "my-content": "Content",
};

const TITLES = {
  "traffic-analytics": "Market traffic",
  "organic-search": "Search Console",
  "google-services": "Google hub",
  "site-audit": "PageSpeed",
  "local-competitors": "Places",
};

const ORDER = ["Start", "Overview", "Keywords", "Traffic", "AI", "Links", "Site", "Local", "Content"];

function place(item) {
  return {
    ...item,
    group: GROUPS[item.kind] || item.group,
    title: TITLES[item.kind] || item.title,
  };
}

export function groupFor(kind) {
  return GROUPS[kind] || "Overview";
}

export const ALL_TOOLS = [...START, ...RESEARCH, ...FEATURES].map(place);

export function groupsOf(items) {
  const groups = [];
  items.forEach((item) => {
    const found = groups.find((group) => group.name === item.group);
    if (found) found.items.push(item);
    else groups.push({ name: item.group, items: [item] });
  });
  return groups.sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));
}
