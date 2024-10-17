import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "./router";

const handler = createRouteHandler({
  router: uploadRouter,
});

new Elysia()
  .get("/api", () => "Hello from Elysia!")
  .get("/api/uploadthing", (ev) => handler(ev.request))
  .post("/api/uploadthing", (ev) => handler(ev.request))
  .use(cors())
  .listen(3000, (server) => {
    console.log(`Server listening on port ${server.port}`);
  });
