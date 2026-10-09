import { pageMeta } from "@/lib/seo";
import HomeView from "@/components/landing/HomeView";

export const metadata = pageMeta({
  title: "SEO that gets done",
  description:
    "Find the next SEO opportunity. Review the recommendation. Publish approved changes and verify the result with Searchify.",
  path: "/",
});

export default function Page() {
  return <HomeView />;
}
