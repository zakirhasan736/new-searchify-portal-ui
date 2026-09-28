import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Market Overview",
  description: "Category demand and competitor share. A scheduled note is stored.",
  path: "/market/overview",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="market-overview"
      title="Market Overview"
      description="Category demand and competitor share. A scheduled note is stored."
    />
  );
}
