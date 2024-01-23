/// <reference types="@cloudflare/workers-types" />

import { createServerHandler } from "uploadthing/server";

import { uploadRouter } from "./router";

export interface Env {
  UPLOADTHING_SECRET: string;
  MODE: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const handlers = createServerHandler({
      router: uploadRouter,
      config: {
        /**
         * Since workers doesn't have envs on `process`. We need to pass
         * secret and isDev flag manually.
         */
        uploadthingSecret: env.UPLOADTHING_SECRET,
        isDev: env.MODE === "development",
        /*
         * Cloudflare Workers doesn't support the cache option
         * so we need to remove it from the request init.
         */
        fetch: (url, init) => {
          if (init && "cache" in init) delete init.cache;
          return fetch(url, init);
        },
      },
    });

    // World's simplest router. Handle GET/POST requests to /api/uploadthing
    switch (new URL(request.url).pathname) {
      case "/api": {
        return new Response("Hello from Cloudflare Workers!");
      }
      case "/api/uploadthing": {
        if (request.method !== "GET" && request.method !== "POST") {
          return new Response("Method not allowed", { status: 405 });
        }

        const response = await handlers[request.method](request);
        if ("cleanup" in response && response.cleanup) {
          /**
           * UploadThing dev server leaves some promises hanging around that we
           * need to wait for to prevent the worker from exiting prematurely.
           */
          ctx.waitUntil(response.cleanup);
        }
        return response;
      }
      default: {
        return new Response("Not found", { status: 404 });
      }
    }
  },
};
