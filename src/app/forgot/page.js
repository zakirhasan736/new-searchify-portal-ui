import { pageMeta } from "@/lib/seo";
import Screen from "@/components/body-main/auth/forgotpassword";

export const metadata = pageMeta({
  title: "Forgot password",
  description: "Reset your Searchify password.",
  path: "/forgot",
  index: false,
});

export default function Page() {
  return <Screen />;
}
