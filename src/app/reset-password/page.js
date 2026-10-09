import { Suspense } from "react";
import { pageMeta } from "@/lib/seo";
import Screen from "@/components/body-main/auth/resetpassword";
import PageSkeleton from "@/components/v3/PageSkeleton";

export const metadata = pageMeta({
  title: "Reset password",
  description: "Choose a new Searchify password.",
  path: "/reset-password",
  index: false,
});

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Screen />
    </Suspense>
  );
}
