import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Domain Overview",
  description: "A domain-level SEO snapshot.",
  path: "/domainoverview/home",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="domain-snapshot"
      title="Domain Overview"
      description="A domain-level SEO snapshot."
      group="Research"
      initialTab="overview"
    />
  );
}
