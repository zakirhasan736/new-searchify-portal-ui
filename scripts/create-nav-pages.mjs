import fs from "fs";
import path from "path";

const pages = [
  ["/brand/performance", "brand-performance", "Brand Performance", "Brand mentions and share of voice stored for this project."],
  ["/brand/perception", "brand-perception", "Perception", "How AI answers describe the brand."],
  ["/brand/narrative", "brand-narrative", "Narrative Drivers", "Themes that drive brand mentions."],
  ["/brand/questions", "brand-questions", "Questions", "Questions that trigger brand answers."],
  ["/market/paid-search", "paid-search", "Paid Search", "Paid keyword and ad rows stored for this project."],
  ["/market/organic-social", "organic-social", "Organic Social", "Social referral sessions stored for this project."],
  ["/local", "local-dashboard", "Local Dashboard", "Local visibility overview for listings and map ranks."],
  ["/local/listings", "local-listings", "Listing Management", "Directory listings and status for this project."],
  ["/local/reviews", "local-reviews", "Review Management", "Review volume and rating trends."],
  ["/local/gbp", "local-gbp", "GBP Optimization", "Google Business Profile checklist items."],
  ["/local/automations", "local-automations", "Automations", "Scheduled local tasks waiting to run."],
  ["/local/ai-agent", "local-ai-agent", "GBP AI Agent", "Suggested local replies waiting for a person."],
  ["/local/competitors", "local-competitors", "Local Competitive Analysis", "Nearby competitors and overlap."],
  ["/local/map-ranks", "local-map-ranks", "Map Rank Tracker", "Map pack positions by keyword."],
];

for (const [route, kind, title, description] of pages) {
  const dir = path.join("src/app", route.replace(/^\//, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "page.js"),
    `import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: ${JSON.stringify(title)},
  description: ${JSON.stringify(description)},
  path: ${JSON.stringify(route)},
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind=${JSON.stringify(kind)}
      title=${JSON.stringify(title)}
      description=${JSON.stringify(description)}
    />
  );
}
`
  );
}

console.log("created", pages.length, "pages");
