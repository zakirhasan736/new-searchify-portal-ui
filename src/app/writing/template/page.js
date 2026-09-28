import ArticleStudio from "@/components/studio/ArticleStudio";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "SEO Content Template",
  description: "A template from the topic and stored headings.",
  path: "/writing/template",
  index: true,
});

export default function Page() {
  return (
    <ArticleStudio
      kind="seo-content-template"
      title="SEO Content Template"
      description="A template from the topic and stored headings. A person still publishes."
    />
  );
}
