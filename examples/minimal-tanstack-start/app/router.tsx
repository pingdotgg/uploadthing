import {
  AnyRouter,
  createRouter as createTanStackRouter,
} from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

/**
 * This wrapper could potentially be exported from `@uploadthing/react` similar to NextSSRPlugin
 */
function routerWithUploadThing<TRouter extends AnyRouter>(router: TRouter) {
  if (router.isServer) {
    // On the server, stream the router config over the wire to the client
    // globalThis.__UPLOADTHING is set in `ssr.tsx` to ensure we don't
    // leak the entire router code to the client
    router.streamValue("__UPLOADTHING", globalThis.__UPLOADTHING);
  } else {
    // On the client, inject the streamed value into globalThis
    // useUploadThing will pick this up and skip a client side fetch
    globalThis.__UPLOADTHING = router.getStreamedValue("__UPLOADTHING");
  }

  return router;
}

export function createRouter() {
  const router = createTanStackRouter({
    routeTree,
  });

  return routerWithUploadThing(router);
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
