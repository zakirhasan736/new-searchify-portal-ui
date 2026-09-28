/**
 * Topic-specific Semrush-style page kits.
 * Every kind must define its own search mode, result label, views, and actions —
 * never fall back to a shared generic kit.
 */
const KITS = {
  "website-overview": {
    search: "domain",
    resultLabel: "overview metrics",
    views: ["Overview", "Traffic", "Audience", "Sources"],
    actions: [["competitors", "Compare"]],
  },
  "seo-dashboard": {
    search: "domain",
    resultLabel: "dashboard widgets",
    views: ["Overview", "AI Search", "Rankings", "Audit"],
    actions: [["competitors", "Compare projects"]],
  },
  "domain-snapshot": {
    search: "domain",
    resultLabel: "domain metrics",
    views: ["Overview", "Organic", "Backlinks", "Authority"],
    actions: [["competitors", "Compare domains"]],
  },
  "get-started": {
    search: "domain",
    resultLabel: "setup steps",
    views: ["Checklist", "Integrations", "First crawl"],
    actions: [],
  },
  "google-services": {
    search: "domain",
    resultLabel: "connected services",
    views: ["Hub", "GSC", "GA4", "Speed"],
    actions: [],
  },
  "gsc-countries": {
    search: "domain",
    resultLabel: "countries",
    views: ["Countries", "Clicks", "Impressions"],
    actions: [],
  },
  "gsc-devices": {
    search: "domain",
    resultLabel: "devices",
    views: ["Devices", "Clicks", "CTR"],
    actions: [],
  },
  "ga4-landing-pages": {
    search: "domain",
    resultLabel: "landing pages",
    views: ["Pages", "Sessions", "Bounce"],
    actions: [["web-list", "Save page list"]],
  },
  "keyword-ranking": {
    search: "keyword",
    resultLabel: "ranked keywords",
    views: ["Overview", "Organic", "Positions", "SERP features"],
    actions: [["group", "Save ranking group"]],
  },
  "keyword-analyze": {
    search: "keyword",
    resultLabel: "keyword groups",
    views: ["Groups", "Lists", "Shared", "Ideas"],
    actions: [["group", "New list"]],
  },
  "website-keywords": {
    search: "domain",
    resultLabel: "site keywords",
    views: ["Organic", "Paid", "Branded", "Pages"],
    actions: [["web-list", "Save keyword list"]],
  },
  "generate-keywords": {
    search: "keyword",
    resultLabel: "keyword ideas",
    views: ["Ideas", "Questions", "Related", "Volume"],
    actions: [["web-list", "Save idea list"]],
  },
  "keyword-gap": {
    search: "domain",
    resultLabel: "gap keywords",
    views: ["Missing", "Shared", "Untapped", "Weak"],
    actions: [["competitors", "Compare list"]],
  },
  "keyword-manager": {
    search: "keyword",
    resultLabel: "keyword lists",
    views: ["All lists", "My own", "Shared with me"],
    actions: [
      ["share", "Share"],
      ["list", "Create list"],
    ],
  },
  "keyword-metrics": {
    search: "keyword",
    resultLabel: "keyword metrics",
    views: ["Overview", "Intent", "SERP", "History"],
    actions: [["group", "Save metrics"]],
  },
  "topic-research": {
    search: "keyword",
    resultLabel: "topic clusters",
    views: ["Clusters", "Headlines", "Questions", "Related"],
    actions: [["group", "Save cluster"]],
  },
  "topic-finder": {
    search: "keyword",
    resultLabel: "topic ideas",
    views: ["Ideas", "Gaps", "Difficulty", "Volume"],
    actions: [["group", "Save topics"]],
  },
  "traffic-home": {
    search: "domain",
    resultLabel: "daily sessions",
    views: ["Trend", "Audience", "Geography", "Devices"],
    actions: [["competitors", "Create list"]],
  },
  "traffic-analytics": {
    search: "domain",
    resultLabel: "traffic sessions",
    views: ["Overview", "Sources", "Landing pages", "Geography"],
    actions: [["competitors", "Create list"]],
  },
  "market-overview": {
    search: "domain",
    resultLabel: "market share rows",
    views: ["Share", "Growth", "Leaders", "Categories"],
    actions: [["competitors", "Create list"]],
  },
  "top-pages": {
    search: "domain",
    resultLabel: "landing pages",
    views: ["Pages", "Landing", "Exit", "Conversions"],
    actions: [["web-list", "Save page list"]],
  },
  "competitor-monitoring": {
    search: "domain",
    resultLabel: "monitored competitors",
    views: ["Overlap", "Traffic", "Keywords", "Weekly changes"],
    actions: [["competitors", "Create list"]],
  },
  "traffic-distribution": {
    search: "domain",
    resultLabel: "channel shares",
    views: ["Channels", "Devices", "Countries", "Trend"],
    actions: [],
  },
  "ai-traffic": {
    search: "domain",
    resultLabel: "AI referral sessions",
    views: ["Sources", "Sessions", "Trend", "Landing pages"],
    actions: [],
  },
  "referral": {
    search: "domain",
    resultLabel: "referring sites",
    views: ["Sources", "Medium", "Pages", "Trend"],
    actions: [],
  },
  "organic-search": {
    search: "keyword",
    resultLabel: "Search Console queries",
    views: ["Queries", "Pages", "Countries", "Devices"],
    actions: [["web-list", "Save query list"]],
  },
  "organic-research": {
    search: "domain",
    resultLabel: "organic keywords",
    views: ["Keywords", "Pages", "Competitors", "Positions"],
    actions: [["web-list", "Save keyword list"]],
  },
  "paid-search": {
    search: "keyword",
    resultLabel: "paid keywords",
    views: ["Keywords", "Ads", "Cost", "Positions"],
    actions: [["web-list", "Save paid list"]],
  },
  "organic-social": {
    search: "domain",
    resultLabel: "social sessions",
    views: ["Networks", "Posts", "Referrals", "Trend"],
    actions: [],
  },
  "ai-search": {
    search: "keyword",
    resultLabel: "AI answer prompts",
    views: ["Mentions", "Links", "Sources", "Trend"],
    actions: [["group", "Save prompts"]],
  },
  "ai-search-audit": {
    search: "domain",
    resultLabel: "AI crawl findings",
    views: ["Issues", "Pages", "Fixes", "Score"],
    actions: [],
  },
  "ai-visibility-report": {
    search: "keyword",
    resultLabel: "visibility report rows",
    views: ["Summary", "Prompts", "Competitors", "Sources"],
    actions: [],
  },
  "ai-analysis": {
    search: "keyword",
    resultLabel: "analysis runs",
    views: ["Runs", "Mentions", "Summaries", "Actions"],
    actions: [],
  },
  "visibility-overview": {
    search: "domain",
    resultLabel: "visibility surfaces",
    views: ["Search", "AI answers", "Cited pages", "Trend"],
    actions: [],
  },
  "competitor-research": {
    search: "domain",
    resultLabel: "competitor AI keywords",
    views: ["Keywords", "Prompts", "Overlap", "Gaps"],
    actions: [["competitors", "Compare list"]],
  },
  "prompt-research": {
    search: "keyword",
    resultLabel: "prompt ideas",
    views: ["Ideas", "Answers stored", "Sources", "Intent"],
    actions: [["group", "Save prompts"]],
  },
  "prompt-tracking": {
    search: "keyword",
    resultLabel: "tracked prompts",
    views: ["Mentions", "Links", "History", "Alerts"],
    actions: [["group", "Save tracked set"]],
  },
  "brand-performance": {
    search: "keyword",
    resultLabel: "brand metrics",
    views: ["Mentions", "Share of voice", "Linked answers", "Trend"],
    actions: [],
  },
  "brand-perception": {
    search: "keyword",
    resultLabel: "perception themes",
    views: ["Themes", "Tone", "Share", "Sources"],
    actions: [],
  },
  "brand-narrative": {
    search: "keyword",
    resultLabel: "narrative drivers",
    views: ["Drivers", "Mentions", "Trend", "Prompts"],
    actions: [],
  },
  "brand-questions": {
    search: "keyword",
    resultLabel: "brand questions",
    views: ["Questions", "Mentioned", "Sources", "Gaps"],
    actions: [["group", "Save questions"]],
  },
  "backlink-analytics": {
    search: "domain",
    resultLabel: "backlink rows",
    views: ["Backlinks", "Referring domains", "Anchors", "New / Lost"],
    actions: [["competitors", "Compare"]],
  },
  "backlinks": {
    search: "domain",
    resultLabel: "indexed backlinks",
    views: ["Backlinks", "Anchors", "Follow", "TLD"],
    actions: [],
  },
  "referring-domains": {
    search: "domain",
    resultLabel: "referring domains",
    views: ["Domains", "Authority", "New", "Lost"],
    actions: [],
  },
  "backlink-audit": {
    search: "domain",
    resultLabel: "flagged links",
    views: ["Toxic", "Review", "Safe", "History"],
    actions: [],
  },
  "link-building": {
    search: "domain",
    resultLabel: "outreach prospects",
    views: ["Prospects", "Outreach", "Status", "Notes"],
    actions: [["list", "Create prospect list"]],
  },
  "on-page-seo": {
    search: "domain",
    resultLabel: "on-page checks",
    views: ["Ideas", "Content", "Technical", "SERP"],
    actions: [],
  },
  "site-audit": {
    search: "domain",
    resultLabel: "audit findings",
    views: ["Overview", "Opportunities", "SEO", "Accessibility", "GSC"],
    actions: [],
  },
  "position-tracking": {
    search: "keyword",
    resultLabel: "tracked keywords",
    views: ["Overview", "Rankings", "SERP features", "Cannibalization"],
    actions: [["group", "Save tracking group"]],
  },
  "seo-operator": {
    search: "domain",
    resultLabel: "operator steps",
    views: ["Pipeline", "Queue", "Applied", "Monitoring"],
    actions: [],
  },
  "cms-connectors": {
    search: "domain",
    resultLabel: "CMS connectors",
    views: ["WordPress", "Shopify", "Webflow", "Custom"],
    actions: [],
  },
  "change-history": {
    search: "domain",
    resultLabel: "site changes",
    views: ["All", "Applied", "Awaiting", "Failed"],
    actions: [],
  },
  "outcome-monitor": {
    search: "domain",
    resultLabel: "monitored outcomes",
    views: ["Active", "Improved", "Flat", "Needs review"],
    actions: [],
  },
  "local-dashboard": {
    search: "domain",
    resultLabel: "local metrics",
    views: ["Overview", "Map pack", "Reviews", "Listings"],
    actions: [],
  },
  "local-listings": {
    search: "domain",
    resultLabel: "directory listings",
    views: ["Directories", "Accuracy", "Status", "Sync"],
    actions: [],
  },
  "local-reviews": {
    search: "domain",
    resultLabel: "review periods",
    views: ["Reviews", "Ratings", "Replies", "Trend"],
    actions: [],
  },
  "local-gbp": {
    search: "domain",
    resultLabel: "GBP checklist items",
    views: ["Categories", "Photos", "Posts", "Q&A"],
    actions: [],
  },
  "local-automations": {
    search: "domain",
    resultLabel: "local automations",
    views: ["Active", "Paused", "Schedule", "Logs"],
    actions: [],
  },
  "local-ai-agent": {
    search: "keyword",
    resultLabel: "suggested replies",
    views: ["Suggestions", "Drafts", "Waiting", "Sent"],
    actions: [],
  },
  "local-competitors": {
    search: "domain",
    resultLabel: "nearby competitors",
    views: ["Map", "Ratings", "Reviews", "Distance"],
    actions: [["competitors", "Compare"]],
  },
  "local-map-ranks": {
    search: "keyword",
    resultLabel: "map pack keywords",
    views: ["Keywords", "Positions", "Changes", "Grid"],
    actions: [["group", "Save map set"]],
  },
  "content-dashboard": {
    search: "keyword",
    resultLabel: "content pieces",
    views: ["Pipeline", "Approved", "In review", "Draft"],
    actions: [["list", "Create list"]],
  },
  "my-content": {
    search: "keyword",
    resultLabel: "library items",
    views: ["All", "Draft", "Approved", "Published"],
    actions: [["list", "Create list"]],
  },
  "content-creation": {
    search: "keyword",
    resultLabel: "monitor pieces",
    views: ["Briefs", "Drafts", "Scores", "Publish queue"],
    actions: [],
  },
  "ai-article": {
    search: "keyword",
    resultLabel: "article drafts",
    views: ["Drafts", "Briefs", "Outline", "Waiting for writer"],
    actions: [],
  },
  "content-optimizer": {
    search: "domain",
    resultLabel: "page scores",
    views: ["Needs approval", "Approved", "Score", "Suggestions"],
    actions: [],
  },
  "content-repurposing": {
    search: "keyword",
    resultLabel: "repurpose jobs",
    views: ["Queued", "Draft", "Formats", "Source"],
    actions: [],
  },
  "seo-brief": {
    search: "keyword",
    resultLabel: "SEO briefs",
    views: ["Stored", "Draft", "Keywords", "Headings"],
    actions: [],
  },
  "seo-writing": {
    search: "keyword",
    resultLabel: "writing drafts",
    views: ["Drafts", "In review", "Waiting for writer", "Published"],
    actions: [],
  },
  "seo-content-template": {
    search: "keyword",
    resultLabel: "content templates",
    views: ["Templates", "Headings", "Ready", "Draft"],
    actions: [],
  },
};

export function featuresFor(kind) {
  const kit = KITS[kind];
  if (!kit) {
    return {
      search: "domain",
      resultLabel: `${kind || "tool"} rows`,
      views: ["Overview", "Details", "History"],
      actions: [["feed", "Add feed"]],
    };
  }
  return kit;
}

export function allFeatureKinds() {
  return Object.keys(KITS);
}
