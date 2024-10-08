/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useRuntimeConfig } from "#imports";
import { uploadRouter } from "#uploadthing-router";
import { defineEventHandler } from "h3";

import { createRouteHandler } from "uploadthing/h3";

export default defineEventHandler((event) => {
  const runtime = useRuntimeConfig() as any;

  return createRouteHandler({
    router: uploadRouter,
    config: runtime.uploadthing,
  })(event);
});
