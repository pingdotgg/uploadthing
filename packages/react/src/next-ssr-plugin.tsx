import Script from 'next/script'

import type { EndpointMetadata } from "./types";

declare const globalThis: {
  __UPLOADTHING?: EndpointMetadata;
};

export function NextSSRPlugin(props: { routerConfig: EndpointMetadata }) {
  const id = 'UPLOADTHING_CONFIG';

  // Set routerConfig on server globalThis
  globalThis.__UPLOADTHING ??= props.routerConfig;

  return (
    <Script
      strategy="beforeInteractive"
      id={id}
    >
      {`globalThis.__UPLOADTHING ??= ${JSON.stringify(props.routerConfig)};`}
    </Script>
  );
}
