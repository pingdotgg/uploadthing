import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "./router";

const handler = createRouteHandler({
  router: uploadRouter,
});

const app = new Elysia().use(cors());
app.get("/api", () => "Hello from Elysia!");
app.all("/api/uploadthing", handler);

app.listen(3000);
