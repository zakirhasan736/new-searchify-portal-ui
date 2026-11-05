import { pageMeta } from "@/lib/seo";
import HomeView from "@/components/landing/HomeView";

export const metadata = pageMeta({
  title: "Be found on Google, ChatGPT, and Claude. Get more calls.",
  description:
    "Searchify finds what's keeping your website out of Google and AI answers, writes the fix, and publishes it with your OK. Then it shows you what each fix earned: visitors, calls and quote requests.",
  path: "/",
});

export default function Page() {
  return <HomeView />;
}
