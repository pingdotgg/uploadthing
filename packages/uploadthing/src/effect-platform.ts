import type { HttpBody } from "@effect/platform";
import {
  HttpMiddleware,
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
} from "@effect/platform";
import * as Effect from "effect/Effect";

import type { Json } from "@uploadthing/shared";
import {
  FetchContext,
  getStatusCodeFromError,
  UploadThingError,
} from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./internal/constants";
import { formatError } from "./internal/error-formatter";
import {
  buildPermissionsInfoHandler,
  buildRequestHandler,
} from "./internal/handler";
import { httpClientLayer } from "./internal/http-client";
import { incompatibleNodeGuard } from "./internal/incompat-node-guard";
import { toWebRequest } from "./internal/to-web-request";
import type { FileRouter, RouteHandlerOptions } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export { UTFiles } from "./internal/types";
export type { FileRouter };

type MiddlewareArgs = {
  req: HttpServerRequest.HttpServerRequest;
  res: undefined;
  event: undefined;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<MiddlewareArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
): HttpRouter.HttpRouter<HttpBody.HttpBodyError, never> => {
  incompatibleNodeGuard();

  const requestHandler = buildRequestHandler<TRouter, MiddlewareArgs>(
    opts,
    "effect-platform",
  );
  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  const appendUploadThingResponseHeaders = HttpMiddleware.make(
    Effect.map(
      HttpServerResponse.setHeader(
        "x-uploadthing-version",
        UPLOADTHING_VERSION,
      ),
    ),
  );

  return HttpRouter.empty.pipe(
    HttpRouter.get("/", HttpServerResponse.json(getBuildPerms())),
    HttpRouter.post(
      "/",
      Effect.flatMap(HttpServerRequest.HttpServerRequest, (req) =>
        requestHandler({
          /**
           * TODO: Redo this to be more cross-platform
           * This should handle WinterCG and Node.js runtimes,
           * unsure about others...
           * Perhaps we can use `Http.request.ServerRequest` internally?
           */
          req: Effect.if(req.source instanceof Request, {
            onTrue: () => Effect.succeed(req.source as Request),
            onFalse: () =>
              req.json.pipe(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                Effect.flatMap((body) => toWebRequest(req.source as any, body)),
                Effect.catchTags({
                  RequestError: (error) =>
                    new UploadThingError({
                      code: "BAD_REQUEST",
                      message: "INVALID_JSON",
                      cause: error,
                    }),
                }),
              ),
          }),
          middlewareArgs: { req, res: undefined, event: undefined },
        }).pipe(
          Effect.provide(httpClientLayer),
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
          Effect.andThen((response) => HttpServerResponse.json(response.body)),
          Effect.catchTag("UploadThingError", (error) =>
            HttpServerResponse.json(formatError(error, opts.router), {
              status: getStatusCodeFromError(error),
            }),
          ),
        ),
      ),
    ),
    HttpRouter.use(appendUploadThingResponseHeaders),
  );
};
