import LocalStudio from "@/components/studio/LocalStudio";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Review Management",
  description: "Review volume, ratings, and AI reply queue.",
  path: "/local/reviews",
  index: true,
});

export default function Page() {
  return <LocalStudio kind="local-reviews" />;
}
