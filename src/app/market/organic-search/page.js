import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Organic Search",
  description: "Clicks, impressions, CTR, and average position.",
  path: "/market/organic-search",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="organic-search"
      title="Organic Search"
      description="Clicks, impressions, CTR, and average position."
    />
  );
}
