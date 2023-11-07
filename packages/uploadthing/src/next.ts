// @ts-expect-error - ehh?
import type { NextRequest } from "next/server";

import type { Json } from "@uploadthing/shared";

import type { RouterWithConfig } from "./internal/handler.js";
import type { CreateBuilderOptions } from "./internal/upload-builder.js";
import { createBuilder } from "./internal/upload-builder.js";
import type { FileRouter } from "./server.js";
import { createServerHandler } from "./server.js";

export type { FileRouter } from "./internal/types.js";

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) =>
  createBuilder<
    { req: NextRequest; res: undefined; event: undefined },
    TErrorShape
  >(opts);

export const createNextRouteHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
) => {
  const handlers = createServerHandler(opts);

  return {
    POST: (req: NextRequest) => handlers.POST(req),
    GET: (req: NextRequest) => handlers.GET(req),
  };
};
