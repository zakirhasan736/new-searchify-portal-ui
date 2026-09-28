import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Visibility Overview",
  description: "Search Console plus stored AI answers.",
  path: "/visibility/overview",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="visibility-overview"
      title="Visibility Overview"
      description="Search Console plus stored AI answers."
    />
  );
}
