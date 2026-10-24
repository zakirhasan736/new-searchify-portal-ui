import { pageMeta } from "@/lib/seo";
import HomeView from "@/components/landing/HomeView";

export const metadata = pageMeta({
  title: "Don't lose customers on Google",
  description:
    "Searchify scans your site, colour-codes every fix, and ships them one at a time — with your approval, and proof of what each one earned.",
  path: "/",
});

export default function Page() {
  return <HomeView />;
}
