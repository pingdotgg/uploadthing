import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const analyze = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
} satisfies NextConfig;

export default analyze(nextConfig);
