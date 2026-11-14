import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel serverless deployment does not require standalone output.
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
