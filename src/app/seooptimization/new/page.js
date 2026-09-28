import { pageMeta } from "@/lib/seo";
import { CrawlPage } from "@/components/studio/ProductPages";

export const metadata = pageMeta({
  title: "New optimization",
  description: "Start a crawl when no website is saved yet.",
  path: "/seooptimization/new",
  index: true,
});

export default function Page() {
  return <CrawlPage mode="new" />;
}
