import { absoluteUrl, indexedPaths } from "@/lib/seo";
import { FEATURES } from "@/lib/featureCatalog";

export default function sitemap() {
  const lastModified = new Date();
  const paths = [...indexedPaths, ...FEATURES.map((feature) => feature.path)];
  return paths.map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: "weekly",
    priority: path === "/dashboard" || path === "/works" ? 0.9 : 0.7,
  }));
}
