import glob from 'fast-glob'
import { Metadata } from 'next'
import { type Section } from '@/components/SectionProvider'

import { Layout } from './client-layout'

export const metadata: Metadata = {
  metadataBase: new URL('https://uploadthing-docs-twui.vercel.app'),
  title: {
    template: '%s - UploadThing Docs',
    default: 'UploadThing Docs',
  },
}

export default async function DocsLayout(
  props: Readonly<{
    children: React.ReactNode
  }>,
) {
  let pages = await glob('**/*.mdx', { cwd: 'src/app/(docs)' })
  let allSectionsEntries = (await Promise.all(
    pages.map(async (filename) => [
      '/' + filename.replace(/(^|\/)page\.mdx$/, ''),
      (await import(`./${filename}`)).sections,
    ]),
  )) as Array<[string, Array<Section>]>
  let allSections = Object.fromEntries(allSectionsEntries)

  return (
    <div className="w-full">
      <Layout allSections={allSections}>{props.children}</Layout>
    </div>
  )
}
