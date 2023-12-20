/// <reference types="@cloudflare/workers-types" />

import { createServerHandler } from "uploadthing/server";

import { uploadRouter } from "./router";

export interface Env {
  UPLOADTHING_SECRET: string;
  MODE: string;
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const handlers = createServerHandler({
      router: uploadRouter,
      config: {
        /**
         * Since workers doesn't have a global process.env, we need to set the config manually
         */
        uploadthingSecret: env.UPLOADTHING_SECRET,
        isDev: env.MODE === "development",
        callbackUrl: url.origin + url.pathname,
      },
    });

    // World's worst router
    switch (url.pathname) {
      case "/api": {
        return new Response("Hello from Cloudflare Workers!");
      }
      case "/api/uploadthing": {
        return request.method === "GET" || request.method === "POST"
          ? handlers[request.method](request)
          : new Response("Method not allowed", { status: 405 });
      }
      default: {
        return new Response("Not found", { status: 404 });
      }
    }
  },
};
