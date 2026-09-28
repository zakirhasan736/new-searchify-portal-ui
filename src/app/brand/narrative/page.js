import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Narrative Drivers",
  description: "Themes that drive brand mentions.",
  path: "/brand/narrative",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="brand-narrative"
      title="Narrative Drivers"
      description="Themes that drive brand mentions."
    />
  );
}
