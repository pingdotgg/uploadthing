'use client'

import { Link } from 'next-view-transitions'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { LogoBlob, LogoText } from '@/components/Logo'
import { Navigation } from '@/components/Navigation'
import { type Section, SectionProvider } from '@/components/SectionProvider'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { useEffect, useState } from 'react'

const PreviewBanner = (props: {
  open: boolean
  setOpen: (open: boolean) => void
}) => {
  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 top-14 sm:top-16 sm:px-6 sm:pb-5 lg:left-80 lg:px-8"
      animate={{ opacity: props.open ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      initial={{ opacity: 0 }}
    >
      <div className="pointer-events-auto flex items-center justify-between gap-x-6 bg-gradient-to-r from-[#f36b6b] to-[#b85757] px-6 py-2.5 sm:rounded-xl sm:py-3 sm:pl-4 sm:pr-3.5 dark:from-[#8f4545] dark:to-[#4e2525]">
        <p className="text-sm leading-6 text-zinc-900 dark:text-zinc-50">
          <a
            href="https://docs.uploadthing.com"
            target="_blank"
            rel="noreferrer"
          >
            <strong className="font-semibold">Preview Docs</strong>
            <svg
              viewBox="0 0 2 2"
              aria-hidden="true"
              className="mx-2 inline size-0.5 fill-current"
            >
              <circle r={1} cx={1} cy={1} />
            </svg>
            You're looking at preview documentation for an upcoming version of
            UploadThing. Go to current documentation{' '}
            <span aria-hidden="true">&rarr;</span>
          </a>
        </p>
        <button
          type="button"
          onClick={() => props.setOpen(false)}
          className="-m-3 flex-none p-3 focus-visible:outline-offset-[-4px]"
        >
          <span className="sr-only">Dismiss</span>
          <XMarkIcon
            aria-hidden="true"
            className="size-5 text-zinc-900 dark:text-zinc-50"
          />
        </button>
      </div>
    </motion.div>
  )
}

export function Layout({
  children,
  allSections,
}: {
  children: React.ReactNode
  allSections: Record<string, Array<Section>>
}) {
  let pathname = usePathname()
  const [bannerOpen, setBannerOpen] = useState(false)
  useEffect(() => {
    setTimeout(() => {
      setBannerOpen(true)
    }, 1000)
  }, [])

  return (
    <SectionProvider sections={allSections[pathname] ?? []}>
      <div className="h-full lg:ml-72 xl:ml-80">
        <motion.header
          layoutScroll
          className="contents lg:pointer-events-none lg:fixed lg:inset-0 lg:z-40 lg:flex"
        >
          <div className="contents lg:pointer-events-auto lg:block lg:w-72 lg:overflow-y-auto lg:border-r lg:border-zinc-900/10 lg:px-6 lg:pb-8 lg:pt-4 xl:w-80 lg:dark:border-white/10">
            <div className="hidden lg:flex">
              <Link
                href="/"
                aria-label="Home"
                className="flex items-center gap-1"
              >
                <LogoBlob className="h-6" />
                <LogoText className="h-6" />
              </Link>
            </div>
            <Header />
            <Navigation className="hidden lg:mt-10 lg:block" />
          </div>
        </motion.header>

        <div className="relative flex h-full flex-col px-4 pt-14 sm:px-6 lg:px-8">
          <PreviewBanner open={bannerOpen} setOpen={setBannerOpen} />
          <div className="h-24 w-full sm:h-8" />
          <main className="flex-auto">{children}</main>
          <Footer />
        </div>
      </div>
    </SectionProvider>
  )
}
