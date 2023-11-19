import { EventEmitter } from "events";

import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";
import type { Json } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants";
import { formatError } from "./internal/error-formatter";
import type { RouterWithConfig } from "./internal/handler";
import {
  buildPermissionsInfoHandler,
  buildRequestHandler,
} from "./internal/handler";
import { incompatibleNodeGuard } from "./internal/incompat-node-guard";
import type { FileRouter } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export * from "./internal/types";
export { UTApi } from "./sdk";

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
  const ee = new EventEmitter();
  console.log("Created event emitter");
  const requestHandler = buildRequestHandler<TRouter>(opts, ee);

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

  const GET = async (request: Request | { request: Request }) => {
    const req = request instanceof Request ? request : request.request;

    const clientPollingKey = req.headers.get("x-uploadthing-polling-key");
    console.log("Got polling request?", clientPollingKey);
    if (clientPollingKey) {
      const eventData = await new Promise((resolve) => {
        ee.addListener("callbackDone", resolve);
      });
      ee.removeAllListeners("callbackDone");

      return new Response(JSON.stringify(eventData), {
        status: 200,
        headers: {
          "x-uploadthing-version": UPLOADTHING_VERSION,
        },
      });
    }

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
