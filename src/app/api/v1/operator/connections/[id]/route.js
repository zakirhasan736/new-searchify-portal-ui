import { forward } from "@/lib/backend";

export async function DELETE(request, { params }) {
  const { id } = await params;
  return forward(request, `/api/v1/operator/connections/${id}`);
}
