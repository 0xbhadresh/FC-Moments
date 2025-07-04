import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "videos.pexels.com",
      },
      {
        protocol: "https",
        hostname: "commondatastorage.googleapis.com",
      },
      {
        protocol: "http",
        hostname: "gateway.lighthouse.storage",
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
      "https://manufacture-boats-birthday-sad.trycloudflare.com",
    ],
  },
};

export default nextConfig;
