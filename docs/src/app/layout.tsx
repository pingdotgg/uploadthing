import { type Metadata } from 'next'

import { Providers } from '@/app/providers'
import { ViewTransitions } from 'next-view-transitions'

import '@/styles/tailwind.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://uploadthing-docs-twui.vercel.app'),
  title: {
    template: '%s - UploadThing Docs',
    default: 'UploadThing Docs',
  },
}

export default function RootLayout(
  props: Readonly<{
    children: React.ReactNode
  }>,
) {
  return (
    <ViewTransitions>
      <html lang="en" className="h-full" suppressHydrationWarning>
        <body className="flex min-h-full bg-white antialiased dark:bg-zinc-900">
          <Providers>{props.children}</Providers>
        </body>
      </html>
    </ViewTransitions>
  )
}
