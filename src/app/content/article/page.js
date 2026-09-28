import ArticleStudio from "@/components/studio/ArticleStudio";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "AI Article Generator",
  description: "An article from the brief and stored research.",
  path: "/content/article",
  index: true,
});

export default function Page() {
  return (
    <ArticleStudio
      kind="ai-article"
      title="AI Article Generator"
      description="An article from the brief and stored research. A person still publishes."
    />
  );
}
