import type {
  DataModelFromSchemaDefinition,
  GenericActionCtx,
  GenericDataModel,
  HttpRouter,
  SchemaDefinition,
} from "convex/server";
import { httpActionGeneric, httpRouter } from "convex/server";
import * as Effect from "effect/Effect";

import type { Json } from "@uploadthing/shared";

import { makeAdapterHandler } from "./internal/handler";
import type { FileRouter, RouteHandlerOptions } from "./internal/types";
import { createBuilder } from "./internal/upload-builder";
import type { CreateBuilderOptions } from "./internal/upload-builder";

export type { FileRouter };

type MiddlewareArgs<DataModel extends GenericDataModel> = {
  req: Request;
  res: undefined;
  event: GenericActionCtx<DataModel>;
};

type ConvexBuilderOptions<
  TErrorShape extends Json,
  SchemaDef extends SchemaDefinition<any, boolean>,
> = CreateBuilderOptions<TErrorShape> & {
  schema?: SchemaDef;
};

export const createUploadthing = <
  TErrorShape extends Json,
  SchemaDef extends SchemaDefinition<any, boolean>,
>(
  opts?: ConvexBuilderOptions<TErrorShape, SchemaDef>,
) =>
  createBuilder<
    MiddlewareArgs<DataModelFromSchemaDefinition<SchemaDef>>,
    TErrorShape
  >(opts);

export const addUploadthingRoutes = <TRouter extends FileRouter>(
  router: HttpRouter,
  opts: RouteHandlerOptions<TRouter>,
) => {
  const handler = makeAdapterHandler<
    [GenericActionCtx<GenericDataModel>, Request]
  >(
    (ctx, req) => Effect.succeed({ req, res: undefined, event: ctx }),
    (_, req) => Effect.succeed(req),
    opts,
    "convex",
  );

  router.route({
    method: "GET",
    path: "/api/uploadthing",
    handler: httpActionGeneric(handler),
  });

  router.route({
    method: "POST",
    path: "/api/uploadthing",
    handler: httpActionGeneric(handler),
  });

  router.route({
    method: "OPTIONS",
    path: "/api/uploadthing",
    handler: httpActionGeneric((_ctx, { headers }) => {
      const isCorsRequest =
        headers.get("Origin") != null &&
        headers.get("Access-Control-Request-Method") != null &&
        headers.get("Access-Control-Request-Headers") != null;

      if (!isCorsRequest) {
        return Promise.resolve(new Response());
      }
      return Promise.resolve(
        new Response(null, {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "86400",
          },
        }),
      );
    }),
  });
};

//
// TEST
//

const f = createUploadthing();
const router = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async ({ event }) => {
      const identity = await event.auth.getUserIdentity();
      return { userId: identity?.subject ?? "nothing" };
    })
    .onUploadComplete(async (args) => {
      return { uploadedBy: args.metadata.userId };
    }),
} satisfies FileRouter;

const http = httpRouter();
addUploadthingRoutes(http, { router });
