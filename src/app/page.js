import { pageMeta } from "@/lib/seo";
import Screen from "@/components/body-main/auth/signin";

export const metadata = pageMeta({
  title: "Sign in",
  description: "Sign in to Searchify to open projects, site optimization, and SEO analytics.",
  path: "/",
  index: false,
});

export default function Page() {
  return <Screen />;
}
