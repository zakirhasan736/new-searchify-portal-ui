import { forward } from "@/lib/backend";

export async function GET(request) {
  return forward(request, "/api/v1/oauth/google/status");
}
