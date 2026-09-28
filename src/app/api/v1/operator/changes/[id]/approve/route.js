import { forward } from "@/lib/backend";

export async function POST(request, { params }) {
  const { id } = await params;
  return forward(request, `/api/v1/operator/changes/${id}/approve`);
}
