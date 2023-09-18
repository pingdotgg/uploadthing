import Script from "next/script";

import type { FileRouter } from "uploadthing/server";
import { extractRouterConfig } from "uploadthing/server";

import type { EndpointMetadata } from "./types";

declare const globalThis: {
  __UPLOADTHING?: EndpointMetadata;
};

export function NextSSRPlugin(props: { fileRouter: FileRouter }) {
  const id = "UPLOADTHING_CONFIG";
  const routerConfig = extractRouterConfig(props.fileRouter);

  // Set routerConfig on server globalThis
  globalThis.__UPLOADTHING ??= routerConfig;

  return (
    <Script strategy="beforeInteractive" id={id}>
      {`globalThis.__UPLOADTHING ??= ${JSON.stringify(routerConfig)};`}
    </Script>
  );
}
