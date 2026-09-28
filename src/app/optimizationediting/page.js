import { pageMeta } from "@/lib/seo";
import { CrawlPage } from "@/components/studio/ProductPages";

export const metadata = pageMeta({
  title: "Optimization editing",
  description: "Edit the site that is open in this project.",
  path: "/optimizationediting",
  index: false,
});

export default function Page() {
  return <CrawlPage mode="edit" />;
}
