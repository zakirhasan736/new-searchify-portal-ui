import ArticleStudio from "@/components/studio/ArticleStudio";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Content Repurposing",
  description: "A rewrite of a piece already in My Content.",
  path: "/content/repurpose",
  index: true,
});

export default function Page() {
  return (
    <ArticleStudio
      kind="content-repurposing"
      title="Content Repurposing"
      description="A rewrite of a piece already in My Content. A person still publishes."
    />
  );
}
