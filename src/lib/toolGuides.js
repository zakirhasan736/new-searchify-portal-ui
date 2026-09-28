import { NAV } from "@/lib/navCatalog";

/** Per-tool SEO workflow copy and related tools (Semrush-style, Searchify-owned). */
const META = {
  "seo-dashboard": {
    tip: "Project SEO widgets in one reel — audit, ranks, traffic, and AI visibility.",
    next: "Open Domain Overview or Site Audit when a widget needs a deeper pass.",
  },
  "domain-snapshot": {
    tip: "Start here for a domain scorecard, then jump into keywords and backlinks.",
    next: "Open Organic Rankings or Backlink Analytics for the same domain.",
  },
  "site-audit": {
    tip: "Crawl findings stay on the project. Fix drafts wait for a person to publish.",
    next: "Use On Page SEO Checker for a single URL after the site-wide pass.",
  },
  "position-tracking": {
    tip: "Track keyword positions from stored checks. Compare week-over-week changes.",
    next: "Save a tracking group, then review Keyword Gap for missing terms.",
  },
  "on-page-seo": {
    tip: "Check one URL for titles, meta, headings, and technical signals.",
    next: "Send approved fixes into SEO Operator to execute on the CMS.",
  },
  "seo-operator": {
    tip: "Turn GSC opportunities into approved website actions — then monitor the result.",
    next: "Connect WordPress, Shopify, Webflow, or a custom webhook, then Propose from GSC.",
  },
  "cms-connectors": {
    tip: "CMS connectors are provider-agnostic so new site platforms can be added later.",
    next: "Save credentials once, then Execute on CMS from the change queue.",
  },
  "change-history": {
    tip: "Every applied change is recorded — dry-run or live.",
    next: "Open Outcome Monitor after Sync Google to see rank/CTR movement.",
  },
  "outcome-monitor": {
    tip: "After execute, Searchify re-checks owned GSC signals for the target URL.",
    next: "Re-sync Google, then Refresh monitor on the change.",
  },
  "organic-research": {
    tip: "Domain organic keywords and landing pages from the stored index.",
    next: "Compare against Keyword Gap or Position Tracking.",
  },
  "keyword-ranking": {
    tip: "Rank cards for the keywords this project already tracks.",
    next: "Save a ranking group and open Keyword Overview for volume.",
  },
  "keyword-gap": {
    tip: "Terms competitors rank for that this site does not.",
    next: "Add missing keywords to Keyword Manager, then Position Tracking.",
  },
  "keyword-metrics": {
    tip: "Volume, difficulty, and intent for a single keyword query.",
    next: "Generate related ideas or save into Keyword Manager.",
  },
  "keyword-analyze": {
    tip: "Group keywords into lists you can share or track.",
    next: "Push groups into Position Tracking or Topic Research.",
  },
  "website-keywords": {
    tip: "Organic and paid terms already associated with the domain.",
    next: "Export a list, then check Keyword Gap vs a rival.",
  },
  "generate-keywords": {
    tip: "Idea lists with stored volume. Cap groups at 200 keywords.",
    next: "Save ideas, then build a brief in SEO Brief Generator.",
  },
  "keyword-manager": {
    tip: "Own lists and shared lists. Share is viewer or editor only.",
    next: "Open a list in Keyword Analyze or Position Tracking.",
  },
  "seo-writing": {
    tip: "Draft copy from a page brief. Publish waits for a person.",
    next: "Move approved drafts into My Content or Content Optimizer.",
  },
  "topic-research": {
    tip: "Keyword clusters already stored for content planning.",
    next: "Turn a cluster into an SEO Content Template or brief.",
  },
  "seo-content-template": {
    tip: "Heading templates built from a topic cluster.",
    next: "Feed the template into SEO Writing Assistant or AI Article Generator.",
  },
  "backlink-analytics": {
    tip: "New and lost backlinks with referring-domain context.",
    next: "Review toxic rows in Backlink Audit before outreach.",
  },
  backlinks: {
    tip: "Indexed backlink rows for the active project domain.",
    next: "Cluster by Referring Domains, then plan Link Building.",
  },
  "referring-domains": {
    tip: "Domains that link in, with authority and link counts.",
    next: "Prospect similar domains in Link Building Tool.",
  },
  "backlink-audit": {
    tip: "Flagged links wait for a person to keep or disavow.",
    next: "Safe links can feed Link Building notes.",
  },
  "link-building": {
    tip: "Prospects and outreach drafts. Sending stays with a person.",
    next: "Track replies, then watch new links in Backlink Analytics.",
  },
  "ai-analysis": {
    tip: "Stored summaries of prompt runs across AI answer surfaces.",
    next: "Open Visibility Overview, then Prompt Tracking on a schedule.",
  },
  "visibility-overview": {
    tip: "Search Console plus stored AI mentions in one surface map.",
    next: "Deep-dive Prompt Research for unanswered queries.",
  },
  "competitor-research": {
    tip: "Competitor keywords and AI prompt overlap for this project.",
    next: "Feed gaps into Keyword Gap or Brand Questions.",
  },
  "prompt-research": {
    tip: "Suggested prompts with whether an answer is already stored.",
    next: "Add winners to Prompt Tracking.",
  },
  "prompt-tracking": {
    tip: "The same prompts on a schedule — mentions, links, trend.",
    next: "Draft follow-up content in Content Creation.",
  },
  "brand-performance": {
    tip: "Brand mentions and share of voice in stored AI answers.",
    next: "Inspect Perception and Narrative Drivers.",
  },
  "brand-perception": {
    tip: "How AI answers describe the brand — tone and themes.",
    next: "Use Narrative Drivers, then Questions that trigger answers.",
  },
  "brand-narrative": {
    tip: "Themes that drive brand mentions over time.",
    next: "Create content around rising drivers in Content Creation.",
  },
  "brand-questions": {
    tip: "Questions that trigger brand answers in AI products.",
    next: "Save questions, then track them in Prompt Tracking.",
  },
  "content-creation": {
    tip: "Pieces written from approved briefs. Publish waits for a person.",
    next: "Open My Content when a draft is ready to approve.",
  },
  "ai-search": {
    tip: "Stored AI-answer snapshots for prompts about this niche.",
    next: "Run AI Search Audit, then Visibility Report for the period.",
  },
  "ai-search-audit": {
    tip: "Crawl findings that affect how AI products cite the site.",
    next: "Fix pages with On Page SEO Checker, then re-check mentions.",
  },
  "ai-visibility-report": {
    tip: "Period report of mentions and links in AI answers.",
    next: "Compare with Brand Performance for share of voice.",
  },
  "get-started": {
    tip: "Connect Google once, then Sync to pull GSC, GA4, PageSpeed, and Places.",
    next: "Open Google Services hub, Organic Search, and Traffic Analytics.",
  },
  "google-services": {
    tip: "Unified live tables from every connected Google service.",
    next: "Drill into Organic Search, Top Pages, Site Audit, or Local Competitors.",
  },
  "gsc-countries": {
    tip: "Search Console clicks and impressions by country (last 28 days).",
    next: "Compare with GSC by Device, then Organic Search queries.",
  },
  "gsc-devices": {
    tip: "Search Console split by desktop, mobile, and tablet.",
    next: "Check PageSpeed if mobile CTR or position is weak.",
  },
  "ga4-landing-pages": {
    tip: "Top landing pages from GA4 with sessions and bounce rate.",
    next: "Cross-check Top Pages from Search Console.",
  },
  "traffic-analytics": {
    tip: "Live GA4 sessions and channel mix after Google Sync.",
    next: "Compare channels in Traffic Distribution or GA4 Landing Pages.",
  },
  "traffic-distribution": {
    tip: "Channel mix from GA4 — organic, paid, referral, social.",
    next: "Deep-dive Organic Search or Referral for the top channel.",
  },
  "ai-traffic": {
    tip: "Sessions that arrived from AI products, stored for this project.",
    next: "Cross-check AI Search Visibility for the same period.",
  },
  referral: {
    tip: "Referring sites with source and medium from stored analytics.",
    next: "Compare with Backlinks when the referrer also links.",
  },
  "traffic-home": {
    tip: "Weekly research crawl sessions — separate from market channel mix.",
    next: "Open Traffic Analytics for channel-level engagement.",
  },
  "market-overview": {
    tip: "Category share vs competitors from the weekly note.",
    next: "Monitor rivals in Competitor Monitoring.",
  },
  "top-pages": {
    tip: "Landing pages from Search Console after Google Sync.",
    next: "Optimize weak pages with On Page SEO Checker or PageSpeed.",
  },
  "competitor-monitoring": {
    tip: "Weekly traffic and keyword overlap for tracked rivals.",
    next: "Open Keyword Gap when overlap drops or rises.",
  },
  "organic-search": {
    tip: "Live Search Console queries — clicks, impressions, CTR, position.",
    next: "Open GSC by Country / Device, then save query lists.",
  },
  "site-audit": {
    tip: "Full PageSpeed report: scores, Core Web Vitals, opportunities, SEO/a11y audits, plus GSC findings.",
    next: "Run full audit on Site Audit, then fix SEO fails and opportunities.",
  },
  "paid-search": {
    tip: "Paid keyword and ad rows stored for the project.",
    next: "Compare paid vs organic in Website Keywords.",
  },
  "organic-social": {
    tip: "Social referral sessions by network.",
    next: "Repurpose top posts with Content Repurposing.",
  },
  "local-dashboard": {
    tip: "Map pack, ratings, and listing health for local search.",
    next: "Fix listings, then track Map Rank Tracker keywords.",
  },
  "local-listings": {
    tip: "Directory listings and accuracy scores.",
    next: "Sync changes, then review GBP Optimization.",
  },
  "local-reviews": {
    tip: "Review volume and ratings by period.",
    next: "Draft replies with GBP AI Agent when status is waiting.",
  },
  "local-gbp": {
    tip: "Google Business Profile checklist for categories, photos, posts.",
    next: "Schedule posts via Automations.",
  },
  "local-automations": {
    tip: "Scheduled local tasks — review requests, posts, listing sync.",
    next: "Pause or resume, then check Dashboard metrics.",
  },
  "local-ai-agent": {
    tip: "Suggested review replies. Sending stays with a person.",
    next: "Approve drafts, then watch Review Management.",
  },
  "local-competitors": {
    tip: "Google Places results for local competitors near your brand.",
    next: "Compare ratings and map pack keywords in Map Rank Tracker.",
  },
  "local-map-ranks": {
    tip: "Map pack positions by keyword from stored checks.",
    next: "Save a map set, then audit listings that lag.",
  },
  "content-dashboard": {
    tip: "Pipeline of briefs and drafts. Publish waits for approval.",
    next: "Open My Content or AI Article Generator.",
  },
  "ai-article": {
    tip: "Articles saved from a brief. Writer status stays waiting_for_writer.",
    next: "Approve outlines, then optimize live URLs.",
  },
  "content-optimizer": {
    tip: "Edit drafts for a URL. Publish waits for a person.",
    next: "Score improvements, then move to My Content.",
  },
  "content-repurposing": {
    tip: "Rewrite a piece already in My Content into new formats.",
    next: "Queue LinkedIn or email drafts from approved sources.",
  },
  "topic-finder": {
    tip: "Stored keywords ranked as new topic opportunities.",
    next: "Build an SEO Brief, then a content template.",
  },
  "seo-brief": {
    tip: "Briefs from stored headings and keywords.",
    next: "Hand the brief to SEO Writing Assistant or AI Article Generator.",
  },
  "my-content": {
    tip: "Library of pieces. Publish waits until a person agrees.",
    next: "Repurpose approved items or optimize live URLs.",
  },
};

export function guideFor(kind) {
  return (
    META[kind] || {
      tip: "Search, filter, and save rows on this project. Live providers stay waiting until connected.",
      next: "Use Jump to tool (⌘K) for a related report in the same space.",
    }
  );
}

export function relatedFor(kind, limit = 4) {
  let sectionItems = [];
  let railItems = [];
  for (const rail of NAV) {
    for (const panel of rail.panels) {
      const hit = panel.items.some((item) => item.kind === kind);
      if (hit) {
        sectionItems = panel.items.filter((item) => item.kind && item.kind !== kind);
        railItems = rail.panels.flatMap((p) => p.items).filter((item) => item.kind && item.kind !== kind);
      }
    }
  }
  const pool = [...sectionItems, ...railItems];
  const seen = new Set();
  const out = [];
  for (const item of pool) {
    if (seen.has(item.path)) continue;
    seen.add(item.path);
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}
