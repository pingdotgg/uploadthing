import * as Effect from "effect/Effect";
import type { H3Event } from "h3";
import { defineEventHandler, toWebRequest } from "h3";

import type { Json } from "@uploadthing/shared";

import { makeAdapterHandler } from "./internal/handler";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";
import type { FileRouter, RouteHandlerOptions } from "./types";

export { UTFiles } from "./internal/types";
export type { FileRouter };

type AdapterArgs = { req: undefined; res: undefined; event: H3Event };

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<AdapterArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  const handler = makeAdapterHandler<[H3Event]>(
    (event) => Effect.succeed({ req: undefined, res: undefined, event }),
    (event) => Effect.succeed(toWebRequest(event)),
    opts,
    "h3",
  );

  return defineEventHandler(handler);
};
