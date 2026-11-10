import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone", // disabled for Vercel serverless
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
