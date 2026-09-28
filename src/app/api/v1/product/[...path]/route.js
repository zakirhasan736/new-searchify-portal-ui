import { forward } from "@/lib/backend";

async function relay(request, context) {
  const params = await context.params;
  const parts = params?.path;
  const suffix = Array.isArray(parts) ? parts.join("/") : parts || "";
  const search = new URL(request.url).search || "";
  return forward(request, `/api/v1/product/${suffix}${search}`);
}

export const GET = relay;
export const POST = relay;
export const PUT = relay;
export const PATCH = relay;
export const DELETE = relay;
