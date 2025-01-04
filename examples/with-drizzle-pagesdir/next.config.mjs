/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    esmExternals: false, // THIS IS THE FLAG THAT MATTERS
  },
};

export default config;
