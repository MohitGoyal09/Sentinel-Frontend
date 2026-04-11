import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker production builds
  output: "standalone",

  // Fix turbopack workspace root detection (parent dirs have stray package.json)
  turbopack: {
    root: ".",
  },

  // Security: remove X-Powered-By header
  poweredByHeader: false,

  // Strict mode for catching common React bugs
  reactStrictMode: true,

  // Image optimization domains (add remote domains as needed)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' http://localhost:* http://127.0.0.1:* https://*.supabase.co wss://*.supabase.co ws://localhost:* https://backend.composio.dev https://logos.composio.dev",
              "frame-src 'self' https://*.composio.dev https://accounts.google.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
