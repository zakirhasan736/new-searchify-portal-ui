import { forward } from "@/lib/backend";

export async function GET(request) {
  const { search } = new URL(request.url);
  return forward(request, `/api/v1/operator/market${search}`);
}

export async function PUT(request) {
  return forward(request, "/api/v1/operator/market");
}
