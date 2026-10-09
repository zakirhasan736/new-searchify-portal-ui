const apiUrl = process.env.SEARCHIFY_API_URL || "http://127.0.0.1:8000";

export async function forward(request, path) {
  const headers = {};
  const authorization = request.headers.get("authorization");
  if (authorization) headers.Authorization = authorization;

  const init = { method: request.method, headers, cache: "no-store" };
  if (request.method !== "GET" && request.method !== "HEAD") {
    const text = await request.text();
    // Never send Content-Type: application/json with an empty body — Starlette/FastAPI
    // can 500 while parsing "". Omit body for empty DELETE/POST, or pass through real JSON.
    if (text && text.trim()) {
      headers["Content-Type"] = request.headers.get("content-type") || "application/json";
      init.body = text;
    }
  }

  let upstream;
  try {
    try {
      upstream = await fetch(`${apiUrl}${path}`, init);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 400));
      upstream = await fetch(`${apiUrl}${path}`, init);
    }
    const text = await upstream.text();
    const outHeaders = { "Content-Type": "application/json" };
    if (request.method === "GET" || request.method === "HEAD") {
      outHeaders["Cache-Control"] = "private, max-age=8";
    } else {
      outHeaders["Cache-Control"] = "no-store";
    }
    return new Response(text || "{}", {
      status: upstream.status,
      headers: outHeaders,
    });
  } catch {
    return Response.json({ detail: "Searchify API is not running" }, { status: 503 });
  }
}
