import "dotenv/config";

import { createServer } from "node:http";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import * as Http from "@effect/platform/HttpServer";
import { Config, Effect, Layer } from "effect";

import { createRouteHandler } from "uploadthing/effect-platform";

import { uploadRouter } from "./router";

const uploadthingRouter = createRouteHandler({
  router: uploadRouter,
});

/**
 * Simple CORS middleware that allows everything...
 * Adjust to your needs.
 */
const cors = Http.middleware.make((app) =>
  Effect.gen(function* () {
    const req = yield* Http.request.ServerRequest;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
    };

    if (req.method === "OPTIONS") {
      return Http.response.empty({
        status: 204,
        headers: Http.headers.fromInput(corsHeaders),
      });
    }

    const response = yield* app;

    return response.pipe(Http.response.setHeaders(corsHeaders));
  }),
);

const router = Http.router.empty.pipe(
  Http.router.get("/api", Http.response.text("Hello from Effect")),
  Http.router.mount("/api/uploadthing", uploadthingRouter),
);

const app = router.pipe(
  cors,
  Http.server.serve(Http.middleware.logger),
  Http.server.withLogAddress,
);

const Port = Config.integer("PORT").pipe(Config.withDefault(3000));
const ServerLive = Layer.unwrapEffect(
  Effect.map(Port, (port) =>
    NodeHttpServer.server.layer(() => createServer(), { port }),
  ),
);

NodeRuntime.runMain(Layer.launch(Layer.provide(app, ServerLive)));
