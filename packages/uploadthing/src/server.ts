import * as Effect from "effect/Effect";

import type { Json } from "@uploadthing/shared";
import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";

import { isDevelopment, UPLOADTHING_VERSION } from "./internal/config";
import { formatError } from "./internal/error-formatter";
import {
  buildPermissionsInfoHandler,
  buildRequestHandler,
  runRequestHandlerAsync,
} from "./internal/handler";
import type {
  FileRouter,
  ResponseWithCleanup,
  RouteHandlerOptions,
} from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export { UTFiles } from "./internal/types";
export { UTApi } from "./sdk";
export { UTFile } from "./sdk/ut-file";
export { UploadThingError, type FileRouter };

type MiddlewareArgs = { req: Request; res: undefined; event: undefined };

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<MiddlewareArgs, TErrorShape>(opts);

/** @internal */
export const INTERNAL_DO_NOT_USE_createRouteHandlerCore = <
  TRouter extends FileRouter,
>(
  opts: RouteHandlerOptions<TRouter>,
  adapter: string,
) => {
  const requestHandler = buildRequestHandler<TRouter, MiddlewareArgs>(
    opts,
    adapter,
  );
  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  const isDev = Effect.runSync(isDevelopment);
  const handleDaemonPromise =
    opts.config?.handleDaemonPromise ?? (isDev ? "void" : "await");
  if (isDev && handleDaemonPromise === "await") {
    throw new UploadThingError({
      code: "INVALID_SERVER_CONFIG",
      message: 'handleDaemonPromise: "await" is forbidden in development.',
    });
  }

  const POST = async (
    request: Request | { request: Request },
  ): Promise<Response | ResponseWithCleanup> => {
    const req = request instanceof Request ? request : request.request;
    const response = await runRequestHandlerAsync(
      requestHandler,
      {
        req,
        middlewareArgs: { req, event: undefined, res: undefined },
      },
      opts.config,
    );

    if (response.success === false) {
      return Response.json(formatError(response.error, opts.router), {
        status: getStatusCodeFromError(response.error),
        headers: { "x-uploadthing-version": UPLOADTHING_VERSION },
      });
    }

    const res = Response.json(response.body, {
      headers: { "x-uploadthing-version": UPLOADTHING_VERSION },
    });

    if (handleDaemonPromise === "void") {
      // noop or `void response.cleanup()`?
    } else if (handleDaemonPromise === "await") {
      await response.cleanup();
    } else if (typeof handleDaemonPromise === "function") {
      handleDaemonPromise(response.cleanup());
    }

    return res as ResponseWithCleanup;
  };

  const GET = (request: Request | { request: Request }) => {
    const _req = request instanceof Request ? request : request.request;

    return Response.json(getBuildPerms(), {
      headers: { "x-uploadthing-version": UPLOADTHING_VERSION },
    });
  };

  return { GET, POST };
};

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => INTERNAL_DO_NOT_USE_createRouteHandlerCore(opts, "server");

export const extractRouterConfig = (router: FileRouter) =>
  buildPermissionsInfoHandler({ router })();
