import * as Effect from "effect/Effect";

import type { Json } from "@uploadthing/shared";
import { UploadThingError } from "@uploadthing/shared";

import { makeAdapterHandler } from "./_internal/handler";
import { extractRouterConfig as extractEffect } from "./_internal/route-config";
import type { CreateBuilderOptions } from "./_internal/upload-builder";
import { createBuilder } from "./_internal/upload-builder";
import type { FileRouter, RouteHandlerOptions } from "./types";

export {
  UTFiles,
  /**
   * This is an experimental feature.
   * You need to be feature flagged on our backend to use this
   */
  UTRegion as experimental_UTRegion,
} from "./_internal/types";
export { UTApi } from "./sdk";
export { UTFile } from "./sdk/ut-file";
export { UploadThingError, type FileRouter, makeAdapterHandler, createBuilder };

type AdapterArgs = {
  req: Request;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<AdapterArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  return makeAdapterHandler<[Request | { request: Request }], AdapterArgs>(
    (ev) =>
      Effect.succeed({
        req: "request" in ev ? ev.request : ev,
      }),
    (ev) => Effect.succeed("request" in ev ? ev.request : ev),
    opts,
    "server",
  );
};

export const extractRouterConfig = (router: FileRouter) =>
  Effect.runSync(extractEffect(router));
