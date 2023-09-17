import "dotenv/config";

import { serve } from "@hono/node-server";
import { Hono } from "hono";

import { createServerHandler } from "uploadthing/server";

import { uploadRouter } from "./router";

const { GET, POST } = createServerHandler({
  router: uploadRouter,
});

const app = new Hono();

const ut = new Hono()
  .get("/", (c) => GET(c.req.raw))
  .post("/", (c) => POST(c.req.raw));
app.route("/api/uploadthing", ut);

serve({
  port: 3000,
  hostname: "localhost",
  fetch: app.fetch,
});
