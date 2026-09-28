import LocalStudio from "@/components/studio/LocalStudio";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Listing Management",
  description: "Directory listings and accuracy for local search.",
  path: "/local/listings",
  index: true,
});

export default function Page() {
  return <LocalStudio kind="local-listings" />;
}
