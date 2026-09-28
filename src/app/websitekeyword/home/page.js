import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Website Keywords",
  description: "Organic and paid keywords for a domain.",
  path: "/websitekeyword/home",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="website-keywords"
      title="Website Keywords"
      description="Organic and paid keywords for a domain."
      group="Research"
      initialTab="overview"
    />
  );
}
