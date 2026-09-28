import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Project making",
  description: "Tags, titles, and stored suggestions for the open site.",
  path: "/projectmaking",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="seo-brief"
      title="Project making"
      description="Stored briefs and suggestion rows for this project."
      group="Start"
    />
  );
}
