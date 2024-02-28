import { DocsLayout } from "fumadocs-ui/layout";
import type { ReactNode } from "react";
import { pageTree, siteConfig } from "~/app/source";

export default function RootDocsLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={pageTree}
      nav={{
        title: siteConfig.name,
        githubUrl: siteConfig.links.github,
      }}
      links={[{ text: "Docs", url: "/docs" }]}
    >
      {children}
    </DocsLayout>
  );
}
