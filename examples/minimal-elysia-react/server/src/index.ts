import { Elysia } from "elysia";

import { createServerHandler } from "uploadthing/server";

import { uploadRouter } from "./router";

const { GET, POST } = createServerHandler({
  router: uploadRouter,
});

const app = new Elysia();

app.group("/api/uploadthing", (app) =>
  app
    .post("/", (context) => {
      return POST(context.request);
    })
    .get("/", (context) => {
      return GET(context.request);
    }),
);

app.listen(3000);
