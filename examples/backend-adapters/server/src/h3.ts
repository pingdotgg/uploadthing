import { createApp, createRouter, eventHandler } from "h3";

import { createH3EventHandler } from "uploadthing/h3";

import { uploadRouter } from "./router";

const app = createApp();
const router = createRouter();

router.get(
  "/api",
  eventHandler(() => "Hello from H3!"),
);
router.use("/api/uploadthing", createH3EventHandler({ router: uploadRouter }));

app.use(router.handler);

export { app };
