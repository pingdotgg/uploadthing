import * as Effect from "effect/Effect";
import type { H3Event } from "h3";
import { defineEventHandler, toWebRequest } from "h3";

import type { Json } from "@uploadthing/shared";

import { makeAdapterHandler } from "./_internal/handler";
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
export type { FileRouter };

type AdapterArgs = {
  event: H3Event;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<AdapterArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  const handler = makeAdapterHandler<[H3Event], AdapterArgs>(
    (event) => Effect.succeed({ event }),
    (event) => Effect.succeed(toWebRequest(event)),
    opts,
    "h3",
  );

  return defineEventHandler(handler);
};
