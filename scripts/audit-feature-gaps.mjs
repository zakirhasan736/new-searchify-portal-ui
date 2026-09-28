import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const portal = "c:/Users/zakir/Desktop/searchify-new-ui-portal";
const backend = "c:/Users/zakir/Desktop/searchify-portal-new-backend";

const navSrc = readFileSync(join(portal, "src/lib/navCatalog.js"), "utf8");
const toolsSrc = readFileSync(join(portal, "src/lib/tools.js"), "utf8");
const kitSrc = readFileSync(join(portal, "src/lib/pageFeatures.js"), "utf8");
const guideSrc = readFileSync(join(portal, "src/lib/toolGuides.js"), "utf8");
const catalogSrc = readFileSync(join(backend, "app/catalog_data.py"), "utf8");
const workflowSrc = readFileSync(join(backend, "app/routers/workflow.py"), "utf8");
const crawlSrc = readFileSync(join(backend, "app/routers/crawl.py"), "utf8");

// Collect items from NAV
const items = [];
const panelBlocks = [...navSrc.matchAll(/title:\s*"([^"]+)"[\s\S]*?items:\s*\[([\s\S]*?)\]/g)];
// Simpler: parse kind/path/title triples from nav
const itemRe = /\{\s*title:\s*"([^"]+)"\s*,\s*path:\s*"([^"]+)"(?:\s*,\s*kind:\s*"([^"]+)")?\s*\}/g;
let m;
while ((m = itemRe.exec(navSrc))) {
  items.push({ title: m[1], path: m[2], kind: m[3] || null, source: "nav" });
}
// START + RESEARCH from tools
const toolItemRe = /\{\s*group:\s*"([^"]+)"\s*,\s*path:\s*"([^"]+)"(?:\s*,\s*kind:\s*"([^"]+)")?\s*,\s*title:\s*"([^"]+)"/g;
while ((m = toolItemRe.exec(toolsSrc))) {
  const path = m[2];
  if (!items.some((i) => i.path === path)) {
    items.push({ title: m[4], path, kind: m[3] || null, source: "tools", group: m[1] });
  }
}

function routeExists(p) {
  const clean = p.replace(/^\//, "");
  return ["page.js", "page.jsx", "page.tsx"].some((n) => existsSync(join(portal, "src/app", clean, n)));
}

function pageUses(path) {
  const clean = path.replace(/^\//, "");
  const file = ["page.js", "page.jsx", "page.tsx"].map((n) => join(portal, "src/app", clean, n)).find(existsSync);
  if (!file) return { component: "missing", kind: null };
  const src = readFileSync(file, "utf8");
  if (src.includes("SeoDashboard")) return { component: "SeoDashboard", kind: "seo-dashboard" };
  if (src.includes("HomeOverview")) return { component: "HomeOverview", kind: "home" };
  if (src.includes("ArticleStudio")) return { component: "ArticleStudio", kind: "ai-article" };
  if (src.includes("WorksPage")) return { component: "WorksPage", kind: null };
  if (src.includes("CrawlPage") || src.includes("seooptimization")) return { component: "CrawlPage", kind: null };
  const km = src.match(/kind=["']([^"']+)["']/);
  if (src.includes("Workspace") || src.includes("ToolPage")) {
    return { component: "ToolPage", kind: km?.[1] || null };
  }
  if (src.includes("AccountPages") || src.includes("ProfilePage") || src.includes("NewsPage") || src.includes("FeaturesPage") || src.includes("AdminPage")) {
    return { component: "Account", kind: null };
  }
  return { component: "other", kind: km?.[1] || null };
}

const kitKeys = new Set([
  ...[...kitSrc.matchAll(/"([a-z0-9-]+)":\s*\{/g)].map((x) => x[1]),
  ...[...kitSrc.matchAll(/^\s*([a-z0-9-]+):\s*\{/gm)].map((x) => x[1]),
]);
const guideKeys = new Set([
  ...[...guideSrc.matchAll(/"([a-z0-9-]+)":\s*\{/g)].map((x) => x[1]),
  ...[...guideSrc.matchAll(/^\s*([a-z0-9-]+):\s*\{/gm)].map((x) => x[1]),
]);
const seedKinds = new Set([
  ...[...catalogSrc.matchAll(/\("([a-z0-9-]+)"\s*,/g)].map((x) => x[1]),
]);

const LIVE_KINDS = new Set([]); // none fully live SEO
const SHALLOW_LIVE = new Set(["crawl"]); // seooptimization
const WAITING_PROVIDER_HINTS = /waiting_for_provider|Waiting for Google|provider|Connect Google|Qwen/i;
const WAITING_WRITER_HINTS = /waiting_for_writer|Waiting for writer|Needs approval/i;

function seedSummary(kind) {
  if (!kind) return "";
  const re = new RegExp(`\\("${kind}"\\s*,\\s*"[^"]*"\\s*,\\s*"([^"]*)"`, "i");
  const hit = catalogSrc.match(re);
  return hit?.[1] || "";
}

function classify(item, used) {
  const kind = used.kind || item.kind;
  if (!routeExists(item.path)) return { status: "missing_route", tier: "broken" };
  if (used.component === "CrawlPage") return { status: "shallow_live", tier: "partial", note: "1-page crawl only" };
  if (used.component === "HomeOverview" || used.component === "SeoDashboard") return { status: "seeded_dashboard", tier: "demo" };
  if (used.component === "ArticleStudio") return { status: "writer_gate", tier: "stub", note: "outline → waiting_for_writer" };
  if (used.component === "WorksPage" || used.component === "Account") return { status: "app_utility", tier: "works" };
  if (used.component === "ToolPage" && kind) {
    const summary = seedSummary(kind);
    const hasSeed = seedKinds.has(kind);
    const hasKit = kitKeys.has(kind);
    const hasGuide = guideKeys.has(kind);
    let status = "seeded_tool";
    let tier = "demo";
    let note = "";
    if (!hasSeed) {
      status = "no_seed";
      tier = "gap";
      note = "no catalog seed";
    } else if (WAITING_WRITER_HINTS.test(summary)) {
      status = "writer_gate";
      tier = "stub";
      note = "person publishes";
    } else if (WAITING_PROVIDER_HINTS.test(summary)) {
      status = "provider_gate";
      tier = "stub";
      note = "waiting_for_provider";
    }
    if (!hasKit) note = (note ? note + "; " : "") + "missing kit";
    if (!hasGuide) note = (note ? note + "; " : "") + "missing guide";
    return { status, tier, note, hasSeed, hasKit, hasGuide, summary };
  }
  if (!item.kind && used.component === "other") return { status: "utility", tier: "works" };
  return { status: "unknown", tier: "gap", note: used.component };
}

const rows = [];
const seen = new Set();
for (const item of items) {
  if (seen.has(item.path)) continue;
  seen.add(item.path);
  const used = pageUses(item.path);
  const cls = classify(item, used);
  rows.push({
    title: item.title,
    path: item.path,
    kind: used.kind || item.kind || "",
    component: used.component,
    status: cls.status,
    tier: cls.tier,
    note: cls.note || "",
    hasSeed: cls.hasSeed ?? seedKinds.has(used.kind || item.kind || ""),
    hasKit: cls.hasKit ?? kitKeys.has(used.kind || item.kind || ""),
    hasGuide: cls.hasGuide ?? guideKeys.has(used.kind || item.kind || ""),
  });
}

const byTier = {};
const byStatus = {};
for (const r of rows) {
  byTier[r.tier] = (byTier[r.tier] || 0) + 1;
  byStatus[r.status] = (byStatus[r.status] || 0) + 1;
}

const gaps = rows.filter((r) => r.tier === "gap" || r.tier === "broken" || r.status === "no_seed");
const stubs = rows.filter((r) => r.tier === "stub");
const demos = rows.filter((r) => r.tier === "demo");
const works = rows.filter((r) => r.tier === "works" || r.tier === "partial");

// Domain buckets from path/kind
function domainOf(r) {
  const p = r.path + " " + r.kind;
  if (/local/.test(p)) return "Local";
  if (/content|writing|article|brief|topic|seo-writing|my-content|optimizer|repurpose/.test(p)) return "Content";
  if (/visibility|ai-search|brand|prompt|monitor|ai-analysis|ai-traffic/.test(p)) return "AI";
  if (/market|traffic|referral|paid|organic-social|organic-search|competitor-monitoring|top-pages|get-started/.test(p)) return "Traffic";
  if (/link|backlink|referring/.test(p)) return "Links";
  if (/keyword|SEOranking|organicsearch|keywordgap|websitekeyword|keywordmannager|keywordgeneretor|keywordoverview|keywordanalyze/.test(p)) return "Keywords";
  if (/site\/|audit|on-page|positions|seooptimization|domainoverview|dashboard/.test(p)) return "Site/SEO";
  if (/home|works|UserProfile|news|admin|features/.test(p)) return "Start/Account";
  return "Other";
}

const byDomain = {};
for (const r of rows) {
  const d = domainOf(r);
  if (!byDomain[d]) byDomain[d] = { total: 0, demo: 0, stub: 0, works: 0, gap: 0, partial: 0 };
  byDomain[d].total++;
  byDomain[d][r.tier] = (byDomain[d][r.tier] || 0) + 1;
}

const hasWorkers = /Celery|arq|RQ|BackgroundTasks|waiting_for_provider/.test(workflowSrc);
const hasCrawl = /httpx|BeautifulSoup|html\.parser/.test(crawlSrc);

console.log(
  JSON.stringify(
    {
      totals: { pages: rows.length, byTier, byStatus },
      byDomain,
      gaps,
      stubs: stubs.map((r) => ({ title: r.title, path: r.path, kind: r.kind, note: r.note })),
      demos: demos.length,
      works: works.map((r) => ({ title: r.title, path: r.path, status: r.status, note: r.note })),
      backendFlags: {
        waitingProviderInWorkflow: /waiting_for_provider/.test(workflowSrc),
        waitingWriterInWorkflow: /waiting_for_writer/.test(workflowSrc),
        shallowCrawl: hasCrawl,
      },
      all: rows,
    },
    null,
    2,
  ),
);
