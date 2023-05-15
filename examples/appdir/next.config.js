/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["uploadthing", "@uploadthing/react"],
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
