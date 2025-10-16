import type { CorsHttpRouter } from "convex-helpers/server/cors";
import type { FunctionReference, HttpRouter } from "convex/server";
import { httpActionGeneric } from "convex/server";

export const createRouteHandler = ({
  http,
  internalAction,
  path = "/api/uploadthing",
}: {
  http: HttpRouter | CorsHttpRouter;
  internalAction: FunctionReference<
    "action",
    "internal",
    {
      request: {
        url: string;
        method: string;
        headers: Record<string, string>;
        body?: string;
      };
    },
    {
      status: number;
      statusText: string;
      headers: Record<string, string>;
      body: string;
    }
  >;
  path?: string;
}) => {
  const handler = httpActionGeneric(async (ctx, req) => {
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const request = {
      url: req.url,
      method: req.method,
      headers,
      body: await req.text(),
    };
    const response = await ctx.runAction(internalAction, { request });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  });

  http.route({
    method: "OPTIONS",
    path,
    handler: httpActionGeneric(async () =>
      Promise.resolve(new Response(null, { status: 204 })),
    ),
  });

  http.route({ method: "GET", path, handler });

  http.route({ method: "POST", path, handler });
};
