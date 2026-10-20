import { forward } from "@/lib/backend";

export async function POST(request) {
  return forward(request, "/api/v1/push/subscribe");
}

export async function DELETE(request) {
  return forward(request, "/api/v1/push/subscribe");
}
