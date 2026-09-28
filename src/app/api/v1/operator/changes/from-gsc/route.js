import { forward } from "@/lib/backend";

export async function POST(request) {
  return forward(request, "/api/v1/operator/changes/from-gsc");
}
