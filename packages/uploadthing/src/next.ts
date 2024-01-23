import type { NextRequest } from "next/server";

import type { Json } from "@uploadthing/shared";

import type { RouterWithConfig } from "./internal/handler";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";
import type { FileRouter } from "./server";
import { createRouteHandler as createRouteHandlerCore } from "./server";

export type { FileRouter };

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) =>
  createBuilder<
    { req: NextRequest; res: undefined; event: undefined },
    TErrorShape
  >(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
) => {
  const handlers = createRouteHandlerCore(opts);

  return {
    POST: (req: NextRequest) => handlers.POST(req),
    GET: (req: NextRequest) => handlers.GET(req),
  };
};

/**
 * @deprecated Use {@link createRouteHandler} instead
 */
export const createNextRouteHandler = createRouteHandler;
