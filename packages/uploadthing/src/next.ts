import type { NextRequest } from "next/server";

import type { Json } from "@uploadthing/shared";

import type { RouteHandlerOptions } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";
import { INTERNAL_DO_NOT_USE_createRouteHandlerCore } from "./server";
import type { FileRouter } from "./types";

export type { FileRouter };
export { UTFiles } from "./internal/types";

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) =>
  createBuilder<
    { req: NextRequest; res: undefined; event: undefined },
    TErrorShape
  >(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  const handlers = INTERNAL_DO_NOT_USE_createRouteHandlerCore(
    opts,
    "nextjs-app",
  );

  return {
    POST: (req: NextRequest) => handlers.POST(req),
    GET: (req: NextRequest) => handlers.GET(req),
  };
};

/**
 * @deprecated Use {@link createRouteHandler} instead
 */
export const createNextRouteHandler = createRouteHandler;
