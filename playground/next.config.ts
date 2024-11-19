import type { NextConfig } from "next";

export default {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    ppr: true,
    dynamicIO: true,
  },
} satisfies NextConfig;
