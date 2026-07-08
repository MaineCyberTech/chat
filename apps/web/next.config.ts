import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@chat/ui"],
  output: "standalone",
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/favicon.ico",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
      {
        source: "/android-chrome-:size.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/apple-touch-icon.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);

/*
 * ── Performance Budget (P3) ──────────────────────────────
 * Target metrics (Core Web Vitals):
 *   LCP (Largest Contentful Paint)  < 2.5s
 *   FID (First Input Delay)         < 100ms
 *   CLS (Cumulative Layout Shift)   < 0.1
 *   JS bundle (gzipped)             < 300KB
 *
 * Run `ANALYZE=true pnpm build` to generate bundle reports
 * in `.next/analyze/`. Monitor these metrics via CI and
 * flag regressions exceeding 10% of the budget.
 * ─────────────────────────────────────────────────────────
 */
