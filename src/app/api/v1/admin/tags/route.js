import { forward } from "@/lib/backend";

export async function GET(request) {
  return forward(request, "/api/v1/admin/tags");
}

export async function POST(request) {
  return forward(request, "/api/v1/admin/tags");
}
