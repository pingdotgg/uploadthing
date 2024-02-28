import { loader } from "fumadocs-core/source";
import { createMDXSource } from "fumadocs-mdx";
import { map } from "~/.map";

export const { getPage, getPages, pageTree } = loader({
  baseUrl: "/docs",
  rootDir: "docs",
  source: createMDXSource(map),
});

export const siteConfig = {
  name: "Acme Corp Lib",
  description:
    "The perfect starter template for your next TypeScript library. Batteries included powered by PNPM Workspaces, Turborepo, tsup & Changesets.",
  links: {
    twitter: "https://twitter.com/jullerino",
    github: "https://github.com/juliusmarminge/acme-corp-lib",
    docs: "/docs",
  },
};
