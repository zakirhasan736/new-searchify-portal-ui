import { forward } from "@/lib/backend";

export async function DELETE(request, { params }) {
  const { kind, id } = await params;
  return forward(request, `/api/v1/features/${kind}/${id}`);
}
