import nextra from "nextra";

const withNextra = nextra({
  theme: "nextra-theme-docs",
  themeConfig: "./src/theme.config.js",
  staticImage: true,
  latex: true,
  flexsearch: {
    codeblock: false,
  },
});

export default withNextra({
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  env: {
    NO_INDEX: process.env.VERCEL_ENV !== "production" ? "true" : "false",
  },
});
