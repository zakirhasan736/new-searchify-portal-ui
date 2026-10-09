import { pageMeta } from "@/lib/seo";
import AboutView from "@/components/landing/AboutView";

export const metadata = pageMeta({
  title: "About",
  description: "Learn why Searchify is being rebuilt around a clear, reviewable workflow for SEO work on WordPress sites.",
  path: "/about",
});

export default function Page() {
  return <AboutView />;
}
