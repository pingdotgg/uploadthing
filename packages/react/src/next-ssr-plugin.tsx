"use client";

import { useId, useRef } from "react";
import { useServerInsertedHTML } from "next/navigation";

import type { EndpointMetadata } from "@uploadthing/shared";

declare const globalThis: {
  __UPLOADTHING?: EndpointMetadata;
};

export function NextSSRPlugin(props: {
  routerConfig: EndpointMetadata;
  nonce?: string;
}) {
  const id = useId();
  const isInserted = useRef(false);

  // Set routerConfig on server globalThis
  globalThis.__UPLOADTHING = props.routerConfig;

  useServerInsertedHTML(() => {
    if (isInserted.current) return;
    isInserted.current = true;

    const html = [
      // Hydrate routerConfig on client globalThis
      `globalThis.__UPLOADTHING = ${JSON.stringify(props.routerConfig)};`,
    ];

    return (
      <script
        key={id}
        nonce={props.nonce}
        dangerouslySetInnerHTML={{ __html: html.join("") }}
      />
    );
  });

  return null;
}
