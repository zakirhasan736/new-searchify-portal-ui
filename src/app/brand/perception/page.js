import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Perception",
  description: "How AI answers describe the brand.",
  path: "/brand/perception",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="brand-perception"
      title="Perception"
      description="How AI answers describe the brand."
    />
  );
}
