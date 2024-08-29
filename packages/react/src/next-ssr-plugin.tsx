"use client";

import { useId } from "react";
import { useServerInsertedHTML } from "next/navigation";

import { safeNumberReplacer } from "@uploadthing/shared";
import type { EndpointMetadata } from "@uploadthing/shared";

declare const globalThis: {
  __UPLOADTHING?: EndpointMetadata;
};

export function NextSSRPlugin(props: { routerConfig: EndpointMetadata }) {
  const id = useId();

  // Set routerConfig on server globalThis
  globalThis.__UPLOADTHING = props.routerConfig;

  useServerInsertedHTML(() => {
    const html = [
      // Hydrate routerConfig on client globalThis
      `globalThis.__UPLOADTHING = ${JSON.stringify(props.routerConfig, safeNumberReplacer)};`,
    ];

    return (
      <script key={id} dangerouslySetInnerHTML={{ __html: html.join("") }} />
    );
  });

  return null;
}
