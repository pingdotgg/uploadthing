import {
  Headers,
  HttpRouter,
  HttpServer,
  HttpServerRequest,
  HttpServerResponse,
} from "@effect/platform";
import {
  BunHttpServer,
  BunHttpServerRequest,
  BunRuntime,
} from "@effect/platform-bun";
import { Effect, Layer } from "effect";

import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "./router";

const { GET, POST } = createRouteHandler({
  router: uploadRouter,
});

const serverResponseFromWeb = (_: Response) =>
  HttpServerResponse.raw(_.body, {
    headers: Headers.fromInput(Object.entries(_.headers)),
    status: _.status,
  });

const router = HttpRouter.empty.pipe(
  HttpRouter.get("/api", HttpServerResponse.text("Hello from Effect")),

  HttpRouter.get(
    "/api/uploadthing",
    HttpServerRequest.HttpServerRequest.pipe(
      Effect.map(BunHttpServerRequest.toRequest),
      Effect.map(GET),
      Effect.flatMap(serverResponseFromWeb),
    ),
  ),

  HttpRouter.post(
    "/api/uploadthing",
    HttpServerRequest.HttpServerRequest.pipe(
      Effect.map(BunHttpServerRequest.toRequest),
      Effect.andThen(POST),
      Effect.flatMap(serverResponseFromWeb),
    ),
  ),
);

router.pipe(
  HttpServer.serve(),
  Layer.provide(BunHttpServer.layer({ port: 3000 })),
  Layer.launch,
  BunRuntime.runMain,
);
