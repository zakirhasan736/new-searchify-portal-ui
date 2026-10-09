import { Manrope, Barlow_Condensed } from "next/font/google";
import ProductShell from "@/components/v3/ProductShell";
import { absoluteUrl } from "@/lib/seo";
import "../index.css";
import "./tailwind.css";
import "../styles/landing.css";
import "../components/share/accordion/accordion.css";
import "react-toastify/dist/ReactToastify.css";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-barlow",
  weight: ["600", "700", "800"],
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
    icon: "/icon.png",
    apple: "/icon.png",
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Searchify",
    locale: "en_US",
  },
};

export const viewport = {
  themeColor: "#101112",
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
    <html lang="en" className={`${manrope.variable} ${barlow.variable}`}>
      <body className={manrope.className} style={{ margin: 0, background: "#101112" }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <ProductShell>{children}</ProductShell>
      </body>
    </html>
  );
}
