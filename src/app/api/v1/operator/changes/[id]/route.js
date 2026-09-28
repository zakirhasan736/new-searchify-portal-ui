import { forward } from "@/lib/backend";

export async function PATCH(request, { params }) {
  const { id } = await params;
  return forward(request, `/api/v1/operator/changes/${id}`);
}
