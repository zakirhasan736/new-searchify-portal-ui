import { forward } from "@/lib/backend";

export async function GET(request, { params }) {
  const { projectId } = await params;
  return forward(request, `/api/v1/projects/${projectId}`);
}

export async function PUT(request, { params }) {
  const { projectId } = await params;
  return forward(request, `/api/v1/projects/${projectId}`);
}
