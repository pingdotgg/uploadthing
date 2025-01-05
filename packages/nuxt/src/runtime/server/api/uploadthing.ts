import { useRuntimeConfig } from "#imports";
import { uploadRouter } from "#uploadthing-router";
import { defineEventHandler } from "h3";

import { createRouteHandler } from "uploadthing/h3";
import type { RouteHandlerConfig } from "uploadthing/types";

const emptyStringToUndefined = (obj: Record<string, unknown>) => {
  const newObj: Record<string, unknown> = {};
  for (const key in obj) {
    if (obj[key] === "") newObj[key] = undefined;
    else newObj[key] = obj[key];
  }
  return newObj;
};

export default defineEventHandler((event) => {
  const runtime = useRuntimeConfig() as { uploadthing?: RouteHandlerConfig };
  const config = emptyStringToUndefined(runtime.uploadthing ?? {});

  return createRouteHandler({
    router: uploadRouter,
    config,
  })(event);
});
