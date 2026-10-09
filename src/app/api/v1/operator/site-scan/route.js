import { forward } from "@/lib/backend";

export async function GET(request) {
  const { search } = new URL(request.url);
  return forward(request, `/api/v1/operator/site-scan${search}`);
}

export async function POST(request) {
  return forward(request, "/api/v1/operator/site-scan");
}
