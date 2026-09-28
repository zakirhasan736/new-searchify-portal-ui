import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Website Keywords",
  description: "Organic versus paid.",
  path: "/websitekeyword/overview",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="website-keywords"
      title="Website Keywords"
      description="Organic versus paid."
      group="Research"
      initialTab="table"
    />
  );
}
