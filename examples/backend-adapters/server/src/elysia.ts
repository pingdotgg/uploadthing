import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "./router";

const handler = createRouteHandler({
  router: uploadRouter,
});

// The `(ev) => handler(ev.request)` shape is intentional — it keeps
// Elysia's static analyzer from inferring the route reads `body` and
// pre-parsing the request, which would consume the stream before
// UploadThing's handler reads it. If you rewrite to the idiomatic
// `({ request }) => handler(request)`, add `{ parse: "none" }` as the
// route's third arg to opt out of body parsing. See the Elysia callout
// in docs/src/app/(docs)/backend-adapters/fetch/page.mdx and
// elysiajs/elysia#1252.
new Elysia()
  .get("/api", () => "Hello from Elysia!")
  .get("/api/uploadthing", (ev) => handler(ev.request))
  .post("/api/uploadthing", (ev) => handler(ev.request))
  .use(cors())
  .listen(3000, (server) => {
    console.log(`Server listening on port ${server.port}`);
  });
