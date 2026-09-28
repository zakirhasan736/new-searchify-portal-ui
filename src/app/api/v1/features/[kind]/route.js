import { forward } from "@/lib/backend";

export async function GET(request, { params }) {
  const { kind } = await params;
  return forward(request, `/api/v1/features/${kind}`);
}

export async function POST(request, { params }) {
  const { kind } = await params;
  return forward(request, `/api/v1/features/${kind}`);
}
