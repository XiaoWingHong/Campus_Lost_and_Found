import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@u4/opencv4nodejs"],
  images: {
    remotePatterns: [],
    unoptimized: true,
  },
  devIndicators: false,
};

export default nextConfig;
