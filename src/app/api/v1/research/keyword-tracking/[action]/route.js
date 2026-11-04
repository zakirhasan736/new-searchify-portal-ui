import { forward } from "@/lib/backend";

// Tracked keywords live in the backend database (never in the browser).
const READS = new Set(["tracked"]);
const WRITES = new Set(["track", "untrack", "check-ranks"]);

function notFound() {
  return new Response(JSON.stringify({ detail: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
}

export async function GET(request, { params }) {
  const { action } = await params;
  if (!READS.has(action)) return notFound();
  return forward(request, `/api/v1/research/keywords/${action}`);
}

export async function POST(request, { params }) {
  const { action } = await params;
  if (!WRITES.has(action)) return notFound();
  return forward(request, `/api/v1/research/keywords/${action}`);
}
