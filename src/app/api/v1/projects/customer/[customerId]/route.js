import { forward } from "@/lib/backend";

export async function GET(request, { params }) {
  const { customerId } = await params;
  return forward(request, `/api/v1/projects/customer/${customerId}`);
}
