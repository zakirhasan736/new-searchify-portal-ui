import { absoluteUrl, indexedPaths } from "@/lib/seo";
import { FEATURES } from "@/lib/featureCatalog";

export default function sitemap() {
  const lastModified = new Date();
  const paths = ["/", "/about", "/pricing", "/contact", "/terms", "/privacy", ...indexedPaths, ...FEATURES.map((feature) => feature.path)];
  return paths.map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : path === "/about" || path === "/pricing" || path === "/contact" || path === "/terms" || path === "/privacy" ? 0.8 : path === "/dashboard" || path === "/works" ? 0.9 : 0.7,
  }));
}
