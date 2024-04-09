import "dotenv/config";

import {
  appendCorsPreflightHeaders,
  createApp,
  createRouter,
  eventHandler,
} from "h3";

import { createRouteHandler } from "uploadthing/h3";

import { uploadRouter } from "./router";

const app = createApp({
  onRequest(event) {
    appendCorsPreflightHeaders(event, {});
  },
});
const router = createRouter();

router.get(
  "/api",
  eventHandler(() => "Hello from H3!"),
);
router.options("/api/uploadthing", () => null);
router.use("/api/uploadthing", createRouteHandler({ router: uploadRouter }));

app.use(router.handler);

export { app };
