/** Client-side prototype feeds — used when API is empty or user is signed out. */
export const DEMO_SEED_VERSION = "2026-09-24-multi-v1";

export const DEMO_SITES = [
  { domain: "searchify.example", url: "https://searchify.example", label: "Searchify" },
  { domain: "demo-local.example", url: "https://demo-local.example", label: "Demo Local" },
  { domain: "shop-north.example", url: "https://shop-north.example", label: "Shop North" },
];

const RIVALS = ["astra-rank.example", "rivalmetrics.example", "growthcheck.example"];

const KW = [
  "seo software",
  "site audit",
  "keyword gap",
  "backlink tool",
  "content brief",
  "rank tracker",
  "on page seo",
  "ai visibility",
  "seo agency near me",
  "gbp optimization",
];

function rec(kind, title, summary, columns, rows, panels = null) {
  return {
    id: `demo-${kind}`,
    kind,
    title,
    status: "stored",
    createdAt: new Date().toISOString(),
    payload: {
      summary,
      columns,
      rows,
      panels,
      seedVersion: DEMO_SEED_VERSION,
    },
  };
}

function forSites(columns, buildRows) {
  const cols = ["Site", ...columns];
  const rows = DEMO_SITES.flatMap((site, siteIndex) =>
    buildRows(site, siteIndex).map((row) => [site.domain, ...row]),
  );
  return { columns: cols, rows };
}

function metricPanels(siteIndex) {
  const base = 14000 + siteIndex * 2200;
  return {
    trend: [
      ["Sep 1", base - 2000],
      ["Sep 8", base - 1200],
      ["Sep 15", base - 400],
      ["Sep 22", base],
    ],
    trendLabels: ["Sessions"],
    countries: [
      ["United States", `${30 - siteIndex}%`, String(4000 + siteIndex * 400)],
      ["United Kingdom", "14%", String(1800 + siteIndex * 100)],
      ["Nigeria", "11%", String(1200 + siteIndex * 80)],
      ["Canada", "8%", String(900 + siteIndex * 60)],
    ],
    devices: [
      ["Desktop", `${56 - siteIndex}%`],
      ["Mobile", `${39 + siteIndex}%`],
      ["Tablet", "5%"],
    ],
  };
}

/** Build a full demo record list for a feature kind. */
export function demoFeatures(kind) {
  const builders = {
    "domain-snapshot": () => {
      const { columns, rows } = forSites(["Metric", "Value", "Benchmark"], (site, i) => [
        ["Authority", String(42 - i * 4), "Niche avg 38"],
        ["Organic keywords", String(1280 - i * 320), `+${84 - i * 10} MoM`],
        ["Referring domains", String(86 - i * 20), `+${6 - i} MoM`],
        ["Organic traffic", String(18420 - i * 4200), `+${12 - i}% WoW`],
        ["AI mentions", String(28 - i * 8), `+${9 - i * 2} MoM`],
        ["Site health", `${72 - i * 6}%`, "Audit"],
      ]);
      return [
        rec(
          kind,
          "Domain Overview",
          "Prototype domain snapshots for 3 project sites.",
          columns,
          rows,
          { score: 42, scoreLabel: "Authority", ...metricPanels(0) },
        ),
      ];
    },
    "site-audit": () => {
      const { columns, rows } = forSites(["Check", "Severity", "Count", "Sample URL"], (site, i) => [
        ["Missing titles", "Error", String(14 + i * 3), "/docs"],
        ["Missing meta descriptions", "Error", String(22 + i * 4), "/features"],
        ["Broken links", "Error", String(4 + i), "/old-guide"],
        ["Slow pages", "Warning", String(8 + i * 2), "/pricing"],
        ["Thin content", "Notice", String(11 + i * 2), "/docs"],
        ["Images missing alt", "Notice", String(19 - i), "/"],
      ]);
      return [rec(kind, "Site Audit", "Site-wide crawl findings per project site.", columns, rows, { score: 72, scoreLabel: "Site health", audit: [["Errors", "40"], ["Warnings", "23"], ["Notices", "35"]] })];
    },
    "position-tracking": () => {
      const { columns, rows } = forSites(["Keyword", "Position", "Change", "URL", "Volume"], (site, i) =>
        KW.slice(0, 8).map((kw, ki) => [kw, String(3 + ((ki + i) % 20)), ki % 2 ? "+1" : "-1", ki % 3 === 0 ? "/" : "/blog", String(1200 + ki * 800)]),
      );
      return [
        rec(kind, "Position Tracking", "Rank history across 3 sites and shared keywords.", columns, rows, {
          heatmap: KW.slice(0, 5).map((kw, i) => [kw, [1, 2, 2, 3, 3].map((n) => Math.min(4, n + (i % 2)))]),
          buckets: ["51–100", "21–50", "11–20", "4–10", "1–3"],
          distribution: [["Top 3", "14"], ["Top 10", "52"], ["Top 20", "110"], ["Top 100", "340"]],
          trend: [["Sep 1", 0.08], ["Sep 8", 0.09], ["Sep 15", 0.11], ["Sep 22", 0.12]],
          trendLabels: ["Visibility %"],
        }),
      ];
    },
    "keyword-ranking": () => {
      const { columns, rows } = forSites(["Keyword", "Position", "Change", "URL", "Volume"], (site, i) =>
        KW.slice(0, 8).map((kw, ki) => [kw, String(3 + ((ki + i) % 20)), ki % 2 ? "+1" : "-1", ki % 3 === 0 ? "/" : "/blog", String(1200 + ki * 800)]),
      );
      return [
        rec(kind, "Keywords", "Rank cards across 3 sites and shared keywords.", columns, rows, {
          heatmap: KW.slice(0, 5).map((kw, i) => [kw, [1, 2, 2, 3, 3].map((n) => Math.min(4, n + (i % 2)))]),
          buckets: ["51–100", "21–50", "11–20", "4–10", "1–3"],
          distribution: [["1–3", "2"], ["4–10", "2"], ["11–20", "3"], ["21–50", "3"], ["51–100", "0"]],
        }),
      ];
    },
    "keyword-gap": () => {
      const { columns, rows } = forSites(["Keyword", "Competitor", "Their position", "Volume", "Opportunity"], (site, i) =>
        [
          ["seo audit tool", RIVALS[0], "3", "2400", "High"],
          ["serp tracker", RIVALS[0], "4", "2200", "High"],
          ["content optimizer", RIVALS[1], "5", "1300", "High"],
          ["local seo software", RIVALS[2], "6", "1600", "Med"],
          ["ai overview tracking", RIVALS[1], "8", "900", "Med"],
        ].map((row) => row),
      );
      return [rec(kind, "Keyword Gap", "Gaps vs rivals for each project site.", columns, rows, { kpis: [["Gaps", "15"], ["High opp.", "9"], ["Sites", "3"]] })];
    },
    "keyword-metrics": () => {
      const { columns, rows } = forSites(["Keyword", "Volume", "Difficulty", "CPC", "Intent"], () =>
        KW.slice(0, 8).map((kw, i) => [kw, String(1900 + i * 1100), String(29 + i * 2), `$${(2.4 + i * 0.3).toFixed(2)}`, i % 2 ? "Commercial" : "Informational"]),
      );
      return [rec(kind, "Keyword Overview", "Volume and difficulty for shared keywords across sites.", columns, rows)];
    },
    "keyword-analyze": () => {
      const { columns, rows } = forSites(["Group", "Keywords", "Count", "List"], () => [
        ["Brand", "searchify, seo workspace", "3", "Brand terms"],
        ["Pricing", "pricing, plans, cost", "4", "Content gaps"],
        ["Local", "seo agency near me, gbp", "2", "Local set"],
        ["AI", "ai visibility, ai search", "2", "AI set"],
        ["Links", "backlink tool, audit", "3", "Link set"],
      ]);
      return [rec(kind, "Keyword Analyze", "Keyword groups per project site.", columns, rows)];
    },
    "website-keywords": () => {
      const { columns, rows } = forSites(["Keyword", "Type", "Position", "Volume", "URL"], (site, i) =>
        KW.slice(0, 6).map((kw, ki) => [kw, ki === 2 ? "Paid" : "Organic", String(4 + ki + i), String(2000 + ki * 900), ki ? "/pricing" : "/"]),
      );
      return [rec(kind, "Website Keywords", "Organic and paid terms for each site.", columns, rows)];
    },
    "generate-keywords": () => {
      const { columns, rows } = forSites(["Keyword", "Volume", "Difficulty", "Visits", "Parent topic"], () => [
        ["technical seo checklist", "2400", "34", "640", "Audit"],
        ["on page seo", "8100", "41", "1200", "Audit"],
        ["ai search optimization", "1300", "28", "210", "AI"],
        ["internal linking", "3600", "32", "480", "Content"],
        ["serp tracker", "2200", "45", "180", "Ranks"],
        ["map pack ranking", "1600", "38", "140", "Local"],
      ]);
      return [rec(kind, "Generate Keywords", "Idea lists tied to each site’s content gaps.", columns, rows)];
    },
    "keyword-manager": () => {
      const { columns, rows } = forSites(["List", "Keywords", "Access", "Updated", "Used in"], () => [
        ["Brand terms", "12", "Owner", "2026-09-20", "Position Tracking"],
        ["Content gaps", "28", "Owner", "2026-09-22", "Topic Finder"],
        ["Local set", "14", "Owner", "2026-09-15", "Map Rank Tracker"],
        ["AI set", "11", "Editor", "2026-09-19", "Prompt Tracking"],
        ["Shared research", "9", "Viewer", "2026-09-18", "Keyword Analyze"],
      ]);
      return [rec(kind, "Keyword Manager", "Lists owned per project site.", columns, rows)];
    },
    "organic-research": () => {
      const { columns, rows } = forSites(["Keyword", "Position", "Volume", "URL", "Traffic est."], (site, i) =>
        KW.slice(0, 7).map((kw, ki) => [kw, String(6 + ki + i), String(1900 + ki * 1000), ki % 2 ? "/blog/audit" : "/", String(120 + ki * 80)]),
      );
      return [rec(kind, "Organic Traffic Insights", "Organic keywords and pages per site.", columns, rows, { kpis: [["Keywords", "1280"], ["Traffic est.", "2920"], ["Top 10", "52"]] })];
    },
    "organic-search": () => {
      const { columns, rows } = forSites(["Query", "Clicks", "Impressions", "CTR", "Position", "Page"], (site, i) =>
        KW.slice(0, 8).map((kw, ki) => [kw, String(24 + ki * 12 - i), String(700 + ki * 300), `${(2.2 + ki * 0.2).toFixed(1)}%`, String(6 + ki), ki ? "/pricing" : "/"]),
      );
      return [
        rec(kind, "Organic Search", "Search Console–style queries for each property.", columns, rows, {
          kpis: [["Clicks", "729"], ["Impressions", "21400"], ["CTR", "3.4%"], ["Avg. position", "9.1"]],
          trend: [["Sep 1", 140, 4200], ["Sep 8", 168, 4800], ["Sep 15", 192, 5400], ["Sep 22", 229, 7000]],
          trendLabels: ["Clicks", "Impressions"],
        }),
      ];
    },
    "backlink-analytics": () => {
      const { columns, rows } = forSites(["Source", "Target", "Anchor", "Change", "Authority"], (site, i) => [
        [`news.industry/story-${i}`, "/", "brand", "New", "61"],
        [`seo-journal.com/guide`, "/pricing", "plans", "New", "48"],
        [`partner-docs.io/p`, "/docs", "docs", i ? "Lost" : "Flat", "44"],
        [`forum.webmaster/t`, "/docs", "help", "New", "29"],
        [`growth-blogs.net/x`, "/features", site.label.toLowerCase(), "New", "36"],
      ]);
      return [rec(kind, "Backlink Analytics", "New/lost links per project site.", columns, rows, { kpis: [["Authority", "42"], ["New links", "18"], ["Lost links", "4"], ["Referring domains", "86"]] })];
    },
    backlinks: () => {
      const { columns, rows } = forSites(["Source", "Target", "Anchor", "Type", "First seen"], (site, i) => [
        [`news.industry/story-${i}`, "/", "brand", "Follow", "2026-08-12"],
        [`seo-journal.com/guide`, "/pricing", "plans", "Follow", "2026-08-20"],
        [`partner-docs.io/p`, "/docs", "docs", "Nofollow", "2026-07-01"],
        [`forum.webmaster/t`, "/docs", "help", "Follow", "2026-06-18"],
        [`growth-blogs.net/x`, "/features", site.label.toLowerCase(), "Follow", "2026-09-02"],
      ]);
      return [rec(kind, "Backlinks", "Indexed backlinks per project site.", columns, rows, { kpis: [["Backlinks", "128"], ["New", "12"], ["Lost", "3"], ["Domains", "7"]] })];
    },
    "referring-domains": () => {
      const { columns, rows } = forSites(["Domain", "Links", "Authority", "New/Lost", "Traffic referral"], () => [
        ["news.industry", "4", "61", "New", "96 sessions"],
        ["seo-journal.com", "3", "48", "New", "64 sessions"],
        ["partner-docs.io", "2", "44", "Flat", "41 sessions"],
        ["forum.webmaster", "1", "29", "Lost 1", "28 sessions"],
        ["growth-blogs.net", "1", "36", "New", "—"],
      ]);
      return [rec(kind, "Referring Domains", "Linking domains aligned across sites.", columns, rows)];
    },
    "backlink-audit": () => {
      const { columns, rows } = forSites(["Source", "Flag", "Authority", "Action"], () => [
        ["spam-links.net/dir", "Toxic", "8", "Disavow"],
        ["forum.webmaster/old", "Review", "29", "Open"],
        ["partner-network.io/case", "Safe", "55", "Keep"],
        ["news.industry/story", "Safe", "61", "Keep"],
        ["expired-links.biz/x", "Toxic", "4", "Disavow"],
      ]);
      return [rec(kind, "Backlink Audit", "Flagged links per site for review.", columns, rows, { score: 64, scoreLabel: "Link health", audit: [["Review", "1"], ["Toxic", "2"], ["Safe", "3"]] })];
    },
    "link-building": () => {
      const { columns, rows } = forSites(["Domain", "Authority", "Status", "Topic", "Contact"], () => [
        ["seo-journal.com", "48", "Prospect", "SEO checklist", "editor@seo-journal.com"],
        ["news.industry", "61", "Contacted", "Site audit", "tips@news.industry"],
        ["partner-docs.io", "44", "Replied", "Rank tracker", "partners@partner-docs.io"],
        ["growth-blogs.net", "36", "Prospect", "on page seo", "hello@growth-blogs.net"],
        ["marketing-roundup.io", "52", "Outreach draft", "ai visibility", "pitch@marketing-roundup.io"],
      ]);
      return [rec(kind, "Link Building", "Prospects per project site.", columns, rows)];
    },
    "on-page-seo": () => {
      const { columns, rows } = forSites(["Check", "Result", "Priority", "URL"], (site, i) => [
        ["Title", "Present", "OK", i ? "/pricing" : "/"],
        ["H1", "Present", "OK", i ? "/pricing" : "/"],
        ["Canonical", i ? "Missing" : "Present", i ? "High" : "OK", "/pricing"],
        ["Meta description", "Thin", "Med", "/pricing"],
        ["Schema", "Missing", "Med", "/features"],
        ["Word count", String(420 + i * 80), "Med", "/docs"],
      ]);
      return [rec(kind, "On Page SEO Checker", "URL checks for each project site.", columns, rows, { score: 68, scoreLabel: "Page score", audit: [["Passed", "3"], ["Failed", "2"], ["Warnings", "3"]] })];
    },
    "traffic-analytics": () => {
      const { columns, rows } = forSites(["Metric", "Value", "WoW", "Note"], (site, i) => [
        ["Sessions", String(18420 - i * 4200), `+${12 - i}%`, "All channels"],
        ["Users", String(12004 - i * 2800), `+${9 - i}%`, "Unique"],
        ["Engagement rate", `${61 - i}%`, "+3%", ""],
        ["Bounce rate", `${38 + i}%`, "-2%", ""],
        ["Pages / session", (2.4 - i * 0.1).toFixed(1), "+0.1", ""],
        ["Avg. duration", `00:0${2 - i}:14`, "+8s", ""],
      ]);
      return [rec(kind, "Traffic Analytics", "Engagement metrics per project site.", columns, rows, metricPanels(0))];
    },
    "traffic-distribution": () => {
      const { columns, rows } = forSites(["Channel", "Sessions", "Share", "WoW"], (site, i) => [
        ["Organic Search", String(8473 - i * 900), "46%", "+4%"],
        ["Direct", String(4052 - i * 400), "22%", "+1%"],
        ["Paid Search", String(2026 - i * 200), "11%", "-2%"],
        ["Referral", String(1658 - i * 150), "9%", "0%"],
        ["Organic Social", String(1289 - i * 100), "7%", "+3%"],
        ["Email", String(922 - i * 80), "5%", "+1%"],
      ]);
      return [rec(kind, "Traffic Distribution", "Channel mix per site.", columns, rows)];
    },
    "traffic-home": () => {
      const { columns, rows } = forSites(["Week", "Sessions", "Users", "Pages/session"], (site, i) => [
        ["2026-09-01", String(2140 - i * 200), String(1610 - i * 120), "2.1"],
        ["2026-09-08", String(2388 - i * 200), String(1702 - i * 120), "2.2"],
        ["2026-09-15", String(2510 - i * 200), String(1844 - i * 120), "2.3"],
        ["2026-09-22", String(2662 - i * 200), String(1910 - i * 120), "2.4"],
      ]);
      return [rec(kind, "Research Traffic", "Weekly research crawl sessions per site.", columns, rows, metricPanels(0))];
    },
    "ai-traffic": () => {
      const { columns, rows } = forSites(["Source", "Sessions", "Share", "Top landing", "Trend"], () => [
        ["ChatGPT", "186", "49%", "/", "Up"],
        ["Perplexity", "74", "19%", "/blog/audit", "Up"],
        ["Gemini", "41", "11%", "/docs", "Flat"],
        ["Copilot", "28", "7%", "/pricing", "New"],
        ["AI Overview", "22", "6%", "/features", "Up"],
      ]);
      return [rec(kind, "AI Traffic", "AI referral sessions per site.", columns, rows)];
    },
    referral: () => {
      const { columns, rows } = forSites(["Source", "Medium", "Sessions", "Share", "Also links?"], () => [
        ["news.industry", "referral", "96", "34%", "Yes"],
        ["seo-journal.com", "referral", "64", "23%", "Yes"],
        ["partner-docs.io", "referral", "41", "15%", "Yes"],
        ["forum.webmaster", "referral", "28", "10%", "Lost link"],
        ["producthunt.com", "referral", "22", "8%", "No"],
      ]);
      return [rec(kind, "Referral", "Referring sites per project.", columns, rows)];
    },
    "market-overview": () => {
      const { columns, rows } = forSites(["Competitor", "Share", "Traffic", "Trend", "Overlap"], (site, i) => [
        [site.domain, `${18 - i * 2}%`, String(18420 - i * 4200), "+2%", "—"],
        [RIVALS[0], "27%", "31200", "+1%", "42 KW"],
        [RIVALS[1], "14%", "12100", "-1%", "28 KW"],
        [RIVALS[2], "11%", "9800", "0%", "19 KW"],
      ]);
      return [rec(kind, "Market Overview", "Category share for each project site.", columns, rows)];
    },
    "top-pages": () => {
      const { columns, rows } = forSites(["Page", "Clicks", "Sessions", "CTR", "Position", "Status"], (site, i) => [
        ["/", String(640 - i * 80), String(4100 - i * 500), "4.2%", "8.1", "Strong"],
        ["/pricing", String(210 - i * 30), String(1840 - i * 200), "3.1%", "11.4", "Optimize"],
        ["/blog/audit", String(186 - i * 20), String(1510 - i * 150), "3.8%", "6.2", "Strong"],
        ["/docs", String(120 - i * 15), String(980 - i * 100), "2.9%", "14.0", "Thin"],
        ["/features", String(96 - i * 10), String(720 - i * 80), "2.4%", "16.2", "Gap"],
        ["/local", String(74 - i * 8), String(510 - i * 60), "3.0%", "9.5", "Local"],
      ]);
      return [rec(kind, "Top Pages", "Landing pages per site from GSC + analytics prototype.", columns, rows, { kpis: [["Pages", "18"], ["Clicks", "3200"], ["Sessions", "22000"]] })];
    },
    "competitor-monitoring": () => {
      const { columns, rows } = forSites(["Domain", "Overlap", "Traffic", "Visibility", "Week", "Alert"], () => [
        [RIVALS[0], "42 keywords", "31200", "0.21%", "This week", "Gained 6 KW"],
        [RIVALS[1], "28 keywords", "12100", "0.09%", "This week", "Lost 2 KW"],
        [RIVALS[2], "19 keywords", "9800", "0.07%", "Last week", "Flat"],
      ]);
      return [rec(kind, "Competitor Monitoring", "Weekly overlap for each project’s rival set.", columns, rows)];
    },
    "paid-search": () => {
      const { columns, rows } = forSites(["Keyword", "Clicks", "Cost", "Position", "Conv.", "Landing"], (site, i) =>
        KW.slice(0, 5).map((kw, ki) => [kw, String(220 - ki * 30 - i * 10), `$${840 - ki * 100}`, String(1 + (ki % 3)), String(18 - ki), "/pricing"]),
      );
      return [rec(kind, "Paid Search", "Paid keywords per site.", columns, rows)];
    },
    "organic-social": () => {
      const { columns, rows } = forSites(["Network", "Sessions", "Share", "Top post"], () => [
        ["LinkedIn", "186", "41%", "SEO checklist carousel"],
        ["X", "94", "21%", "AI visibility thread"],
        ["YouTube", "72", "16%", "Audit guide cut"],
        ["Facebook", "54", "12%", "Local tips"],
      ]);
      return [rec(kind, "Organic Social", "Social sessions per site.", columns, rows)];
    },
    "get-started": () => {
      const { columns, rows } = forSites(["Step", "Status", "Detail"], (site) => [
        ["Add website", "Done", site.url],
        ["Search Console", "Waiting for Google account", "Property not linked"],
        ["GA4", "Waiting for Google account", "Property not linked"],
        ["First crawl", "Ready", "820 pages queued"],
        ["Competitors", "Done", RIVALS.slice(0, 2).join(", ")],
        ["Keyword list", "Done", "Brand + content gaps"],
      ]);
      return [rec(kind, "Get Started", "Connect steps for each project site.", columns, rows)];
    },
    "seo-dashboard": () => [
      rec(
        kind,
        "SEO Dashboard",
        "Overview widgets across 3 project sites.",
        ["Site", "Widget", "Status", "Highlight"],
        DEMO_SITES.flatMap((site, i) => [
          [site.domain, "AI Search", "Stored", `${28 - i * 8} mentions`],
          [site.domain, "SEO Overview", "Stored", `Authority ${42 - i * 4}`],
          [site.domain, "Position Tracking", "Stored", `${10 - i} tracked KW`],
          [site.domain, "Site Audit", "Stored", `Health ${72 - i * 6}%`],
          [site.domain, "Traffic Analytics", "Stored", `${18420 - i * 4200} sessions`],
        ]),
        {
          aiKpis: [["AI Visibility", "0.12%"], ["Mentions", "28"], ["Cited pages", "11"]],
          aiPlatforms: [["ChatGPT", "14"], ["Perplexity", "6"], ["Gemini", "4"]],
          seoKpis: [["Authority Score", "42"], ["Organic Traffic", "18420"], ["Organic Keywords", "1280"], ["Ref. Domains", "86"]],
          visibilityTrend: [["Sep 1", 0.08], ["Sep 8", 0.09], ["Sep 15", 0.11], ["Sep 22", 0.12]],
          rankBuckets: [["Top 3", "14"], ["Top 10", "52"], ["Top 20", "110"], ["Top 100", "340"]],
          topKeywords: KW.slice(0, 5).map((kw, i) => [kw, String(6 + i * 2), i % 2 ? "+1" : "-1"]),
          healthScore: 72,
          auditCounts: [["Errors", "40"], ["Warnings", "23"]],
          crawledPages: [["Crawled", "820"], ["Limit", "1000"]],
          trafficTrend: [["Apr", 9200, 6100], ["May", 10100, 6800], ["Jun", 11400, 7400], ["Jul", 12800, 8100], ["Aug", 14200, 9000], ["Sep", 18420, 12004]],
          trafficKpis: [["Visits", "18420"], ["Unique visitors", "12004"], ["Pages / visit", "2.4"]],
          organicRankings: KW.slice(0, 4).map((kw, i) => [kw, String(6 + i * 3), "+1"]),
          backlinkRows: [["news.industry/story", "/", "searchify", "Follow"], ["seo-journal.com/guide", "/pricing", "plans", "Follow"]],
        },
      ),
    ],
    "home-projects": () => [
      rec(kind, "Home projects", "Project snapshots for the overview table.", ["Website", "URL", "Health", "Visibility", "Traffic", "Keywords", "Backlinks", "Mentions"], [
        ["searchify.example", "https://searchify.example", "72%", "0.12%", "18420", "1280", "86", "28"],
        ["demo-local.example", "https://demo-local.example", "64%", "0.04%", "4200", "310", "24", "4"],
        ["shop-north.example", "https://shop-north.example", "68%", "0.07%", "9800", "640", "41", "9"],
      ]),
    ],
    "local-dashboard": () => {
      const { columns, rows } = forSites(["Metric", "Value", "Goal"], (site, i) => [
        ["Map pack keywords", String(24 - i * 4), "30"],
        ["Avg. rating", (4.6 - i * 0.1).toFixed(1), "4.7"],
        ["Reviews", String(182 - i * 40), "200"],
        ["Listing score", String(78 - i * 6), "90"],
        ["Directions clicks", String(420 - i * 60), "500"],
        ["Call clicks", String(186 - i * 30), "220"],
      ]);
      return [rec(kind, "Local Dashboard", "Local visibility per site / location.", columns, rows, { score: 78, scoreLabel: "Listing score" })];
    },
    "local-listings": () => {
      const { columns, rows } = forSites(["Directory", "Status", "Accuracy", "Phone match"], () => [
        ["Google", "Live", "98%", "Yes"],
        ["Bing", "Live", "94%", "Yes"],
        ["Apple", "Needs update", "81%", "No"],
        ["Yelp", "Live", "90%", "Yes"],
        ["Facebook", "Live", "88%", "Yes"],
      ]);
      return [rec(kind, "Listing Management", "Directory listings per site.", columns, rows)];
    },
    "local-reviews": () => {
      const { columns, rows } = forSites(["Period", "Reviews", "Rating", "Replied"], () => [
        ["This month", "14", "4.7", "11"],
        ["Last month", "11", "4.5", "11"],
        ["Quarter", "39", "4.6", "36"],
        ["Year", "182", "4.6", "170"],
      ]);
      return [rec(kind, "Review Management", "Reviews per site location.", columns, rows)];
    },
    "local-gbp": () => {
      const { columns, rows } = forSites(["Check", "Status", "Detail"], (site) => [
        ["Categories", "Complete", "SEO agency · Software"],
        ["Photos", "Needs update", "Add 4 interior shots"],
        ["Posts", "Scheduled", "2 this week"],
        ["Q&A", "Review", "2 unanswered"],
        ["Website link", "Complete", site.url + "/local"],
      ]);
      return [rec(kind, "GBP Optimization", "GBP checklist per location/site.", columns, rows)];
    },
    "local-automations": () => {
      const { columns, rows } = forSites(["Task", "Status", "Next run", "Channel"], () => [
        ["Review request", "Active", "Tomorrow", "Email"],
        ["GBP post", "Paused", "—", "GBP"],
        ["Listing sync", "Active", "Tonight", "Directories"],
        ["Q&A digest", "Active", "Friday", "Slack"],
      ]);
      return [rec(kind, "Automations", "Scheduled local tasks per site.", columns, rows)];
    },
    "local-ai-agent": () => {
      const { columns, rows } = forSites(["Review", "Suggestion", "Status", "Rating"], () => [
        ["Great service", "Thank the guest and invite a follow-up.", "Waiting", "5"],
        ["Slow reply", "Apologize and offer a scheduled call.", "Draft", "3"],
        ["Clear pricing", "Thank them and link to /pricing.", "Approved", "5"],
        ["Hard to setup", "Offer onboarding help.", "Waiting", "2"],
      ]);
      return [rec(kind, "GBP AI Agent", "Suggested replies per site.", columns, rows)];
    },
    "local-competitors": () => {
      const { columns, rows } = forSites(["Business", "Rating", "Reviews", "Distance", "Map pack KW overlap"], () => [
        ["Rival Agency Co", "4.5", "210", "0.4 mi", "12"],
        ["Market SEO Spot", "4.2", "160", "0.7 mi", "8"],
        ["Local Growth Hub", "4.7", "95", "1.1 mi", "6"],
        ["City Rank Labs", "4.1", "120", "1.4 mi", "9"],
      ]);
      return [rec(kind, "Local Competitive Analysis", "Nearby rivals per location.", columns, rows)];
    },
    "local-map-ranks": () => {
      const { columns, rows } = forSites(["Keyword", "Position", "Change", "Grid avg", "Competitor ahead"], () => [
        ["seo agency near me", "3", "+1", "4.2", "Rival Agency Co"],
        ["local seo consultant", "7", "-2", "8.1", "Market SEO Spot"],
        ["gbp optimization", "5", "0", "5.6", "Local Growth Hub"],
        ["seo company near me", "4", "+2", "4.9", "Rival Agency Co"],
      ]);
      return [rec(kind, "Map Rank Tracker", "Map pack keywords per site.", columns, rows)];
    },
    "ai-analysis": () => {
      const { columns, rows } = forSites(["Run", "Mentions", "Links", "Top prompt", "Summary"], (site, i) => [
        ["Weekly", String(8 - i), String(3 - Math.min(i, 2)), "best seo workspace", `Brand in answers for ${site.label}.`],
        ["Monthly", String(28 - i * 8), String(11 - i * 3), "seo audit tool", "Mentions rose on ChatGPT."],
        ["Competitor scan", String(12 - i * 2), "2", "rank tracker", `${RIVALS[0]} cited more.`],
      ]);
      return [rec(kind, "AI Analysis", "Prompt-run summaries per site.", columns, rows)];
    },
    "visibility-overview": () => {
      const { columns, rows } = forSites(["Surface", "Status", "Value", "WoW"], (site, i) => [
        ["Search clicks", "Stored", String(301 - i * 40), "+8%"],
        ["Search impressions", "Stored", String(8900 - i * 900), "+5%"],
        ["AI mentions", "Stored", String(28 - i * 8), "+9"],
        ["AI linked answers", "Stored", String(11 - i * 3), "+4"],
        ["Brand SOV (AI)", "Stored", `${18 - i * 2}%`, "+2pp"],
      ]);
      return [rec(kind, "Visibility Overview", "Search + AI surfaces per site.", columns, rows)];
    },
    "competitor-research": () => {
      const { columns, rows } = forSites(["Domain", "Keyword", "Position", "Volume", "We rank?"], () => [
        [RIVALS[0], "seo audit tool", "3", "2400", "No (gap)"],
        [RIVALS[0], "rank tracker", "5", "3600", "Yes #18"],
        [RIVALS[1], "content optimizer", "5", "1300", "No (gap)"],
        [RIVALS[2], "ai visibility", "7", "1900", "Yes #14"],
        [RIVALS[0], "serp tracker", "4", "2200", "No (gap)"],
      ]);
      return [rec(kind, "Competitor Research", "Competitor keywords feeding Keyword Gap.", columns, rows)];
    },
    "prompt-research": () => {
      const { columns, rows } = forSites(["Prompt", "Answer stored", "Source", "Mention", "Action"], () => [
        ["what is searchify", "Yes", "ChatGPT", "Yes", "Track"],
        ["best seo workspace", "Yes", "Perplexity", "Yes", "Track"],
        ["seo audit tool", "No", "Gemini", "No", "Create content"],
        ["rank tracker free", "No", "ChatGPT", "No", "Brief"],
        ["ai search optimization", "Yes", "Perplexity", "Partial", "Track"],
      ]);
      return [rec(kind, "Prompt Research", "Prompts researched per site brand.", columns, rows)];
    },
    "prompt-tracking": () => {
      const { columns, rows } = forSites(["Prompt", "Mention", "Link", "Trend", "Last check"], () => [
        ["best seo tool", "Yes", "Yes", "Up", "2026-09-22"],
        ["seo workspace", "Yes", "No", "Flat", "2026-09-22"],
        ["best seo workspace", "Yes", "Yes", "Up", "2026-09-22"],
        ["content brief generator", "Yes", "Yes", "Up", "2026-09-20"],
        ["rank tracker free", "No", "No", "Down", "2026-09-19"],
      ]);
      return [rec(kind, "Prompt Tracking", "Scheduled prompts per site.", columns, rows)];
    },
    "brand-performance": () => {
      const { columns, rows } = forSites(["Metric", "Value", "vs last month"], (site, i) => [
        ["Mentions", String(128 - i * 30), `+${22 - i * 4}`],
        ["Share of voice", `${18 - i * 2}%`, "+2pp"],
        ["Linked answers", String(34 - i * 8), `+${8 - i}`],
        ["ChatGPT mentions", String(64 - i * 12), `+${14 - i * 2}`],
      ]);
      return [rec(kind, "Brand Performance", "Brand SOV per project site.", columns, rows)];
    },
    "brand-perception": () => {
      const { columns, rows } = forSites(["Theme", "Tone", "Share", "Example prompt"], () => [
        ["Reliable", "Positive", "42%", "best seo workspace"],
        ["Expensive", "Mixed", "18%", "pricing"],
        ["Fast setup", "Positive", "27%", "easy setup"],
        ["AI-ready", "Positive", "21%", "ai search"],
      ]);
      return [rec(kind, "Perception", "Brand themes per site.", columns, rows)];
    },
    "brand-narrative": () => {
      const { columns, rows } = forSites(["Driver", "Mentions", "Trend", "Content to push"], () => [
        ["Site audit quality", "46", "Up", "Audit guide"],
        ["AI search coverage", "28", "Up", "AI visibility explainer"],
        ["Pricing clarity", "19", "Flat", "Pricing page"],
        ["Local listings", "12", "Up", "Local SEO guide"],
      ]);
      return [rec(kind, "Narrative Drivers", "Drivers per site brand.", columns, rows)];
    },
    "brand-questions": () => {
      const { columns, rows } = forSites(["Question", "Mentioned", "Source", "Linked", "Track?"], () => [
        ["best seo workspace", "Yes", "ChatGPT", "Yes", "Yes"],
        ["seo audit tool", "Yes", "Perplexity", "No", "Yes"],
        ["rank tracker free", "No", "Gemini", "No", "Create brief"],
        ["ai visibility software", "Yes", "Perplexity", "No", "Yes"],
      ]);
      return [rec(kind, "Questions", "Brand questions per site.", columns, rows)];
    },
    "ai-search": () => {
      const { columns, rows } = forSites(["Prompt", "Mentioned", "Linked", "Source", "URL"], () => [
        ["best seo workspace", "Yes", "Yes", "ChatGPT", "/"],
        ["seo audit tool", "Yes", "No", "Perplexity", "/blog/audit"],
        ["rank tracker comparison", "No", "No", "Gemini", "—"],
        ["content brief generator", "Yes", "Yes", "ChatGPT", "/pricing"],
        ["ai search visibility", "Yes", "No", "Perplexity", "/features"],
      ]);
      return [rec(kind, "AI Search", "AI answer snapshots per site.", columns, rows)];
    },
    "ai-search-audit": () => {
      const { columns, rows } = forSites(["URL", "Finding", "Score", "Priority"], () => [
        ["/", "OK — brand cited", "Passed", "Low"],
        ["/pricing", "Thin content for AI answers", "Review", "High"],
        ["/docs", "Missing FAQ schema", "Pending", "Med"],
        ["/features", "No clear entity definition", "Review", "Med"],
        ["/local", "Local NAP incomplete", "Pending", "High"],
      ]);
      return [rec(kind, "AI Search Audit", "AI crawl findings per site.", columns, rows, { score: 62, scoreLabel: "AI crawl score", audit: [["Passed", "2"], ["Review", "2"], ["Pending", "2"]] })];
    },
    "ai-visibility-report": () => {
      const { columns, rows } = forSites(["Period", "Mentions", "Links", "Share of voice", "Note"], (site, i) => [
        ["This month", String(28 - i * 8), String(11 - i * 3), `${18 - i * 2}%`, "ChatGPT led"],
        ["Last month", String(19 - i * 5), String(7 - i * 2), `${14 - i * 2}%`, "Fewer answers"],
        ["This quarter", String(64 - i * 12), String(22 - i * 5), `${16 - i}%`, "Up vs rivals"],
      ]);
      return [rec(kind, "AI Search Visibility Report", "Period reports per site.", columns, rows)];
    },
    "content-dashboard": () => {
      const { columns, rows } = forSites(["Title", "Status", "Owner", "Cluster", "Updated"], () => [
        ["Homepage brief", "Approved", "Editor", "Brand", "2026-09-18"],
        ["Pricing page", "In review", "Writer", "Pricing", "2026-09-20"],
        ["Local SEO guide", "Draft", "Editor", "Local", "2026-09-15"],
        ["SEO checklist", "Waiting for writer", "Writer", "Audit", "2026-09-21"],
        ["AI visibility explainer", "Draft", "Editor", "AI", "2026-09-19"],
        ["Keyword gap playbook", "In review", "Editor", "Audit", "2026-09-22"],
      ]);
      return [rec(kind, "Content Dashboard", "Content pipeline per site.", columns, rows, { kpis: [["Approved", "2"], ["In review", "2"], ["Draft", "2"], ["Waiting", "1"]] })];
    },
    "my-content": () => {
      const { columns, rows } = forSites(["Title", "Status", "Type", "Updated", "Related URL"], () => [
        ["Homepage brief", "Draft", "Brief", "2026-09-18", "/"],
        ["Pricing page", "Approved", "Page", "2026-09-20", "/pricing"],
        ["Local SEO guide", "In review", "Article", "2026-09-15", "/local"],
        ["SEO checklist", "Waiting for writer", "Article", "2026-09-21", "/blog/audit"],
        ["AI visibility explainer", "Draft", "Article", "2026-09-19", "/features"],
        ["Keyword gap playbook", "In review", "Guide", "2026-09-22", "/docs"],
      ]);
      return [rec(kind, "My Content", "Library pieces per site.", columns, rows)];
    },
    "topic-research": () => {
      const { columns, rows } = forSites(["Cluster", "Keywords", "Volume", "Difficulty", "Opportunity"], () => [
        ["Pricing", "pricing, plans, cost", "12100", "42", "High"],
        ["Audit", "seo audit, site audit", "9900", "38", "High"],
        ["Rank tracking", "rank tracker, positions", "6400", "44", "Med"],
        ["AI search", "ai visibility, ai search", "3200", "29", "High"],
        ["Local", "seo agency near me, gbp", "4800", "35", "Local"],
      ]);
      return [rec(kind, "Topic Research", "Clusters per site.", columns, rows)];
    },
    "topic-finder": () => {
      const { columns, rows } = forSites(["Topic", "Reason", "Volume", "Related KW", "Suggested URL"], () => [
        ["Local SEO", "Impressions without a page", "2900", "seo agency near me", "/local"],
        ["AI search", "Rising queries", "1900", "ai visibility", "/features"],
        ["Internal linking", "Content gap", "3600", "internal linking", "/blog/internal-links"],
        ["Technical SEO", "High volume / thin page", "2400", "technical seo checklist", "/blog/audit"],
      ]);
      return [rec(kind, "Topic Finder", "Topic opportunities per site.", columns, rows)];
    },
    "content-creation": () => {
      const { columns, rows } = forSites(["Title", "Status", "Score", "Brief", "Owner"], () => [
        ["SEO checklist", "Waiting for writer", "—", "SEO checklist", "Writer"],
        ["Audit guide", "In review", "72", "SEO audit", "Editor"],
        ["Pricing outline", "Approved", "81", "Pricing page", "Editor"],
        ["AI visibility explainer", "Waiting for writer", "—", "AI search", "Writer"],
      ]);
      return [rec(kind, "Content Creation", "Pieces in flight per site.", columns, rows)];
    },
  };

  function articleBundle(k, title) {
    const table = forSites(["Page", "Topic", "Status", "Score"], (site, i) => [
      ["/", "Homepage rewrite", "Waiting for writer", "—"],
      ["/pricing", "Pricing clarity", "In review", "72"],
      ["/blog/audit", "Audit checklist", "Approved", String(81 - i)],
      ["/docs", "Keyword gap guide", "Draft", "58"],
    ]);
    const tableRec = rec(k, title, `${title} drafts across 3 sites. Publish waits for a person.`, table.columns, table.rows);
    const drafts = DEMO_SITES.map((site, i) => ({
      id: `demo-draft-${k}-${i}`,
      kind: k,
      title: `${site.label}: ${KW[i] || "seo software"} brief`,
      status: "waiting_for_writer",
      createdAt: new Date().toISOString(),
      payload: {
        summary: `Draft for ${site.domain}`,
        type: "Article",
        keywords: KW.slice(i, i + 3).join(", "),
        tone: "Clear",
        tokens: "600",
        draft: `${site.label} draft.\nSite: ${site.domain}\nKeywords: ${KW.slice(i, i + 3).join(", ")}\n\nOutline\n1. Problem\n2. Solution\n3. Proof\n4. CTA\n\nA writer still produces the final text.`,
        seedVersion: DEMO_SEED_VERSION,
        columns: ["Topic", "Status"],
        rows: [[`${site.label} draft`, "Waiting for writer"]],
      },
    }));
    return [tableRec, ...drafts];
  }

  const articleKinds = {
    "seo-writing": "SEO Writing Assistant",
    "ai-article": "AI Article Generator",
    "seo-brief": "SEO Brief Generator",
    "seo-content-template": "SEO Content Template",
    "content-optimizer": "Content Optimizer",
    "content-repurposing": "Content Repurposing",
  };
  if (articleKinds[kind]) return articleBundle(kind, articleKinds[kind]);

  const build = builders[kind];
  if (build) return build();

  const { columns, rows } = forSites(["Item", "Detail", "Status"], (site, i) =>
    KW.slice(0, 5).map((kw, ki) => [kw, `${site.label} · row ${ki + 1}`, ki % 2 ? "Stored" : "Ready"]),
  );
  return [rec(kind, kind, `Prototype feed for ${kind} across 3 sites.`, columns, rows)];
}

export function hasDemoRows(records) {
  if (!Array.isArray(records) || !records.length) return false;
  return records.some((r) => (r.payload?.rows || []).length > 0 || r.payload?.draft);
}
