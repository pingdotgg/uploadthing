import { internalActionGeneric } from "convex/server";
import type { GenericActionCtx, GenericDataModel } from "convex/server";
import { v } from "convex/values";
import * as Effect from "effect/Effect";

import type { Json } from "@uploadthing/shared";

import { makeAdapterHandler } from "./_internal/handler";
import { createBuilder } from "./_internal/upload-builder";
import type { CreateBuilderOptions } from "./_internal/upload-builder";
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
  ctx: GenericActionCtx<GenericDataModel>;
  req: Request;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<AdapterArgs, TErrorShape>(opts);

export const createInternalAction = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  const handler = makeAdapterHandler<
    [GenericActionCtx<GenericDataModel>, Request],
    AdapterArgs
  >(
    (ctx, req) => Effect.succeed({ ctx, req }),
    (_, req) => Effect.succeed(req),
    opts,
    "convex",
  );

  return internalActionGeneric({
    args: {
      request: v.object({
        url: v.string(),
        method: v.string(),
        headers: v.record(v.string(), v.string()),
        body: v.optional(v.string()),
      }),
    },
    handler: async (ctx: GenericActionCtx<GenericDataModel>, args) => {
      const request = new Request(args.request.url, {
        method: args.request.method,
        headers: new Headers(args.request.headers),
        body: args.request.body ? new Blob([args.request.body]) : null,
      });

      const response = await handler(ctx, request);

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(Object.entries(response.headers)),
        body: await response.text(),
      };
    },
  });
};
