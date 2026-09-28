import { pageMeta } from "@/lib/seo";
import { NewsPage } from "@/components/studio/AccountPages";

export const metadata = pageMeta({
  title: "Announcements",
  description: "Searchify news cards.",
  path: "/news",
  index: true,
});

export default function Page() {
  return <NewsPage />;
}
