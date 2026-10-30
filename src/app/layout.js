import { Bricolage_Grotesque, Caveat, Manrope, Barlow_Condensed } from "next/font/google";
import ProductShell from "@/components/v3/ProductShell";
import StoreProvider from "@/store/StoreProvider";
import { absoluteUrl } from "@/lib/seo";
import "../index.css";
import "./tailwind.css";
import "../styles/landing.css";
import "../styles/home-hero.css";
import "../styles/home-sections.css";
import "../components/share/accordion/accordion.css";
import "react-toastify/dist/ReactToastify.css";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bricolage",
  weight: ["500", "700", "800"],
});

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-barlow",
  weight: ["600", "700", "800"],
});

const caveat = Caveat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-caveat",
  weight: ["600", "700"],
});

export const metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: {
    default: "Searchify",
    template: "%s | Searchify",
  },
  description:
    "Searchify helps agencies complete recurring SEO work across WordPress client sites — evidence-backed priorities, approved updates, verified change records.",
  applicationName: "Searchify",
  appleWebApp: { capable: true, title: "Searchify", statusBarStyle: "black-translucent" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Searchify",
    locale: "en_US",
  },
};

export const viewport = {
  themeColor: "#0A0B0D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  userScalable: true,
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Searchify",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: absoluteUrl("/"),
    description:
      "SEO operator for WordPress agencies: connect GSC/GA4, review title and description updates, approve, publish, verify, and undo.",
  };

  return (
    <html lang="en" className={`${manrope.variable} ${bricolage.variable} ${barlow.variable} ${caveat.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Caveat:wght@600;700&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={manrope.className}
        style={{
          margin: 0,
          background: "#0A0B0D",
          ["--font-geist"]: "Geist, Helvetica Neue, sans-serif",
          ["--font-geist-mono"]: "Geist Mono, ui-monospace, monospace",
        }}
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <StoreProvider>
          <ProductShell>{children}</ProductShell>
        </StoreProvider>
      </body>
    </html>
  );
}
