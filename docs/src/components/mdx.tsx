import { Link } from 'next-view-transitions'
import clsx from 'clsx'
import { Tag } from './Tag'
import {
  InformationCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/16/solid'
import { Feedback } from '@/components/Feedback'
import { Heading } from '@/components/Heading'
import { Prose } from '@/components/Prose'
import {
  Tab as TabListItem,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from '@headlessui/react'
import Image, { type ImageProps } from 'next/image'

export * from './UploadThing'

export { Button } from '@/components/Button'
export { CodeGroup, Code as code, Pre as pre } from '@/components/Code'

export function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <article className="flex h-full flex-col pb-10 pt-16">
      <Prose className="flex-auto">{children}</Prose>
      <footer className="mx-auto mt-16 w-full max-w-2xl lg:max-w-5xl">
        <Feedback />
      </footer>
    </article>
  )
}

export const a = function A({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Link> & { href: string }) {
  const isExternal = props.href.startsWith('http')

  if (isExternal) {
    return (
      <a {...props} target="_blank" rel="noopener noreferrer">
        {children} ↗
      </a>
    )
  }

  return <Link {...props}>{children}</Link>
}

export const h2 = function H2(
  props: Omit<React.ComponentPropsWithoutRef<typeof Heading>, 'level'>,
) {
  return <Heading level={2} {...props} />
}

export const h3 = function H3(
  props: Omit<React.ComponentPropsWithoutRef<typeof Heading>, 'level'>,
) {
  return <Heading level={3} {...props} />
}

type ImagePropsWithOptionalAlt = Omit<ImageProps, 'alt'> & { alt?: string }

export const img = function Img(props: ImagePropsWithOptionalAlt) {
  return (
    <div className="relative mt-8 overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-900 [&+*]:mt-8">
      <Image
        alt=""
        sizes="(min-width: 1280px) 56rem, (min-width: 1024px) 45vw, (min-width: 640px) 32rem, 95vw"
        {...props}
      />
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10 dark:ring-white/10" />
    </div>
  )
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 flex gap-2.5 rounded-2xl border border-sky-500/20 bg-sky-50/80 p-4 leading-6 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/5 dark:text-sky-200 dark:[--tw-prose-links-hover:theme(colors.red.300)] dark:[--tw-prose-links:theme(colors.white)]">
      <InformationCircleIcon className="mt-1 h-4 w-4 flex-none fill-sky-500 stroke-white dark:fill-sky-200/20 dark:stroke-sky-200" />
      <div className="[&>:first-child]:mt-0 [&>:last-child]:mb-0">
        {children}
      </div>
    </div>
  )
}

export function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 flex gap-2.5 rounded-2xl border border-red-500/20 bg-red-50/50 p-4 leading-6 text-red-900 dark:border-red-500/30 dark:bg-red-500/5 dark:text-red-200 dark:[--tw-prose-links-hover:theme(colors.red.300)] dark:[--tw-prose-links:theme(colors.white)]">
      <ExclamationCircleIcon className="mt-1 h-4 w-4 flex-none fill-red-500" />
      <div className="[&>:first-child]:mt-0 [&>:last-child]:mb-0">
        {children}
      </div>
    </div>
  )
}

export function Tabs({
  children,
  tabs,
}: {
  children: React.ReactNode
  tabs: string[]
}) {
  return (
    <TabGroup>
      <TabList className="flex gap-4">
        {tabs.map((tab) => (
          <TabListItem
            key={tab}
            className="rounded-full px-3 py-1 text-sm/6 font-semibold text-zinc-900 focus:outline-none data-[hover]:bg-zinc-200 data-[selected]:bg-zinc-300 data-[focus]:outline-1 data-[focus]:outline-white dark:text-white dark:data-[hover]:bg-white/5 dark:data-[selected]:bg-white/10 dark:data-[selected]:data-[hover]:bg-white/10"
          >
            {tab}
          </TabListItem>
        ))}
      </TabList>
      <TabPanels>{children}</TabPanels>
    </TabGroup>
  )
}
export const Tab = TabPanel

export function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 items-start gap-x-16 gap-y-10 xl:max-w-none xl:grid-cols-2">
      {children}
    </div>
  )
}

export function Col({
  children,
  sticky = false,
}: {
  children: React.ReactNode
  sticky?: boolean
}) {
  return (
    <div
      className={clsx(
        '[&>:first-child]:mt-0 [&>:last-child]:mb-0',
        sticky && 'xl:sticky xl:top-24',
      )}
    >
      {children}
    </div>
  )
}

export function Properties({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6">
      <ul
        role="list"
        className="m-0 list-none divide-y divide-zinc-900/5 p-0 dark:divide-white/5"
      >
        {children}
      </ul>
    </div>
  )
}

export async function Property({
  name,
  children,
  type,
  required,
  optional,
  deprecated,
  defaultValue,
  since,
}: {
  name: string
  children: React.ReactNode
  type?: string
  required?: boolean
  optional?: boolean
  deprecated?: boolean
  defaultValue?: string
  since?: string
}) {
  return (
    <li className="m-0 px-0 py-4 first:pt-0 last:pb-0">
      <dl className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2">
        <dt className="sr-only">Name</dt>
        <dd>
          <b>{name}</b>
        </dd>
        {type && (
          <>
            <dt className="sr-only">Type</dt>
            <code className="py-1 text-xs/4">{type}</code>
            <dd className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
              {required && (
                <Tag className="mr-3 py-1" color="red">{`Required`}</Tag>
              )}
              {optional && (
                <Tag className="mr-3 py-1" color="sky">{`Optional`}</Tag>
              )}
              {defaultValue && (
                <Tag
                  className="mr-3 py-1"
                  color="zinc"
                >{`Default: ${defaultValue}`}</Tag>
              )}
              {since && (
                <Tag className="py-1" color="amber">{`Since ${since}`}</Tag>
              )}
              {deprecated && (
                <Tag className="py-1" color="red">{`DEPRECATED`}</Tag>
              )}
            </dd>
          </>
        )}
        <dt className="sr-only">Description</dt>
        <dd className="w-full flex-none [&>:first-child]:mt-0 [&>:last-child]:mb-0">
          {children}
        </dd>
      </dl>
    </li>
  )
}
