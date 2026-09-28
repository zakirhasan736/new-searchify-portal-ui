import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Position Tracking",
  description: "Rank history from stored checks.",
  path: "/site/positions",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="position-tracking"
      title="Position Tracking"
      description="Rank history from stored checks."
    />
  );
}
