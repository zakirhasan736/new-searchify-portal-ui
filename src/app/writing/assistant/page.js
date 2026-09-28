import ArticleStudio from "@/components/studio/ArticleStudio";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "SEO Writing Assistant",
  description: "A draft from the page and a brief. A person publishes it.",
  path: "/writing/assistant",
  index: true,
});

export default function Page() {
  return (
    <ArticleStudio
      kind="seo-writing"
      title="SEO Writing Assistant"
      description="A draft from the page and a brief. A person still publishes."
    />
  );
}
