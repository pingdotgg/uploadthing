/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["uploadthing", "@uploadthing/react"],
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig;
