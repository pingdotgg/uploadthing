/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is the only flag that matters!
  experimental: { esmExternals: false },

  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
