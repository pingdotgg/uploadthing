import { cache } from "react";
import { blogParams } from "@/app/(api)/api/og/utils";
import glob from "fast-glob";

export interface Article {
  title: string;
  description: string;
  authors: {
    name: string;
    role: string;
    src: string;
    href: string;
  }[];
  date: string;
  tags: string[];
  image?: string;
}

export interface ArticleWithSlug extends Article {
  slug: string;
  image: string;
}

async function importArticle(
  articleFilename: string,
): Promise<ArticleWithSlug> {
  let { article } = (await import(
    `../app/blog/(posts)/${articleFilename}`
  )) as {
    default: React.ComponentType;
    article: Article;
  };

  const ogImage =
    article.image ??
    "/api/og/blog?" +
      blogParams.toSearchString({
        title: article.title,
        authors: article.authors,
      });

  return {
    slug: articleFilename.replace(/(\/page)?\.mdx$/, ""),
    image: ogImage,
    ...article,
  };
}

export const getAllArticles = cache(async (tag?: string) => {
  let articleFilenames = await glob("*/page.mdx", {
    cwd: "./src/app/blog/(posts)",
  });

  let articles = await Promise.all(articleFilenames.map(importArticle));
  const allTags = [...new Set(articles.flatMap((article) => article.tags))];

  // Filter by tag
  if (typeof tag === "string") {
    articles = articles.filter((article) => article.tags.includes(tag));
  }

  // Sort articles by date, tags alphabetically
  articles.sort((a, z) => +new Date(z.date) - +new Date(a.date));
  allTags.sort((a, b) => a.localeCompare(b));

  return { articles, allTags };
});
