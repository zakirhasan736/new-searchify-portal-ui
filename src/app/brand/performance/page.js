import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Brand Performance",
  description: "Brand mentions and share of voice stored for this project.",
  path: "/brand/performance",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="brand-performance"
      title="Brand Performance"
      description="Brand mentions and share of voice stored for this project."
    />
  );
}
