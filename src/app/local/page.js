import LocalStudio from "@/components/studio/LocalStudio";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Local Dashboard",
  description: "Local visibility overview for listings and map ranks.",
  path: "/local",
  index: true,
});

export default function Page() {
  return <LocalStudio kind="local-dashboard" />;
}
