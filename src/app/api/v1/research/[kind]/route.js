import { forward } from "@/lib/backend";

const KINDS = new Set(["keywords", "backlinks", "visibility", "audit"]);
const READS = new Set(["status", "usage"]);

function notFound() {
  return new Response(JSON.stringify({ detail: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
}

export async function GET(request, { params }) {
  const { kind } = await params;
  if (!READS.has(kind)) return notFound();
  return forward(request, `/api/v1/research/${kind}`);
}

export async function POST(request, { params }) {
  const { kind } = await params;
  if (!KINDS.has(kind)) return notFound();
  return forward(request, `/api/v1/research/${kind}`);
}
