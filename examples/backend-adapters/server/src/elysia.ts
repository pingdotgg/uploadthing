import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "./router";

const { GET, POST } = createRouteHandler({
  router: uploadRouter,
});

const app = new Elysia().use(cors());
app.get("/api", () => "Hello from Elysia!");

app.group("/api/uploadthing", (app) => app.post("/", POST).get("/", GET));

app.listen(3000);
