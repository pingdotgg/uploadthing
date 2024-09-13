"use client";

import { useContext } from "react";
import { usePathname } from "next/navigation";
import { AppContext } from "@/app/providers";
import { Avatar } from "@/components/Avatar";
import { Container } from "@/components/Container";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroPattern } from "@/components/HeroPattern";
import { LogoBlob, LogoText } from "@/components/Logo";
import { NavLink, VisibleSectionHighlight } from "@/components/Navigation";
import { Prose } from "@/components/Prose";
import {
  Section,
  SectionProvider,
  useSectionStore,
} from "@/components/SectionProvider";
import { type ArticleWithSlug } from "@/lib/articles";
import { formatDate } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Link, useTransitionRouter } from "next-view-transitions";

function ArrowLeftIcon(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7.25 11.25 3.75 8m0 0 3.5-3.25M3.75 8h8.5"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArticlesLayout({
  children,
  allSections,
}: {
  children: React.ReactNode;
  allSections: Record<string, Array<Section>>;
}) {
  let pathname = usePathname();
  const articleSlug = pathname.replace(/^\/blog/, "");

  let { scrollY } = useScroll();
  let bgOpacityLight = useTransform(scrollY, [0, 72], [0.5, 0.9]);
  let bgOpacityDark = useTransform(scrollY, [0, 72], [0.2, 0.9]);

  return (
    <SectionProvider sections={allSections[articleSlug] ?? []}>
      <div className="h-full w-full">
        <div className="fixed z-50 contents h-14 lg:pointer-events-auto lg:block lg:overflow-y-auto">
          <motion.div
            className="hidden h-full items-center border-b border-zinc-900/10 bg-white/[--bg-opacity-light] backdrop-blur-sm transition lg:flex lg:w-72 lg:px-6 xl:w-80 dark:border-white/10 dark:bg-zinc-900/[--bg-opacity-dark] dark:backdrop-blur"
            style={
              {
                "--bg-opacity-light": bgOpacityLight,
                "--bg-opacity-dark": bgOpacityDark,
              } as React.CSSProperties
            }
          >
            <Link
              href="/"
              aria-label="Home"
              className="flex items-center gap-1"
            >
              <LogoBlob className="h-6" />
              <LogoText className="h-6" />
            </Link>
          </motion.div>
          <Header />
        </div>
        <div className="relative flex h-full flex-col px-4 pt-14 sm:px-6 lg:px-8">
          <HeroPattern />
          <main className="mb-16 flex-auto">{children}</main>
          <Footer />
        </div>
      </div>
    </SectionProvider>
  );
}

export function ArticleLayout({
  article,
  children,
}: {
  article: ArticleWithSlug;
  children: React.ReactNode;
}) {
  let pathname = usePathname();
  let router = useTransitionRouter();
  let { previousPathname } = useContext(AppContext);

  const sections = useSectionStore((s) => s.sections);

  return (
    <Container className="mt-16 lg:mt-32">
      <div className="">
        <div className="relative mx-auto flex w-full gap-x-8 divide-x">
          <article className="w-full lg:w-3/4 xl:w-2/3">
            <header className="flex flex-col">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => router.push(previousPathname ?? "/blog")}
                  aria-label="Go back to articles"
                  className="group flex size-8 items-center justify-center rounded-full bg-white shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 transition dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0 dark:ring-white/10 dark:hover:border-zinc-700 dark:hover:ring-white/20"
                >
                  <ArrowLeftIcon className="h-4 w-4 stroke-zinc-500 transition group-hover:stroke-zinc-700 dark:stroke-zinc-500 dark:group-hover:stroke-zinc-400" />
                </button>
                <span className="h-4 w-0.5 rounded-full bg-zinc-400" />
                <time
                  dateTime={article.date}
                  className="flex items-center text-base text-zinc-500"
                >
                  <span>{formatDate(article.date)}</span>
                </time>
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
                {article.title}
              </h1>

              <div className="flex flex-col gap-4 lg:hidden">
                <ul className="mt-8 flex flex-wrap gap-4">
                  {article.authors.map((author) => (
                    <li
                      className="flex items-stretch gap-2"
                      key={JSON.stringify(author)}
                    >
                      <Avatar
                        src={author.src}
                        alt={author.name}
                        className="size-8"
                      />
                      <div className="flex flex-col gap-1">
                        <a className="text-sm/4" href={author.href}>
                          {author.name}
                        </a>
                        <p className="text-sm/4 text-zinc-500 dark:text-zinc-500">
                          {author.role}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </header>
            <Prose className="mt-8" data-mdx-content>
              {children}
            </Prose>
          </article>
          <aside className="top-24 hidden h-full w-1/4 flex-col border-zinc-900/5 pl-8 lg:sticky lg:flex xl:w-1/3 dark:border-white/5">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                Posted by
              </p>
              {article.authors.map((author) => (
                <div
                  className="flex items-stretch gap-2"
                  key={JSON.stringify(author)}
                >
                  <Avatar
                    src={author.src}
                    alt={author.name}
                    className="size-8"
                  />
                  <div className="flex flex-col gap-1">
                    <a className="text-sm/4" href={author.href}>
                      {author.name}
                    </a>
                    <p className="text-sm/4 text-zinc-500 dark:text-zinc-500">
                      {author.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {sections.length > 0 && (
              <div className="mt-8 flex flex-col">
                <p className="text-sm text-zinc-500 dark:text-zinc-500">
                  Contents
                </p>
                <div className="relative mt-1.5">
                  <AnimatePresence initial={true}>
                    <VisibleSectionHighlight
                      noHeading
                      group={{
                        links: [{ href: pathname, title: "Sections" }],
                        title: "",
                      }}
                      pathname={pathname}
                    />
                  </AnimatePresence>
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.ul
                      role="list"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: 1,
                        transition: { delay: 0.1 },
                      }}
                      exit={{
                        opacity: 0,
                        transition: { duration: 0.15 },
                      }}
                    >
                      {sections.map((section) => (
                        <li key={section.id} className="relative">
                          <NavLink
                            href={`#${section.id}`}
                            tag={section.tag}
                            isAnchorLink
                          >
                            {section.title}
                          </NavLink>
                        </li>
                      ))}
                    </motion.ul>
                  </AnimatePresence>{" "}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </Container>
  );
}
