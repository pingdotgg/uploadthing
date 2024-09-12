import { blogParams, docsParams } from '@/app/(api)/api/og/utils'
import { Metadata } from 'next'
import { Article } from './articles'

interface Meta {
  title: string
  category: string
  description: string
  date: string
}

export const docsMetadata = (meta: Meta): Metadata => {
  const ogImage =
    '/api/og/docs?' +
    docsParams.toSearchString({
      title: meta.title,
      category: meta.category,
      description: meta.description,
    })

  return {
    ...meta,
    openGraph: {
      images: [{ url: ogImage, width: 1200, height: 600 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [{ url: ogImage, width: 1200, height: 600 }],
    },
  }
}

export const blogMetadata = (article: Article): Metadata => {
  const ogImage =
    article.image ??
    '/api/og/blog?' +
      blogParams.toSearchString({
        title: article.title,
        authors: article.authors,
      })

  return {
    title: `${article.title} | UploadThing`,
    description: article.description,
    openGraph: {
      title: `${article.title} | UploadThing`,
      description: article.description,
      type: 'article',
      images: [{ url: ogImage, width: 1200, height: 600 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${article.title} | UploadThing`,
      description: article.description,
      site: '@pingdotgg',
      creator: '@pingdotgg',
      images: [{ url: ogImage, width: 1200, height: 600 }],
    },
  }
}

export function formatDate(dateString: string) {
  return new Date(`${dateString}T00:00:00Z`).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
