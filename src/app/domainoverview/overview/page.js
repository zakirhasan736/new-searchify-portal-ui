import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Domain Overview",
  description: "Domain metric detail.",
  path: "/domainoverview/overview",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="domain-snapshot"
      title="Domain Overview"
      description="Domain metric detail."
      group="Research"
      initialTab="table"
    />
  );
}
