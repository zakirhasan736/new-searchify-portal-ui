import { pageMeta } from "@/lib/seo";
import ContactView from "@/components/landing/ContactView";

export const metadata = pageMeta({
  title: "Contact",
  description: "Contact Searchify to discuss the product preview, first customer workflow, or founding customer pilot.",
  path: "/contact",
});

export default function Page() {
  return <ContactView />;
}
