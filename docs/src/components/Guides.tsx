import { Button } from '@/components/Button'
import { Heading } from '@/components/Heading'

const guides = [
  {
    href: '/getting-started/appdir',
    name: 'Next.js App Router',
    description: 'Learn how to use UploadThing with Next.js App Router.',
  },
  {
    href: '/getting-started/pagedir',
    name: 'Next.js Pages Router',
    description: 'Learn how to use UploadThing with Next.js Pages Router.',
  },
  {
    href: '/getting-started/solid',
    name: 'Solid Start',
    description: 'Learn how to use UploadThing with Solid Start.',
  },
  {
    href: '/getting-started/astro',
    name: 'Astro',
    description: 'Learn how to use UploadThing with Astro.',
  },
  {
    href: '/getting-started/svelte',
    name: 'SvelteKit',
    description: 'Learn how to use UploadThing with Svelte and SvelteKit.',
  },
  {
    href: '/getting-started/nuxt',
    name: 'Nuxt',
    description: 'Learn how to use UploadThing with Vue and Nuxt.',
  },
  {
    href: '/backend-adapters',
    name: 'Backend Apadters',
    description: 'Learn how to use UploadThing with a separate backend.',
  },
]

export function Guides() {
  return (
    <div className="my-16 xl:max-w-none">
      <Heading level={2} id="guides">
        Guides
      </Heading>
      <div className="not-prose mt-4 grid grid-cols-1 gap-8 border-t border-zinc-900/5 pt-10 sm:grid-cols-2 xl:grid-cols-4 dark:border-white/5">
        {guides.map((guide) => (
          <div key={guide.href}>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {guide.name}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {guide.description}
            </p>
            <p className="mt-4">
              <Button href={guide.href} variant="text" arrow="right">
                Read more
              </Button>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
