/// <reference types="@cloudflare/workers-types" />

import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "./router";

export interface Env {
  UPLOADTHING_TOKEN: string;
  ENVIRONMENT?: string;
}

const cors = (res?: Response) => {
  if (!res) res = new Response(null, { status: 204 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST");
  res.headers.set("Access-Control-Allow-Headers", "*");
  return res;
};

const handler = async (request: Request, env: Env, ctx: ExecutionContext) => {
  const handler = createRouteHandler({
    router: uploadRouter,
    config: {
      /**
       * Since workers doesn't have envs on `process`. We need to pass
       * secret and isDev flag manually.
       */
      token: env.UPLOADTHING_TOKEN,
      isDev: env.ENVIRONMENT === "development",
      logLevel: "Debug",
      /*
       * Cloudflare Workers doesn't support the cache option
       * so we need to remove it from the request init.
       */
      fetch: (url, init) => {
        if (init && "cache" in init) delete init.cache;
        return fetch(url, init);
      },
      handleDaemonPromise: (promise) => ctx.waitUntil(promise),
      ingestUrl: "http://localhost:3001",
    },
  });

  // World's simplest router. Handle GET/POST requests to /api/uploadthing
  switch (new URL(request.url).pathname) {
    case "/api": {
      return cors(new Response("Hello from Cloudflare Workers!"));
    }
    case "/api/uploadthing": {
      if (request.method !== "GET" && request.method !== "POST") {
        return cors(new Response("Method not allowed", { status: 405 }));
      }

      const response = await handler(request);
      return cors(response);
    }
    default: {
      return cors(new Response("Not found", { status: 404 }));
    }
  }
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") return cors();
    return cors(await handler(request, env, ctx));
  },
} satisfies ExportedHandler<Env>;
