import type { NextConfig } from "next";

import { env } from "./lib/env";

const isDev = process.env.NODE_ENV !== "production";

// Next inlines its bootstrap scripts without a nonce, so script-src needs
// 'unsafe-inline'; React's dev tooling also needs 'unsafe-eval'. Images come from the
// API's storage (Cloudinary in production, the API origin in development) and from
// blob: previews of files being uploaded.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://res.cloudinary.com ${env.apiBaseUrl}`,
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const apiOrigin = new URL(env.apiBaseUrl);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**", search: "" },
      {
        protocol: apiOrigin.protocol === "https:" ? "https" : "http",
        hostname: apiOrigin.hostname,
        port: apiOrigin.port,
        pathname: "/media/**",
        search: "",
      },
    ],
    // Next refuses to optimise images from private addresses; locally the API's
    // media is served from localhost.
    dangerouslyAllowLocalIP: ["localhost", "127.0.0.1", "[::1]"].includes(apiOrigin.hostname),
  },
  experimental: {
    // One product image or brand logo per action; the API caps images at 5 MB.
    serverActions: { bodySizeLimit: "6mb" },
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
