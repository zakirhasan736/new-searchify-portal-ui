import Link from "next/link";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section style={{ padding: "48px 24px", color: "#fff" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Page not found</h1>
      <p style={{ marginBottom: "16px" }}>That Searchify page is not on this site.</p>
      <Link href="/works">Go to My works</Link>
    </section>
  );
}
