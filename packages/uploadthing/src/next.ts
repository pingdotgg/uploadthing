import type { NextRequest } from "next/server";

import type { Json } from "@uploadthing/shared";

import type { RouterWithConfig } from "./internal/handler";
import type { FileRouter } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";
import { createServerHandler } from "./server";

export type { FileRouter } from "./internal/types";

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<"app", TErrorShape>(opts);

export const createNextRouteHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
) => {
  const handlers = createServerHandler(opts);

  const POST = async (req: NextRequest) => {
    return handlers.POST(req);
  };

  const GET = (req: NextRequest) => {
    return handlers.GET(req);
  };

  return { GET, POST };
};
