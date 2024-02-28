import { join, resolve } from "path";
import { AutoTypeTable } from "fumadocs-ui/components/auto-type-table";
import { Heading } from "fumadocs-ui/components/heading";
import defaultComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { twMerge } from "tailwind-merge";

export type * from "../packages/react/src/types";
export type * from "../packages/react/src/components/button";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...defaultComponents,
    ...components,
    AutoTypeTable: (props: { path: string; name: string; pkg: string }) => {
      /**
       * @todo fix so we can seamlessly reference types from other packages without having to import in this file...
       */
      return <AutoTypeTable path={props.path} name={props.name} />;
    },
    h1: (props) => (
      <Heading
        as="h1"
        {...props}
        className={twMerge(props.className, "font-cal")}
      />
    ),
    h2: (props) => (
      <Heading
        as="h2"
        {...props}
        className={twMerge(props.className, "font-cal")}
      />
    ),
    h3: (props) => (
      <Heading
        as="h3"
        {...props}
        className={twMerge(props.className, "font-cal")}
      />
    ),
    h4: (props) => (
      <Heading
        as="h4"
        {...props}
        className={twMerge(props.className, "font-cal")}
      />
    ),
    h5: (props) => (
      <Heading
        as="h5"
        {...props}
        className={twMerge(props.className, "font-cal")}
      />
    ),
    h6: (props) => (
      <Heading
        as="h6"
        {...props}
        className={twMerge(props.className, "font-cal")}
      />
    ),
  };
}
