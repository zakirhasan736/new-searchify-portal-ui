export default function manifest() {
  return {
    name: "Searchify",
    short_name: "Searchify",
    description: "Searchify workspace for site review and approved changes.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0A0B0D",
    theme_color: "#0A0B0D",
    lang: "en",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/searchify-mark-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
