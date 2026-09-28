import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Keyword Manager",
  description: "Your lists and lists shared with you.",
  path: "/keywordmannager/home",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="keyword-manager"
      title="Keyword Manager"
      description="Your lists and lists shared with you."
      group="Research"
      initialTab="overview"
    />
  );
}
