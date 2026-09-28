import { forward } from "@/lib/backend";

async function start(request) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  // Upstream FastAPI route is GET-only
  const headers = { "Content-Type": "application/json" };
  const authorization = request.headers.get("authorization");
  if (authorization) headers.Authorization = authorization;
  const apiUrl = process.env.SEARCHIFY_API_URL || "http://127.0.0.1:8000";
  try {
    const upstream = await fetch(`${apiUrl}/api/v1/oauth/google/start${qs ? `?${qs}` : ""}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    const text = await upstream.text();
    return new Response(text || "{}", {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return Response.json({ detail: "Searchify API is not running" }, { status: 503 });
  }
}

export async function GET(request) {
  return start(request);
}

export async function POST(request) {
  return start(request);
}
