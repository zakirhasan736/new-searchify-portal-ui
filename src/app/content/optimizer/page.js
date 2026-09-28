import ArticleStudio from "@/components/studio/ArticleStudio";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Content Optimizer",
  description: "An edit draft. A person publishes it.",
  path: "/content/optimizer",
  index: true,
});

export default function Page() {
  return (
    <ArticleStudio
      kind="content-optimizer"
      title="Content Optimizer"
      description="An edit draft waiting for a person to publish."
    />
  );
}
