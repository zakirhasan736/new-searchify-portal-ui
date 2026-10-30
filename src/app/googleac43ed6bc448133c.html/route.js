const BODY = "google-site-verification: googleac43ed6bc448133c.html\n";

export const dynamic = "force-static";

export function GET() {
  return new Response(BODY, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
