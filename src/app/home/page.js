import { pageMeta } from "@/lib/seo";
import HomeOverview from "@/components/studio/HomeOverview";

export const metadata = pageMeta({
  title: "Overview",
  description: "Searchify home overview with toolkits and project sites.",
  path: "/home",
  index: true,
});

export default function Page() {
  return <HomeOverview />;
}
