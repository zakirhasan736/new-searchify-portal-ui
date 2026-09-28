import { pageMeta } from "@/lib/seo";
import { CrawlPage } from "@/components/studio/ProductPages";

export const metadata = pageMeta({
  title: "Site optimization",
  description: "Crawl a saved site and review the pages found.",
  path: "/seooptimization",
  index: true,
});

export default function Page() {
  return <CrawlPage mode="edit" />;
}
