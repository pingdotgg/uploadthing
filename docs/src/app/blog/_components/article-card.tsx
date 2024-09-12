import { Card } from '@/components/Card'
import { ArticleWithSlug } from '@/lib/articles'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'
import { Tag } from '@/components/Tag'
import { Avatar } from '@/components/Avatar'

export function ArticleCard({ article }: { article: ArticleWithSlug }) {
  return (
    <article className="md:grid md:grid-cols-4 md:items-baseline">
      <Card className="md:col-span-3">
        <Card.Title href={`/blog/${article.slug}`}>{article.title}</Card.Title>
        <Card.Eyebrow
          as="time"
          dateTime={article.date}
          className="md:hidden"
          decorate
        >
          {formatDate(article.date)}
        </Card.Eyebrow>
        <Card.Description>{article.description}</Card.Description>
        <Card.Cta>Read article</Card.Cta>
      </Card>
      <Card.Eyebrow
        as="time"
        dateTime={article.date}
        className="mt-1 hidden md:block"
      >
        {formatDate(article.date)}
      </Card.Eyebrow>
    </article>
  )
}

function ArticleAuthors({ authors }: { authors: ArticleWithSlug['authors'] }) {
  return authors.length === 1 ? (
    <div className="flex items-center gap-2">
      <Avatar
        src={authors[0].src}
        initials={authors[0].name[0]}
        alt={authors[0].name}
        className="size-6 rounded-full ring-2 ring-white dark:ring-zinc-900"
      />
      <span className="text-zinc-600 dark:text-zinc-400">
        {authors[0].name}
      </span>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-1 overflow-hidden">
        {authors.map((author) => (
          <Avatar
            key={author.name}
            src={author.src}
            initials={author.name[0]}
            alt={author.name}
            className="size-6 rounded-full ring-2 ring-white dark:ring-zinc-900"
          />
        ))}
      </div>
      <span className="hidden text-sm text-zinc-600 lg:block dark:text-zinc-400">
        Multiple authors
      </span>
    </div>
  )
}

export function FeaturedArticle({ article }: { article: ArticleWithSlug }) {
  return (
    <article className="grid w-full">
      <Card className="grid w-full grid-cols-1 gap-x-8 lg:grid-cols-2">
        <div className="relative">
          <Image
            priority
            src={article.image}
            height={560}
            width={1000}
            alt=""
            className=""
          />
        </div>
        <div className="flex h-full flex-col gap-4 py-2">
          <Tag
            color="zinc"
            className="order-first w-max font-sans capitalize lg:order-none"
          >
            {article.tags[0]}
          </Tag>
          <Card.Title href={`/blog/${article.slug}`}>
            {article.title}
          </Card.Title>
          <Card.Description className="line-clamp-3 lg:line-clamp-4 xl:line-clamp-5">
            {article.description}
          </Card.Description>
          <div className="mt-auto flex justify-between">
            <ArticleAuthors authors={article.authors} />
            <time
              dateTime={article.date}
              className="text-sm text-zinc-600 dark:text-zinc-400"
            >
              {formatDate(article.date)}
            </time>
          </div>
        </div>
      </Card>
    </article>
  )
}
