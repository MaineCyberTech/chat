import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.STANDALONE === "1" ? "standalone" : undefined,
  reactStrictMode: true,
  transpilePackages: ["@chat/ui"],
};

export default nextConfig;
