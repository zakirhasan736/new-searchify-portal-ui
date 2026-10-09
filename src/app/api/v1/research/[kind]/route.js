import { forward } from "@/lib/backend";

const KINDS = new Set(["status", "keywords", "backlinks", "visibility", "audit"]);

function notFound() {
  return new Response(JSON.stringify({ detail: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
}

export async function GET(request, { params }) {
  const { kind } = await params;
  if (kind !== "status") return notFound();
  return forward(request, "/api/v1/research/status");
}

export async function POST(request, { params }) {
  const { kind } = await params;
  if (!KINDS.has(kind) || kind === "status") return notFound();
  return forward(request, `/api/v1/research/${kind}`);
}
