import { pageMeta } from "@/lib/seo";
import { ProfilePage } from "@/components/studio/AccountPages";

export const metadata = pageMeta({
  title: "User profile",
  description: "Photo and profile fields for the signed-in account.",
  path: "/UserProfile",
  index: false,
});

export default function Page() {
  return <ProfilePage />;
}
