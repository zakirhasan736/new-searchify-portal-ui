/**
 * Smoke-test nav routes + a sample of feature API kinds.
 * Usage: node scripts/smoke-nav.mjs
 */
const BASE = process.env.PORTAL_URL || "http://127.0.0.1:3000";
const API = process.env.API_URL || "http://127.0.0.1:8000";

const PATHS = [
  "/home",
  "/dashboard",
  "/domainoverview/home",
  "/site/audit",
  "/site/positions",
  "/site/on-page",
  "/organicsearch/home",
  "/SEOranking",
  "/keywordgap/home",
  "/backlink/home",
  "/keywordoverview/home",
  "/keywordanalyze/home",
  "/websitekeyword/home",
  "/keywordgeneretor/home",
  "/keywordmannager/home",
  "/writing/assistant",
  "/writing/topics",
  "/writing/template",
  "/links/building",
  "/links/backlinks",
  "/links/referring-domains",
  "/links/audit",
  "/visibility/analysis",
  "/visibility/overview",
  "/visibility/competitors",
  "/visibility/prompts",
  "/brand/performance",
  "/brand/perception",
  "/brand/narrative",
  "/brand/questions",
  "/monitor/prompts",
  "/monitor/content",
  "/ai-search",
  "/ai-search/audit",
  "/ai-search/report",
  "/market/get-started",
  "/market/traffic-analytics",
  "/market/traffic-distribution",
  "/market/ai-traffic",
  "/market/referral",
  "/trafficsAnalytics/home",
  "/market/overview",
  "/market/top-pages",
  "/market/competitor-monitoring",
  "/market/organic-search",
  "/market/paid-search",
  "/market/organic-social",
  "/local",
  "/local/listings",
  "/local/reviews",
  "/local/gbp",
  "/local/automations",
  "/local/ai-agent",
  "/local/competitors",
  "/local/map-ranks",
  "/content",
  "/content/article",
  "/content/optimizer",
  "/content/repurpose",
  "/content/topics",
  "/content/brief",
  "/content/library",
  "/works",
  "/seooptimization",
  "/UserProfile",
  "/news",
  "/features",
];

const KINDS = [
  "domain-snapshot",
  "site-audit",
  "keyword-gap",
  "backlink-analytics",
  "traffic-analytics",
  "local-dashboard",
  "content-dashboard",
  "ai-analysis",
  "on-page-seo",
  "position-tracking",
];

async function check(url) {
  try {
    const res = await fetch(url, { redirect: "manual" });
    return { ok: res.status >= 200 && res.status < 400, status: res.status };
  } catch (err) {
    return { ok: false, status: 0, error: String(err.message || err) };
  }
}

const pageFails = [];
const apiFails = [];

for (const path of PATHS) {
  const result = await check(`${BASE}${path}`);
  if (!result.ok) pageFails.push({ path, ...result });
  else process.stdout.write(".");
}

process.stdout.write("\n");

for (const kind of KINDS) {
  const result = await check(`${API}/api/v1/features/${kind}`);
  if (!result.ok) apiFails.push({ kind, ...result });
  else process.stdout.write("+");
}

process.stdout.write("\n");
console.log(
  JSON.stringify(
    {
      pages: PATHS.length,
      pageFails,
      apiKinds: KINDS.length,
      apiFails,
      ok: !pageFails.length && !apiFails.length,
    },
    null,
    2,
  ),
);
process.exit(pageFails.length || apiFails.length ? 1 : 0);
