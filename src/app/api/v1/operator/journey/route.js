import { forward } from "@/lib/backend";

export async function GET(request) {
  return forward(request, "/api/v1/operator/journey");
}

export async function PUT(request) {
  return forward(request, "/api/v1/operator/journey");
}
