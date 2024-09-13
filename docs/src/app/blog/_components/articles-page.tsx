import { Button } from "@/components/Button";
import { Container } from "@/components/Container";
import { getAllArticles } from "@/lib/articles";

import { ArticleCard, FeaturedArticle } from "./article-card";

export async function ArticlesPage(
  props: Readonly<{
    tag: string | undefined;
  }>,
) {
  const activeTag = props.tag;
  let { articles, allTags } = await getAllArticles(activeTag);

  return (
    <Container className="mt-16 w-full sm:mt-32">
      <header className="">
        <ul className="flex flex-wrap gap-4">
          <li>
            <Button
              className="capitalize"
              href={`/blog`}
              variant={!activeTag ? "primary" : "outline"}
            >
              All posts
            </Button>
          </li>
          {allTags.map((tag) => (
            <li key={tag}>
              <Button
                className="capitalize"
                href={`/blog/category/${tag}`}
                variant={tag === activeTag ? "primary" : "outline"}
              >
                {tag}
              </Button>
            </li>
          ))}
        </ul>
        <h1 className="mt-6 text-4xl font-bold capitalize tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
          {activeTag ?? "All posts"}
        </h1>
        <div className="mt-16">
          <FeaturedArticle article={articles[0]} />
        </div>
      </header>

      <div className="mt-16 sm:mt-20">
        <div className="md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
          <div className="flex flex-col space-y-16">
            {/* {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))} */}
          </div>
        </div>
      </div>
    </Container>
  );
}
