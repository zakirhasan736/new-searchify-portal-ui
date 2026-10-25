export default function manifest() {
  return {
    name: "Searchify",
    short_name: "Searchify",
    description: "Searchify workspace for site review and approved changes.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#101112",
    theme_color: "#101112",
    lang: "en",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
