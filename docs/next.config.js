import nextMDX from "@next/mdx";

import { recmaPlugins } from "./src/mdx/recma.js";
import { rehypePlugins } from "./src/mdx/rehype.js";
import { remarkPlugins } from "./src/mdx/remark.js";
import withSearch from "./src/mdx/search.js";

const withMDX = nextMDX({
  options: {
    remarkPlugins,
    rehypePlugins,
    recmaPlugins,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "mdx"],
  images: {
    remotePatterns: [
      {
        hostname: "utfs.io",
        pathname: "/a/s40vlb3kca/*",
      },
    ],
  },
  rewrites: async () => [
    { source: "/auth-security", destination: "/concepts/auth-security" },
    { source: "/errors", destination: "/concepts/error-handling" },
    { source: "/regions-and-acl", destination: "/concepts/regions-acl" },
    { source: "/theming", destination: "/concepts/theming" },
  ],
};

export default withSearch(withMDX(nextConfig));
