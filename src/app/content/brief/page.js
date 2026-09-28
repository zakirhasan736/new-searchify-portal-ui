import ArticleStudio from "@/components/studio/ArticleStudio";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "SEO Brief Generator",
  description: "A brief from stored headings and keyword rows.",
  path: "/content/brief",
  index: true,
});

export default function Page() {
  return (
    <ArticleStudio
      kind="seo-brief"
      title="SEO Brief Generator"
      description="A brief from stored headings and keyword rows. A person still publishes."
    />
  );
}
