import { pageMeta } from "@/lib/seo";
import SeoDashboard from "@/components/studio/SeoDashboard";

export const metadata = pageMeta({
  title: "SEO Dashboard",
  description: "AI visibility, rankings, site health, and traffic for this project.",
  path: "/dashboard",
  index: true,
});

export default function Page() {
  return <SeoDashboard />;
}
