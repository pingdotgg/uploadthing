/**
 * Potentially put this in the @uploadthing/react package
 *
 * Add SSR hydration to avoid loading states.
 *
 * ### Example
 *
 * ```tsx
 * const getUploadThingRouterConfig = createIsomorphicFn().server(() => {
 *   return extractRouterConfig(ourFileRouter);
 * });
 *
 * export function getRouter() {
 *   const router = createRouter({ ... });
 *   setupRouterSsrUploadThingIntegration(router, getUploadThingRouterConfig);
 *   return router;
 * }
 * ```
 *
 * @module
 */
import type { AnyRouter } from "@tanstack/react-router";
import type { ServerOnlyFn } from "@tanstack/react-start";

import type { EndpointMetadata } from "uploadthing/types";

declare const globalThis: {
  __UPLOADTHING?: EndpointMetadata | undefined;
};

interface DehydratedState extends Record<string, unknown> {
  uploadthingConfig?: EndpointMetadata | undefined;
}

export function setupRouterSsrUploadThingIntegration<TRouter extends AnyRouter>(
  router: TRouter,
  getUtConfig: ServerOnlyFn<[], EndpointMetadata>,
): void {
  const ogHydrate = router.options.hydrate;
  const ogDehydrate = router.options.dehydrate;

  if (router.isServer) {
    router.options.dehydrate = async () => {
      const ogDehydrated = (await ogDehydrate?.()) as DehydratedState;
      const utConfig = getUtConfig();
      globalThis.__UPLOADTHING = utConfig;
      return {
        ...ogDehydrated,
        uploadthingConfig: utConfig,
      };
    };
  } else {
    router.options.hydrate = async (dehydrated: DehydratedState) => {
      await ogHydrate?.(dehydrated);
      globalThis.__UPLOADTHING = dehydrated.uploadthingConfig;
    };
  }
}
