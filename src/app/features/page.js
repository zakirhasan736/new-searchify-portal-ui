import { pageMeta } from "@/lib/seo";
import { FeaturesPage } from "@/components/studio/AccountPages";

export const metadata = pageMeta({
  title: "AI features",
  description: "Catalog filtered by All, Ads, Grammar, and Blog.",
  path: "/features",
  index: true,
});

export default function Page() {
  return <FeaturesPage />;
}
