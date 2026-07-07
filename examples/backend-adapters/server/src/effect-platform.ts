import "dotenv/config";

import { createServer } from "node:http";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Config, Effect, Layer, References } from "effect";
import {
  FetchHttpClient,
  HttpRouter,
  HttpServer,
  HttpServerResponse,
} from "effect/unstable/http";

import { createRouteHandler } from "uploadthing/effect-platform";

import { uploadRouter } from "./router";

const uploadthingHandler = createRouteHandler({
  router: uploadRouter,
});

const Routes = Layer.mergeAll(
  HttpRouter.add("GET", "/api", HttpServerResponse.text("Hello from Effect")),
  HttpRouter.add(
    "*",
    "/api/uploadthing",
    uploadthingHandler.pipe(Effect.orDie),
  ),
  /**
   * Simple CORS middleware that allows everything.
   * Adjust to your needs.
   */
  HttpRouter.cors({
    allowedOrigins: ["*"],
    allowedMethods: ["*"],
    allowedHeaders: ["*"],
  }),
);

const ServerLive = Layer.unwrap(
  Effect.map(Config.port("PORT").pipe(Config.withDefault(3000)), (port) =>
    NodeHttpServer.layer(() => createServer(), { port }),
  ),
);

const AppLive = HttpRouter.serve(Routes).pipe(
  HttpServer.withLogAddress,
  Layer.provide(FetchHttpClient.layer),
  Layer.provide(ServerLive),
  Layer.provide(Layer.succeed(References.MinimumLogLevel, "Debug")),
);

NodeRuntime.runMain(Layer.launch(AppLive));
