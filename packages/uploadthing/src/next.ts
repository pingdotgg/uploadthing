import type { NextRequest } from "next/server";

import type { Json } from "@uploadthing/shared";

import type { RouterWithConfig } from "./internal/handler";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";
import type { FileRouter } from "./server";
import { createServerHandler } from "./server";

export type { FileRouter } from "./internal/types";

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
    POST: (req: NextRequest, ctx: { params?: Record<string, unknown> }) => {
      // If the route file is like `[[...slug]]/route.ts`, then ctx.params is defined
      // If the route file is like `route.ts`, then ctx.params is undefined
      const callbackWithPathparam = !!ctx?.params;
      const action = req.nextUrl.searchParams.get("actionType");
      if (action && callbackWithPathparam) {
        // Rewrite the request to /{action}, that way we can send a request to
        // /callback later without hitting Next.js' recursion stopper
        const newUrl = new URL(req.nextUrl);
        newUrl.pathname += `/${action}`;
        const rewritten = new Request(newUrl, {
          method: req.method,
          headers: req.headers,
          body: req.body,
        });
        return handlers.POST(rewritten, true);
      }

      return handlers.POST(req);
    },
    GET: (req: NextRequest) => handlers.GET(req),
  };
};
