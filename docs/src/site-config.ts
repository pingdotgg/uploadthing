export interface NavGroup {
  title: string;
  links: Array<{
    title: string;
    href: string;
  }>;
}

export const socials = {
  discord: "https://discord.gg/UCXkw6xj2K",
  github: "https://github.com/pingdotgg/uploadthing",
  x: "https://x.com/pingdotgg",
};

export const navigation: Array<NavGroup> = [
  {
    title: "Introduction",
    links: [
      { title: "Introduction", href: "/" },
      { title: "File Routes", href: "/file-routes" },
      { title: "Uploading Files", href: "/uploading-files" },
      { title: "Working with Files", href: "/working-with-files" },
    ],
  },
  {
    title: "Getting Started",
    links: [
      { title: "Astro (with React)", href: "/getting-started/astro" },
      { title: "Expo", href: "/getting-started/expo" },
      { title: "Next.js App Router", href: "/getting-started/appdir" },
      { title: "Next.js Pages Router", href: "/getting-started/pagedir" },
      { title: "Remix", href: "/getting-started/remix" },
      { title: "SolidStart", href: "/getting-started/solid" },
      { title: "SvelteKit", href: "/getting-started/svelte" },
      { title: "Vue with Nuxt", href: "/getting-started/nuxt" },
    ],
  },
  {
    title: "Backend Adapters",
    links: [
      { title: "Express", href: "/backend-adapters/express" },
      { title: "Fastify", href: "/backend-adapters/fastify" },
      { title: "H3", href: "/backend-adapters/h3" },
      { title: "WinterCG Fetch", href: "/backend-adapters/fetch" },
    ],
  },
  {
    title: "Guides",
    links: [
      {
        title: "Authentication & Security",
        href: "/concepts/auth-security",
      },
      {
        title: "Error Handling",
        href: "/concepts/error-handling",
      },
      {
        title: "Regions and ACLs",
        href: "/concepts/regions-acl",
      },
      {
        title: "Theming",
        href: "/concepts/theming",
      },
    ],
  },
  {
    title: "API Reference",
    links: [
      { title: "uploadthing/client", href: "/api-reference/client" },
      { title: "uploadthing/server", href: "/api-reference/server" },
      { title: "@uploadthing/react", href: "/api-reference/react" },
      { title: "@uploadthing/expo", href: "/api-reference/expo" },
      { title: "@uploadthing/solid", href: "/api-reference/solid" },
      { title: "@uploadthing/svelte", href: "/api-reference/svelte" },
      { title: "@uploadthing/vue", href: "/api-reference/vue" },
      { title: "REST API", href: "/api-reference/openapi-spec" },
      { title: "UTApi", href: "/api-reference/ut-api" },
    ],
  },
  {
    title: "Migration Guides",
    links: [{ title: "Migrate from v6 to v7", href: "/v7" }],
  },
  {
    title: "Resources",
    links: [
      { title: "Frequently Asked Questions", href: "/faq" },
      {
        title: "Roadmap",
        href: "https://t3-tools.notion.site/776334c06d814dd08d450975bb983085?v=a04ee69d18a047859717b279df504a6b",
      },
    ],
  },
];
