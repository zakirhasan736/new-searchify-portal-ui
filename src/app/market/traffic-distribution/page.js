import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Traffic Distribution",
  description: "Organic, direct, paid, referral, social, and email.",
  path: "/market/traffic-distribution",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="traffic-distribution"
      title="Traffic Distribution"
      description="Organic, direct, paid, referral, social, and email."
    />
  );
}
