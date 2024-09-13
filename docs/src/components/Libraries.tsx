import { Button } from "@/components/Button";
import { Heading } from "@/components/Heading";
import {
  AstroIcon,
  ExpressIcon,
  FastifyIcon,
  H3Icon,
  JavaScriptIcon,
  NextJsIcon,
  NuxtIcon,
  ReactIcon,
  SolidJsIcon,
  SolidStartIcon,
  SvelteIcon,
  VueIcon,
  WinterCGIcon,
} from "@/components/icons";

import { Prose } from "./Prose";

const frameworks = [
  {
    href: "/getting-started/appdir",
    name: "Next.js App Router",
    description:
      "The Next.js App Router introduces a new model for building applications using React's latest features.",
    Logo: NextJsIcon,
  },
  {
    href: "/getting-started/pagedir",
    name: "Next.js Pages Router",
    description:
      "Before Next.js 13, the Pages Router was the main way to create routes in Next.js.",
    Logo: NextJsIcon,
  },
  {
    href: "/getting-started/astro",
    name: "Astro",
    description: "The web framework for content-driven websites.",
    Logo: AstroIcon,
  },
  {
    href: "/getting-started/solid",
    name: "Solid Start",
    description: "SolidJS is a modern JavaScript framework for today's web.",
    Logo: SolidStartIcon,
  },
  {
    href: "/getting-started/svelte",
    name: "SvelteKit",
    description: "Web development, streamlined",
    Logo: SvelteIcon,
  },
  {
    href: "/getting-started/nuxt",
    name: "Nuxt",
    description: "The Intuitive Vue Framework",
    Logo: NuxtIcon,
  },
];

const backends = [
  {
    href: "/backend-adapters/express",
    name: "Express",
    description: "Fast, unopinionated, minimalist web framework for Node.js",
    Logo: ExpressIcon,
  },
  {
    href: "/backend-adapters/fastify",
    name: "Fastify",
    description: "Fast and low overhead web framework, for Node.js",
    Logo: FastifyIcon,
  },
  {
    href: "/backend-adapters/h3",
    name: "H3",
    description: "The Web Framework for Modern JavaScript Era",
    Logo: H3Icon,
  },
  {
    href: "/backend-adapters/fetch",
    name: "WinterCG / Fetch API",
    description:
      "UploadThing's core builds on web standards, making it easy to integrate into any web framework following the WinterCG spec.",
    Logo: WinterCGIcon,
  },
];

const frontends = [
  {
    href: "/api-reference/react",
    name: "React",
    description: "The library for web and native user interfaces",
    Logo: ReactIcon,
  },
  {
    href: "https://github.com/pingdotgg/uploadthing/tree/main/examples/backend-adapters/client-vue",
    name: "Vue",
    description: "The Progressive JavaScript Framework",
    Logo: VueIcon,
  },
  {
    href: "/getting-started/solid#creating-the-upload-thing-components",
    name: "SolidJS",
    description: "Reactive Javascript Library",
    Logo: SolidJsIcon,
  },
  {
    href: "/getting-started/svelte#creating-the-upload-thing-helpers",
    name: "Svelte",
    description: "Cybernetically enhanced web apps",
    Logo: SvelteIcon,
  },
  {
    href: "/api-reference/client",
    name: "Vanilla JS",
    description:
      "Is your favorite library missing? We've got you covered. No framework required.",
    Logo: JavaScriptIcon,
  },
];

export function Frameworks() {
  return (
    <div className="my-16 xl:max-w-none">
      <Heading level={2} id="frameworks">
        Frameworks
      </Heading>
      <Prose as="p">
        Using a fullstack framework makes integrating UploadThing a breeze. No
        matter what framework you use, there's a good change we have a first
        party adapter for it.
      </Prose>
      <div className="not-prose mt-4 grid grid-cols-1 gap-x-6 gap-y-10 border-t border-zinc-900/5 pt-10 sm:grid-cols-2 xl:max-w-none xl:grid-cols-3 dark:border-white/5">
        {frameworks.map((fw) => (
          <div key={fw.name} className="flex gap-6">
            <fw.Logo className="size-12" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                {fw.name}
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {fw.description}
              </p>
              <p className="mt-4">
                <Button href={fw.href} variant="text" arrow="right">
                  Read more
                </Button>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BackendAdapters() {
  return (
    <div className="my-16 xl:max-w-none">
      <Heading level={2} id="backend-adapters">
        Backend Adapters
      </Heading>
      <Prose as="p">
        Not using a framework? We also have adapters for common backend
        libraries.
      </Prose>
      <div className="not-prose mt-4 grid grid-cols-1 gap-x-6 gap-y-10 border-t border-zinc-900/5 pt-10 sm:grid-cols-2 xl:max-w-none xl:grid-cols-2 dark:border-white/5">
        {backends.map((library) => (
          <div key={library.name} className="flex gap-6">
            <library.Logo className="size-12" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                {library.name}
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {library.description}
              </p>
              <p className="mt-4">
                <Button href={library.href} variant="text" arrow="right">
                  Read more
                </Button>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FrontendLibraries() {
  return (
    <div className="my-16 xl:max-w-none">
      <Heading level={2} id="frontend-libraries">
        Frontend Libraries
      </Heading>
      <Prose as="p">
        Pair up your backend adapter with one of the frontend libraries
        depending on your framework of choice.
      </Prose>
      <div className="not-prose mt-4 grid grid-cols-1 gap-x-6 gap-y-10 border-t border-zinc-900/5 pt-10 sm:grid-cols-2 xl:max-w-none xl:grid-cols-3 dark:border-white/5">
        {frontends.map((library) => (
          <div key={library.name} className="flex gap-6">
            <library.Logo className="size-12" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                {library.name}
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {library.description}
              </p>
              <p className="mt-4">
                <Button href={library.href} variant="text" arrow="right">
                  Read more
                </Button>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
