import { Layout } from "fumadocs-ui/layout";
import Link from "next/link";

import { siteConfig } from "~/app/source";
import { buttonVariants } from "~/components/button";

export default function IndexPage() {
  return (
    <Layout
      nav={{
        title: siteConfig.name,
        githubUrl: siteConfig.links.github,
      }}
      links={[{ text: "Docs", url: siteConfig.links.docs }]}
    >
      <section className="container flex flex-col justify-center items-center gap-6 pb-8 pt-6 md:py-10">
        <div className="max-w-5xl space-y-8">
          <h1
            className="font-cal text-balance animate-fade-up bg-gradient-to-br from-foreground/80 to-muted-foreground bg-clip-text text-center text-5xl/[3rem] font-bold text-transparent opacity-0 drop-shadow-sm md:text-7xl/[5rem]"
            style={{ animationDelay: "0.20s", animationFillMode: "forwards" }}
          >
            {siteConfig.name}
          </h1>
          <p
            className="animate-fade-up text-balance text-center text-muted-foreground/80 opacity-0 md:text-xl"
            style={{ animationDelay: "0.30s", animationFillMode: "forwards" }}
          >
            {siteConfig.description}
          </p>
          <div
            className="flex justify-center gap-4 animate-fade-up opacity-0"
            style={{ animationDelay: "0.40s", animationFillMode: "forwards" }}
          >
            <Link className={buttonVariants({})} href={siteConfig.links.docs}>
              Documentation
            </Link>
            <Link
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({})}
              href={siteConfig.links.github}
            >
              GitHub
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
