import { pageMeta } from "@/lib/seo";
import HomeView from "@/components/landing/HomeView";

export const metadata = pageMeta({
  title: "Get found on Google. And in the AI answers.",
  description:
    "Your customers search Google, then ask ChatGPT. Searchify finds what's keeping your site out of both, fixes it one step at a time with your OK, and shows you what each fix earned.",
  path: "/",
});

export default function Page() {
  return <HomeView />;
}
