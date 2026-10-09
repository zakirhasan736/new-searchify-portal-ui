import { forward } from "@/lib/backend";

const apiUrl = process.env.SEARCHIFY_API_URL || "http://127.0.0.1:8000";

/** Google redirects the browser here after consent. Forward to FastAPI, then send its Location back. */
export async function GET(request) {
  const { search } = new URL(request.url);
  try {
    const upstream = await fetch(`${apiUrl}/api/v1/oauth/google/callback${search}`, {
      redirect: "manual",
      cache: "no-store",
    });
    const location = upstream.headers.get("location");
    if (location) {
      return new Response(null, { status: 302, headers: { Location: location } });
    }
    return forward(request, `/api/v1/oauth/google/callback${search}`);
  } catch {
    return Response.redirect(new URL("/app/connections?google=error&detail=callback", request.url), 302);
  }
}
