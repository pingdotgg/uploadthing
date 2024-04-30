import type { Json } from "@uploadthing/shared";
import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./internal/constants";
import { formatError } from "./internal/error-formatter";
import {
  buildPermissionsInfoHandler,
  buildRequestHandler,
  runRequestHandlerAsync,
} from "./internal/handler";
import { incompatibleNodeGuard } from "./internal/incompat-node-guard";
import type { FileRouter, RouteHandlerOptions } from "./internal/types";
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

export interface ResponseWithCleanup extends Response {
  /** custom property where a Promise may be put that you can await in for example Cloudflare Workers */
  cleanup?: Promise<unknown>;
}

/** @internal */
export const INTERNAL_DO_NOT_USE_createRouteHandlerCore = <
  TRouter extends FileRouter,
>(
  opts: RouteHandlerOptions<TRouter>,
  adapter: string,
) => {
  incompatibleNodeGuard();

  const requestHandler = buildRequestHandler<TRouter, MiddlewareArgs>(
    opts,
    adapter,
  );
  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

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
    // @ts-expect-error - this is a custom property
    res.cleanup = response.cleanup;
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

/**
 * @deprecated Use {@link createRouteHandler} instead
 */
export const createServerHandler = createRouteHandler;
