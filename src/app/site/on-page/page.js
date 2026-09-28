import OnPageStudio from "@/components/studio/OnPageStudio";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "On Page SEO Checker",
  description: "Own crawl findings plus OpenAI fix drafts with JEV gate.",
  path: "/site/on-page",
  index: true,
});

export default function Page() {
  return <OnPageStudio />;
}
