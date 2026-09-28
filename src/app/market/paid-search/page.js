import ToolPage from "@/components/studio/ToolPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Paid Search",
  description: "Paid keyword and ad rows stored for this project.",
  path: "/market/paid-search",
  index: true,
});

export default function Page() {
  return (
    <ToolPage
      kind="paid-search"
      title="Paid Search"
      description="Paid keyword and ad rows stored for this project."
    />
  );
}
