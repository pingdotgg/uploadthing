import { Elysia } from "elysia";

import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "./router";

const { GET, POST } = createRouteHandler({
  router: uploadRouter,
});

const app = new Elysia();
app.get("/api", () => "Hello from Elysia!");

app.group("/api/uploadthing", (app) =>
  app
    .post("/", (context) => POST(context.request))
    .get("/", (context) => GET(context.request)),
);

app.listen(3000);
