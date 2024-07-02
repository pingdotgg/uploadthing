import "dotenv/config";

import { createServer } from "node:http";
import {
  Headers,
  HttpClient,
  HttpMiddleware,
  HttpRouter,
  HttpServer,
  HttpServerRequest,
  HttpServerResponse,
} from "@effect/platform";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Config, Effect, Layer, Logger, LogLevel } from "effect";

import { createRouteHandler } from "uploadthing/effect-platform";

import { uploadRouter } from "./router";

const uploadthingRouter = createRouteHandler({
  router: uploadRouter,
});

/**
 * Simple CORS middleware that allows everything
 * Adjust to your needs.
 */
const cors = HttpMiddleware.make((app) =>
  Effect.gen(function* () {
    const req = yield* HttpServerRequest.HttpServerRequest;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
    };

    if (req.method === "OPTIONS") {
      return HttpServerResponse.empty({
        status: 204,
        headers: Headers.fromInput(corsHeaders),
      });
    }

    const response = yield* app;

    return response.pipe(HttpServerResponse.setHeaders(corsHeaders));
  }),
);

const router = HttpRouter.empty.pipe(
  HttpRouter.get("/api", HttpServerResponse.text("Hello from Effect")),
  HttpRouter.mount("/api/uploadthing", uploadthingRouter),
);

const app = router.pipe(
  cors,
  HttpServer.serve(HttpMiddleware.logger),
  HttpServer.withLogAddress,
  Layer.provide(HttpClient.layer),
);

const Port = Config.integer("PORT").pipe(Config.withDefault(3000));
const ServerLive = Layer.unwrapEffect(
  Effect.map(Port, (port) =>
    NodeHttpServer.layer(() => createServer(), { port }),
  ).pipe(Effect.provide(Logger.minimumLogLevel(LogLevel.Debug))),
);

NodeRuntime.runMain(Layer.launch(Layer.provide(app, ServerLive)));
