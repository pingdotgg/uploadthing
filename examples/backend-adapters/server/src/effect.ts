import { createServer } from "node:http";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import * as Http from "@effect/platform/HttpServer";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { createRouteHandler } from "uploadthing/effect-http";

import { uploadRouter } from "./router";

const UploadThingRouter = createRouteHandler({
  router: uploadRouter,
});

/**
 * Simple CORS middleware that allows everything...
 * Adjust to your needs.
 */
const cors = Http.middleware.make((app) =>
  Effect.gen(function* () {
    const req = yield* Http.request.ServerRequest;

    console.log("CORS REQUEST");

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
    };

    if (req.method === "OPTIONS") {
      console.log("OPTIONS REQUEST");
      return Http.response.empty({
        status: 204,
        headers: Http.headers.fromInput(corsHeaders),
      });
    }

    console.log("REQUEST");
    const response = yield* app;

    return response.pipe(Http.response.setHeaders(corsHeaders));
  }),
);

const logging = Http.middleware.make((app) =>
  Effect.gen(function* () {
    const req = yield* Http.request.ServerRequest;
    const start = Date.now();

    const response = yield* app;

    const end = Date.now();
    console.log(
      `${req.method} ${req.url} ${response.status} - ${end - start}ms`,
    );

    return response;
  }),
);

const router = Http.router.empty.pipe(
  Http.router.get("/api", Http.response.text("Hello from Effect")),
  Http.router.mount("/api/uploadthing", UploadThingRouter),
);

const app = router.pipe(
  Http.router.use(cors),
  Http.router.use(logging),
  Http.server.serve(),
  Http.server.withLogAddress,
);

const ServerLive = NodeHttpServer.server.layer(() => createServer(), {
  port: 3000,
});

NodeRuntime.runMain(Layer.launch(Layer.provide(app, ServerLive)));
