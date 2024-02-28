import { RollButton } from "fumadocs-ui/components/roll-button";
import { DocsBody, DocsPage } from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, getPages } from "~/app/source";

interface PageParams {
  params: { slug?: string[] };
}

export default async function Page({ params }: PageParams) {
  const page = getPage(params.slug);
  if (page == null) notFound();

  const MDX = page.data.exports.default;

  return (
    <DocsPage toc={page.data.exports.toc}>
      <RollButton />
      <DocsBody>
        <h1 className="font-cal">{page.data.title}</h1>
        <MDX />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return getPages().map((page) => ({
    slug: page.slugs,
  }));
}

export function generateMetadata({ params }: PageParams) {
  const page = getPage(params.slug);

  if (page == null) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  } satisfies Metadata;
}
