import { forward } from "@/lib/backend";

export async function POST(request) {
  return forward(request, "/api/v1/crawl/on-page-fix");
}
