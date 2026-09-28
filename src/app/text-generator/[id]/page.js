import ArticleStudio from "@/components/studio/ArticleStudio";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Text generator",
  description: "A draft opened from an AI feature card.",
  path: "/text-generator",
  index: false,
});

export default function Page() {
  return (
    <ArticleStudio
      kind="seo-writing"
      title="Text generator"
      description="Drafts saved for this account. A person still publishes."
    />
  );
}
