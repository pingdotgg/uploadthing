import "dotenv/config";

import { createApp, createRouter, eventHandler } from "h3";

import { createRouteHandler } from "uploadthing/h3";

import { uploadRouter } from "./router";

const app = createApp();
const router = createRouter();

router.get(
  "/api",
  eventHandler(() => "Hello from H3!"),
);
router.use("/api/uploadthing", createRouteHandler({ router: uploadRouter }));

app.use(router.handler);

export { app };
