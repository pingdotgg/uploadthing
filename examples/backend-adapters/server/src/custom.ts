/// <reference types="bun" />

import type { BunRequest, Server } from "bun";
import { Effect } from "effect";

import { createBuilder, makeAdapterHandler } from "uploadthing/server";

type AdapterArgs = {
  req: BunRequest<string>;
  server: Server<unknown>;
};
const f = createBuilder<AdapterArgs>();

const router = {
  image: f({ image: { maxFileSize: "16MB" } })
    .middleware((opts) => {
      opts.req;
      //   ^? BunRequest
      opts.server;
      //   ^? Server
      return { userId: "user_123" };
    })
    .onUploadError((opts) => {
      opts.req;
      //   ^? BunRequest
      opts.server;
      //   ^? Server
    })
    .onUploadComplete((opts) => {
      opts.req;
      //   ^? BunRequest
      opts.server;
      //   ^? Server
    }),
};

const requestHandler = makeAdapterHandler<
  [BunRequest<string>, Server<unknown>],
  AdapterArgs
>(
  (req, server) => Effect.succeed({ req, server }),
  (req) => Effect.succeed(req as Request),
  {
    router,
  },
  "bun",
);

const server = Bun.serve({
  routes: {
    "/api/uploadthing": requestHandler,
  },
});

console.log("listening on", server.url);
