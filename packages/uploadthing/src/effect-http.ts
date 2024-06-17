import * as Http from "@effect/platform/HttpServer";
import * as Effect from "effect/Effect";

import type { Json } from "@uploadthing/shared";
import { FetchContext, getStatusCodeFromError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./internal/constants";
import { formatError } from "./internal/error-formatter";
import {
  buildPermissionsInfoHandler,
  buildRequestHandler,
} from "./internal/handler";
import { incompatibleNodeGuard } from "./internal/incompat-node-guard";
import type { FileRouter, RouteHandlerOptions } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export { UTFiles } from "./internal/types";
export type { FileRouter };

type MiddlewareArgs = {
  req: Http.request.ServerRequest;
  res: undefined;
  event: undefined;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<MiddlewareArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
): Http.router.Router<Http.body.BodyError, never> => {
  incompatibleNodeGuard();

  const requestHandler = buildRequestHandler<TRouter, MiddlewareArgs>(
    opts,
    "effect-http",
  );
  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  return Http.router.empty.pipe(
    Http.router.get(
      "/",
      Http.response.json(getBuildPerms(), {
        headers: Http.headers.fromInput({
          "x-uploadthing-version": UPLOADTHING_VERSION,
        }),
      }),
    ),
    Http.router.post(
      "/",
      Effect.flatMap(Http.request.ServerRequest, (req) =>
        requestHandler({
          req: req.source as Request, // TODO: think this is unsafe
          middlewareArgs: { req, res: undefined, event: undefined },
        }).pipe(
          Effect.provideService(FetchContext, {
            fetch: opts.config?.fetch ?? globalThis.fetch,
            baseHeaders: {
              "x-uploadthing-version": UPLOADTHING_VERSION,
              // These are filled in later in `parseAndValidateRequest`
              "x-uploadthing-api-key": undefined,
              "x-uploadthing-be-adapter": undefined,
              "x-uploadthing-fe-package": undefined,
            },
          }),
          Effect.andThen((response) =>
            Http.response.json(response.body, {
              headers: Http.headers.fromInput({
                "x-uploadthing-version": UPLOADTHING_VERSION,
              }),
            }),
          ),
          Effect.catchTag("UploadThingError", (error) =>
            Http.response.json(formatError(error, opts.router), {
              status: getStatusCodeFromError(error),
              headers: Http.headers.fromInput({
                "x-uploadthing-version": UPLOADTHING_VERSION,
              }),
            }),
          ),
        ),
      ),
    ),
  );
};
