import { forward } from "@/lib/backend";

export async function GET(request) {
  return forward(request, "/api/v1/operator/business-profile");
}

export async function PUT(request) {
  return forward(request, "/api/v1/operator/business-profile");
}
