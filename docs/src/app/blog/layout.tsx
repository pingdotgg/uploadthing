import { Section } from "@/components/SectionProvider";
import glob from "fast-glob";

import { ArticlesLayout } from "./_components/layouts";

export default async function BlogLayout(
  props: Readonly<{ children: React.ReactNode }>,
) {
  let pages = await glob("**/*.mdx", { cwd: "src/app/blog/(posts)" });
  let allSectionsEntries = (await Promise.all(
    pages.map(async (filename) => [
      "/" + filename.replace(/(^|\/)page\.mdx$/, ""),
      (await import(`./(posts)/${filename}`)).sections,
    ]),
  )) as Array<[string, Array<Section>]>;
  let allSections = Object.fromEntries(allSectionsEntries);

  return (
    <ArticlesLayout allSections={allSections}>{props.children}</ArticlesLayout>
  );
}
