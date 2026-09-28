import { pageMeta } from "@/lib/seo";
import Screen from "@/components/body-main/auth/signin";

export const metadata = pageMeta({
  title: "Sign in",
  description: "Sign in to your Searchify workspace.",
  path: "/signin",
  index: false,
});

export default function Page() {
  return <Screen />;
}
