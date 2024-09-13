import { type Metadata } from "next";
import { getAllArticles } from "@/lib/articles";

import { ArticlesPage } from "../../_components/articles-page";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "All of my long-form thoughts on programming, leadership, product design, and more, collected in chronological order.",
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
