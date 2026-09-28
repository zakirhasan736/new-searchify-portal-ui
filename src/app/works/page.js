import { pageMeta } from "@/lib/seo";
import { WorksPage } from "@/components/studio/ProductPages";

export const metadata = pageMeta({
  title: "My works",
  description: "Project catalog for adding and opening Searchify sites.",
  path: "/works",
  index: true,
});

export default function Page() {
  return <WorksPage />;
}
