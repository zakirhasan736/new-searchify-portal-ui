import fs from "fs";

const pages = {
  "src/app/dashboard/page.js": ["website-overview", "Website overview", "Visits, engagement, and country mix for this project.", "Research", "/dashboard", "overview"],
  "src/app/SEOranking/page.js": ["keyword-ranking", "Keywords", "Rank cards and the keyword table.", "Research", "/SEOranking", "overview"],
  "src/app/keywordanalyze/home/page.js": ["keyword-analyze", "Keyword Analyze", "Search keywords and save groups.", "Research", "/keywordanalyze/home", "overview"],
  "src/app/keywordanalyze/overview/page.js": ["keyword-analyze", "Keyword Analyze", "Saved keyword groups.", "Research", "/keywordanalyze/overview", "table"],
  "src/app/websitekeyword/home/page.js": ["website-keywords", "Website Keywords", "Organic and paid keywords for a domain.", "Research", "/websitekeyword/home", "overview"],
  "src/app/websitekeyword/overview/page.js": ["website-keywords", "Website Keywords", "Organic versus paid.", "Research", "/websitekeyword/overview", "table"],
  "src/app/keywordgeneretor/home/page.js": ["generate-keywords", "Generate Keywords", "Keyword ideas with volume and visits.", "Research", "/keywordgeneretor/home", "overview"],
  "src/app/keywordgeneretor/overview/page.js": ["generate-keywords", "Generate Keywords", "Volume and visits.", "Research", "/keywordgeneretor/overview", "table"],
  "src/app/trafficsAnalytics/home/page.js": ["traffic-home", "Traffic Analytics", "Sessions, users, and engagement over time.", "Research", "/trafficsAnalytics/home", "overview"],
  "src/app/trafficsAnalytics/overview/page.js": ["traffic-home", "Traffic Analytics", "Competitor lists and the traffic table.", "Research", "/trafficsAnalytics/overview", "table"],
  "src/app/keywordgap/home/page.js": ["keyword-gap", "Keyword Gap", "Keywords you miss against competitors.", "Research", "/keywordgap/home", "overview"],
  "src/app/keywordgap/overview/page.js": ["keyword-gap", "Keyword Gap", "Range filters on the stored gap.", "Research", "/keywordgap/overview", "table"],
  "src/app/keywordmannager/home/page.js": ["keyword-manager", "Keyword Manager", "Your lists and lists shared with you.", "Research", "/keywordmannager/home", "overview"],
  "src/app/keywordmannager/overview/page.js": ["keyword-manager", "Keyword Manager", "Keywords inside the selected list.", "Research", "/keywordmannager/overview", "table"],
  "src/app/organicsearch/home/page.js": ["organic-research", "Organic Search", "Organic landing data.", "Research", "/organicsearch/home", "overview"],
  "src/app/organicsearch/overview/page.js": ["organic-research", "Organic Search", "Clicks, impressions, CTR, and position.", "Research", "/organicsearch/overview", "table"],
  "src/app/keywordoverview/home/page.js": ["keyword-metrics", "Keyword Overview", "Volume, difficulty, and intent.", "Research", "/keywordoverview/home", "overview"],
  "src/app/keywordoverview/overview/page.js": ["keyword-metrics", "Keyword Overview", "Keyword metric detail.", "Research", "/keywordoverview/overview", "table"],
  "src/app/domainoverview/home/page.js": ["domain-snapshot", "Domain Overview", "A domain-level SEO snapshot.", "Research", "/domainoverview/home", "overview"],
  "src/app/domainoverview/overview/page.js": ["domain-snapshot", "Domain Overview", "Domain metric detail.", "Research", "/domainoverview/overview", "table"],
  "src/app/backlink/home/page.js": ["backlink-analytics", "Backlink Analytics", "Referring links for this project.", "Research", "/backlink/home", "overview"],
  "src/app/backlink/overview/page.js": ["backlink-analytics", "Backlink Analytics", "Filtered backlink rows.", "Research", "/backlink/overview", "table"],
};

for (const [file, [kind, title, description, group, path, tab]] of Object.entries(pages)) {
  fs.writeFileSync(file, `import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: ${JSON.stringify(title)},
  description: ${JSON.stringify(description)},
  path: ${JSON.stringify(path)},
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind=${JSON.stringify(kind)}
      title=${JSON.stringify(title)}
      description=${JSON.stringify(description)}
      group=${JSON.stringify(group)}
      initialTab=${JSON.stringify(tab)}
    />
  );
}
`);
}

console.log("rewrote", Object.keys(pages).length);
