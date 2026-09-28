import { pageMeta } from "@/lib/seo";
import Screen from "@/components/body-main/auth/signup";

export const metadata = pageMeta({
  title: "Sign up",
  description: "Create a Searchify client account.",
  path: "/signup",
  index: false,
});

export default function Page() {
  return <Screen />;
}
