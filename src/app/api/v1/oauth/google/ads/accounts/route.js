import { forward } from "@/lib/backend";

export async function GET(request) {
  const qs = new URL(request.url).searchParams.toString();
  return forward(request, `/api/v1/oauth/google/ads/accounts${qs ? `?${qs}` : ""}`);
}
