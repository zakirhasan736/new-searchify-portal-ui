const apiUrl = process.env.SEARCHIFY_API_URL || "http://127.0.0.1:8000";

export async function GET(request) {
  const { search } = new URL(request.url);
  try {
    const upstream = await fetch(`${apiUrl}/api/v1/auth/oauth/google/callback${search}`, {
      redirect: "manual",
      cache: "no-store",
    });
    const location = upstream.headers.get("location");
    if (location) {
      return new Response(null, { status: 302, headers: { Location: location } });
    }
    const text = await upstream.text();
    return new Response(text || "{}", {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return Response.redirect(new URL("/login?social=error", request.url), 302);
  }
}
