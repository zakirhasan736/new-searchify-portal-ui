import AdminTagsPage from "@/components/v3/pages/AdminTagsPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Tag management",
  description: "Admin tag management for Searchify.",
  path: "/admin/tagmgmt",
  index: false,
});

export default function Page() {
  return <AdminTagsPage />;
}
