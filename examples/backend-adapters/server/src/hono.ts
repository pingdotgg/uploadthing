import "dotenv/config";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "./router";

const handler = createRouteHandler({
  router: uploadRouter,
});

const app = new Hono();
app.use("*", cors());
app.use("*", logger());

app.get("/api", (c) => c.text("Hello from Hono!"));
app.all("/api/uploadthing", (c) => handler(c.req.raw));

serve({
  port: 3000,
  hostname: "localhost",
  fetch: app.fetch,
});
