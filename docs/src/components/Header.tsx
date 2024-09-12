import { forwardRef } from 'react'
import { Link } from 'next-view-transitions'
import clsx from 'clsx'
import { motion, MotionValue, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/Button'
import { LogoBlob, LogoText } from '@/components/Logo'
import {
  MobileNavigation,
  useIsInsideMobileNavigation,
} from '@/components/MobileNavigation'
import { useMobileNavigationStore } from '@/components/MobileNavigation'
import { MobileSearch, Search } from '@/components/Search'
import { ThemeToggle } from '@/components/ThemeToggle'
import { socials } from '@/site-config'

function TopLevelNavItem({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <li>
      <Link
        href={href}
        {...(href.startsWith('http')
          ? { target: '_blank', rel: 'noopener' }
          : {})}
        className="text-sm leading-5 text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
      >
        {children}
      </Link>
    </li>
  )
}

export const Header = forwardRef<
  React.ElementRef<'div'>,
  {
    className?: string
  }
>(function Header({ className }, ref) {
  let { isOpen: mobileNavIsOpen } = useMobileNavigationStore()
  let isInsideMobileNavigation = useIsInsideMobileNavigation()

  let { scrollY } = useScroll()
  let bgOpacityLight = useTransform(scrollY, [0, 72], [0.5, 0.9])
  let bgOpacityDark = useTransform(scrollY, [0, 72], [0.2, 0.8])

  return (
    <motion.div
      ref={ref}
      className={clsx(
        className,
        'fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-8 border-b border-zinc-900/10 px-4 transition sm:px-6 md:gap-12 lg:left-72 lg:z-30 lg:px-8 xl:left-80 dark:border-white/10',
        !isInsideMobileNavigation &&
          'backdrop-blur-sm lg:left-72 xl:left-80 dark:backdrop-blur',
        isInsideMobileNavigation
          ? 'bg-white dark:bg-zinc-900'
          : 'bg-white/[var(--bg-opacity-light)] dark:bg-zinc-900/[var(--bg-opacity-dark)]',
      )}
      style={
        {
          '--bg-opacity-light': bgOpacityLight,
          '--bg-opacity-dark': bgOpacityDark,
        } as React.CSSProperties
      }
    >
      <Search />
      <div className="flex items-center gap-5 lg:hidden">
        <MobileNavigation />
        <Link href="/" aria-label="Home" className="flex items-center gap-1">
          {/* <Logo className="h-6" /> */}
          <LogoBlob className="size-6" />
          <LogoText className="h-6" />
        </Link>
      </div>
      <div className="flex items-center gap-5">
        <nav className="hidden md:block">
          <ul role="list" className="flex items-center gap-8">
            <TopLevelNavItem href="/">Documentation</TopLevelNavItem>
            <TopLevelNavItem href="/blog">Blog</TopLevelNavItem>
            <TopLevelNavItem href={socials.discord}>Support</TopLevelNavItem>
          </ul>
        </nav>
        <div className="hidden md:block md:h-5 md:w-px md:bg-zinc-900/10 md:dark:bg-white/15" />
        <div className="flex gap-4">
          <MobileSearch />
          <ThemeToggle />
        </div>
        <div className="hidden min-[450px]:contents">
          <Button href="https://uploadthing.com/dashboard">Dashboard</Button>
        </div>
      </div>
    </motion.div>
  )
})
