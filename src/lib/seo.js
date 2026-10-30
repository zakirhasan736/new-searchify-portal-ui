const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export function absoluteUrl(path = "/") {
  if (!path.startsWith("/")) return `${siteUrl}/${path}`;
  return `${siteUrl}${path}`;
}

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1080,
  height: 1080,
  alt: "Searchify",
  type: "image/png",
};

export function pageMeta({ title, description, path = "/", index = true, image = "/og-image.png" }) {
  const url = absoluteUrl(path);
  const ogImage = {
    ...OG_IMAGE,
    url: image.startsWith("http") ? image : absoluteUrl(image),
  };
  return {
    title: { absolute: `${title} | Searchify` },
    description,
    alternates: { canonical: url },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      title,
      description,
      url,
      siteName: "Searchify",
      type: "website",
      locale: "en_US",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
    },
  };
}

export const indexedPaths = [
  "/works",
  "/dashboard",
  "/seooptimization",
  "/seooptimization/new",
  "/SEOranking",
  "/keywordanalyze/home",
  "/keywordanalyze/overview",
  "/websitekeyword/home",
  "/websitekeyword/overview",
  "/keywordgeneretor/home",
  "/keywordgeneretor/overview",
  "/keywordgap/home",
  "/keywordgap/overview",
  "/keywordmannager/home",
  "/keywordmannager/overview",
  "/organicsearch/home",
  "/organicsearch/overview",
  "/trafficsAnalytics/home",
  "/trafficsAnalytics/overview",
  "/keywordoverview/home",
  "/keywordoverview/overview",
  "/domainoverview/home",
  "/domainoverview/overview",
  "/backlink/home",
  "/backlink/overview",
  "/features",
  "/news",
];
