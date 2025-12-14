import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { createIsomorphicFn } from "@tanstack/react-start";

import { setupRouterSsrUploadThingIntegration } from "@uploadthing/react/tanstack-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

import { routeTree } from "./routeTree.gen";
import { uploadRouter } from "./server/uploadthing";

const getUploadThingRouterConfig = createIsomorphicFn().server(() => {
  return extractRouterConfig(uploadRouter);
});

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
  });

  setupRouterSsrUploadThingIntegration(router, getUploadThingRouterConfig);

  return router;
}
