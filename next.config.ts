import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
