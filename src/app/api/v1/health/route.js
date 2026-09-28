const apiUrl = process.env.SEARCHIFY_API_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    const upstream = await fetch(`${apiUrl}/api/v1/health`, { cache: "no-store" });
    const api = await upstream.json();
    return Response.json({ ok: upstream.ok, portal: "searchify", api });
  } catch {
    return Response.json({ ok: false, portal: "searchify", api: null }, { status: 503 });
  }
}
