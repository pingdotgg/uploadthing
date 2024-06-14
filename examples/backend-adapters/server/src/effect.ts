import { HttpServer } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "./router";

const { GET, POST } = createRouteHandler({
  router: uploadRouter,
});

const serverResponseFromWeb = (_: Response) =>
  HttpServer.response.raw(_.body, {
    headers: HttpServer.headers.fromInput(Object.entries(_.headers)),
    status: _.status,
  });

const router = HttpServer.router.empty.pipe(
  HttpServer.router.get("/api", HttpServer.response.text("Hello from Effect")),

  HttpServer.router.get(
    "/api/uploadthing",
    HttpServer.request.ServerRequest.pipe(
      Effect.map(BunHttpServer.request.toRequest),
      Effect.map(GET),
      Effect.flatMap(serverResponseFromWeb),
    ),
  ),

  HttpServer.router.post(
    "/api/uploadthing",
    HttpServer.request.ServerRequest.pipe(
      Effect.map(BunHttpServer.request.toRequest),
      Effect.andThen(POST),
      Effect.flatMap(serverResponseFromWeb),
    ),
  ),
);

router.pipe(
  HttpServer.server.serve(),
  Layer.provide(BunHttpServer.server.layer({ port: 3000 })),
  Layer.launch,
  BunRuntime.runMain,
);
