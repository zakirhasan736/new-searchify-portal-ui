import LocalStudio from "@/components/studio/LocalStudio";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Map Rank Tracker",
  description: "Map pack positions from Places order.",
  path: "/local/map-ranks",
  index: true,
});

export default function Page() {
  return <LocalStudio kind="local-map-ranks" />;
}
