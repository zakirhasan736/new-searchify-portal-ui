const apiUrl = process.env.SEARCHIFY_API_URL || "http://127.0.0.1:8000";

export async function forward(request, path) {
  const headers = { "Content-Type": "application/json" };
  const authorization = request.headers.get("authorization");
  if (authorization) headers.Authorization = authorization;

  const init = { method: request.method, headers, cache: "no-store" };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  try {
    const upstream = await fetch(`${apiUrl}${path}`, init);
    const text = await upstream.text();
    const headers = { "Content-Type": "application/json" };
    if (request.method === "GET" || request.method === "HEAD") {
      headers["Cache-Control"] = "private, max-age=8";
    } else {
      headers["Cache-Control"] = "no-store";
    }
    return new Response(text || "{}", {
      status: upstream.status,
      headers,
    });
  } catch {
    return Response.json({ detail: "Searchify API is not running" }, { status: 503 });
  }
}
