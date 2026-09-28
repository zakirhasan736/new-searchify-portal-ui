import LocalStudio from "@/components/studio/LocalStudio";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Competitive Analysis",
  description: "Nearby competitors from Google Places.",
  path: "/local/competitors",
  index: true,
});

export default function Page() {
  return <LocalStudio kind="local-competitors" />;
}
