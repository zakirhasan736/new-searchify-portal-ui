export default function manifest() {
  return {
    name: "Searchify",
    short_name: "Searchify",
    description: "Phone report and approval inbox for the Searchify workspace.",
    id: "/app/phone",
    start_url: "/app/phone",
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
