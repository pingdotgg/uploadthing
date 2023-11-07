import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";
import type { Json } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants.js";
import { formatError } from "./internal/error-formatter.js";
import type { RouterWithConfig } from "./internal/handler.js";
import {
  buildPermissionsInfoHandler,
  buildRequestHandler,
} from "./internal/handler.js";
import { incompatibleNodeGuard } from "./internal/incompat-node-guard.js";
import type { FileRouter } from "./internal/types.js";
import type { CreateBuilderOptions } from "./internal/upload-builder.js";
import { createBuilder } from "./internal/upload-builder.js";

export * from "./internal/types.js";
export { utapi, UTApi } from "./sdk/index.js";

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) =>
  createBuilder<
    { req: Request; res: undefined; event: undefined },
    TErrorShape
  >(opts);

export const createServerHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
) => {
  incompatibleNodeGuard();

  const requestHandler = buildRequestHandler<TRouter>(opts);

  const POST = async (request: Request | { request: Request }) => {
    const req = request instanceof Request ? request : request.request;
    const response = await requestHandler({ req });

    if (response instanceof UploadThingError) {
      return new Response(JSON.stringify(formatError(response, opts.router)), {
        status: getStatusCodeFromError(response),
        headers: {
          "x-uploadthing-version": UPLOADTHING_VERSION,
        },
      });
    }
    if (response.status !== 200) {
      // We messed up - this should never happen
      return new Response("An unknown error occured", {
        status: 500,
        headers: {
          "x-uploadthing-version": UPLOADTHING_VERSION,
        },
      });
    }

    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: {
        "x-uploadthing-version": UPLOADTHING_VERSION,
      },
    });
  };

  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  const GET = (request: Request | { request: Request }) => {
    const _req = request instanceof Request ? request : request.request;

    return new Response(JSON.stringify(getBuildPerms()), {
      status: 200,
      headers: {
        "x-uploadthing-version": UPLOADTHING_VERSION,
      },
    });
  };

  return { GET, POST };
};

export const extractRouterConfig = (router: FileRouter) =>
  buildPermissionsInfoHandler({ router })();
