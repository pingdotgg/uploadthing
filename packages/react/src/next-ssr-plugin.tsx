import { useId } from "react";
import { useServerInsertedHTML } from "next/navigation";

import type { ExpandedRouteConfig } from "@uploadthing/shared";

import type { EndpointMetadata } from "./types";

declare const globalThis: {
  __UPLOADTHING?: EndpointMetadata;
};

export function NextSSRPlugin(props: {
  routerConfig: {
    slug: string;
    config: ExpandedRouteConfig;
  }[];
}) {
  const id = useId();

  // Set routerConfig on server globalThis
  globalThis.__UPLOADTHING ??= props.routerConfig;

  useServerInsertedHTML(() => {
    const html = [
      // Hydrate routerConfig on client globalThis
      `globalThis.__UPLOADTHING ??= ${JSON.stringify(props.routerConfig)};`,
    ];

    return (
      <script key={id} dangerouslySetInnerHTML={{ __html: html.join("") }} />
    );
  });

  return null;
}
