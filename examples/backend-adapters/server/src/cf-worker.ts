/// <reference types="@cloudflare/workers-types" />

import { createServerHandler } from "uploadthing/server";

import { uploadRouter } from "./router";

export interface Env {
  UPLOADTHING_SECRET: string;
  MODE: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
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

    // World's worst router
    switch (url.pathname) {
      case "/api": {
        return new Response("Hello from Cloudflare Workers!");
      }
      case "/api/uploadthing": {
        const response = await handlers[
          request.method as keyof typeof handlers
        ](request);
        if ("cleanup" in response && response.cleanup) {
          // Let any cleanup tasks run before quitting the worker
          ctx.waitUntil(response.cleanup);
        }
        return response ?? new Response("Method not allowed", { status: 405 });
      }
      default: {
        return new Response("Not found", { status: 404 });
      }
    }
  },
};
