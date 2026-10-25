import SearchifyLoader from "@/components/v8/SearchifyLoader";

/** In-pane wait. Keeps the app chrome and replaces the gray full-page skeleton. */
export default function PageSkeleton() {
  return <SearchifyLoader label="Loading this page" />;
}
