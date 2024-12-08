import type { NextConfig } from "next";

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env";

export default {
  reactStrictMode: true,

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    esmExternals: false, // THIS IS THE FLAG THAT MATTERS
  },
} satisfies NextConfig;
