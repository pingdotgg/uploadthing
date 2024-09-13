import { type Metadata } from "next";
import { getAllArticles } from "@/lib/articles";

import { ArticlesPage } from "../../_components/articles-page";

export const metadata: Metadata = {
  title: "Articles",
  description: "UploadThing blog posts",
};

export async function generateStaticParams() {
  const { allTags } = await getAllArticles();
  return allTags.map((tag) => ({ category: tag }));
}

export default function ArticlesIndex(
  props: Readonly<{
    params: { category: string };
  }>,
) {
  return <ArticlesPage tag={props.params.category} />;
}
