import { type Metadata } from 'next'

import { ArticlesPage } from './_components/articles-page'

export const metadata: Metadata = {
  title: 'Articles',
  description:
    'All of my long-form thoughts on programming, leadership, product design, and more, collected in chronological order.',
}

export default function ArticlesIndex() {
  return <ArticlesPage tag={undefined} />
}
