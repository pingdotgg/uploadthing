import type { FunctionReference, HttpRouter } from "convex/server";
import { httpActionGeneric } from "convex/server";

const addCorsHeaders = (headers?: Record<string, string>) => {
  if (!process.env.CLIENT_ORIGIN) {
    throw new Error("Convex deployment doesn't have CLIENT_ORIGIN set");
  }

  return new Headers({
    ...headers,
    "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  });
};

export const createRouteHandler = (
  http: HttpRouter,
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
  >,
) => {
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
      headers: addCorsHeaders(response.headers),
    });
  });

  http.route({
    method: "OPTIONS",
    path: "/api/uploadthing",
    handler: httpActionGeneric(async () =>
      Promise.resolve(
        new Response(null, { status: 204, headers: addCorsHeaders() }),
      ),
    ),
  });

  http.route({ method: "GET", path: "/api/uploadthing", handler });

  http.route({ method: "POST", path: "/api/uploadthing", handler });
};
