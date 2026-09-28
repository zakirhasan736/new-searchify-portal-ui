import Workspace from "@/components/features/Workspace";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "GSC by Country",
  description: "Search Console clicks and impressions by country.",
  path: "/market/gsc-countries",
  index: true,
});

export default function Page() {
  return (
    <Workspace
      kind="gsc-countries"
      title="GSC by Country"
      description="Search Console performance split by country."
    />
  );
}
