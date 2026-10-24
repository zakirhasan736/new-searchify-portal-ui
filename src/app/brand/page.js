import { pageMeta } from "@/lib/seo";
import LogoScreen from "@/components/v8/screens/LogoScreen";

export const metadata = pageMeta({
  title: "Brand mark",
  description: "Searchify logo — six lights from Poor to Excellent.",
  path: "/brand",
  index: false,
});

export default function Page() {
  return <LogoScreen />;
}
