/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: "standalone",
  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/icon.png", permanent: false },
      { source: "/signin", destination: "/login", permanent: false },
      { source: "/forgotpassword", destination: "/forgot", permanent: false },
      { source: "/resetpassword", destination: "/reset-password", permanent: false },
      { source: "/reset", destination: "/reset-password", permanent: false },
    ];
  },
  images: {
    // Keep CRA-style `import img from './x.png'` as a URL string for <img src>.
    disableStaticImages: true,
  },
  webpack(config) {
    relaxCssModules(config.module.rules);
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|webp|avif|ico|bmp|svg|pdf)$/i,
      type: "asset/resource",
    });
    return config;
  },
};

function relaxCssModules(rules) {
  if (!Array.isArray(rules)) return;
  for (const rule of rules) {
    if (!rule || typeof rule !== "object") continue;
    if (Array.isArray(rule.oneOf)) relaxCssModules(rule.oneOf);
    if (Array.isArray(rule.rules)) relaxCssModules(rule.rules);
    const uses = Array.isArray(rule.use) ? rule.use : rule.use ? [rule.use] : [];
    for (const use of uses) {
      if (
        use &&
        typeof use.loader === "string" &&
        use.loader.includes("css-loader") &&
        use.options &&
        use.options.modules &&
        use.options.modules.mode === "pure"
      ) {
        use.options.modules.mode = "local";
      }
    }
  }
}

export default nextConfig;
