import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.LAPENZER_STATIC_PREVIEW === "1" ? "export" : "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    unoptimized: process.env.LAPENZER_STATIC_PREVIEW === "1",
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }]
  }
};

export default nextConfig;
