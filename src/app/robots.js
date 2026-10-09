import { absoluteUrl } from "@/lib/seo";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/login", "/signin", "/signup", "/forgot", "/forgotpassword", "/reset", "/reset-password", "/resetpassword", "/admin", "/UserProfile", "/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
