export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

/** Keep this page free of client-only shells / next/link for stable prerender. */
export default function NotFound() {
  return (
    <section style={{ padding: "48px 24px", color: "#F2F4F5", background: "#0A0B0D", minHeight: "60vh" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Page not found</h1>
      <p style={{ marginBottom: "16px", color: "#9AA1AB" }}>That Searchify page is not on this site.</p>
      <a href="/" style={{ color: "#4DA3FF" }}>
        Back to Searchify
      </a>
    </section>
  );
}
