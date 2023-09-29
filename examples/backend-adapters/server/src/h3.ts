import { createApp, eventHandler, useBase } from "h3";

import { createH3EventHandler } from "uploadthing/h3";

import { uploadRouter } from "./router";

export const app = createApp();

app.use(
  "/api",
  eventHandler(() => "Hello from H3!"),
);

app.use("/api/uploadthing", createH3EventHandler({ router: uploadRouter }));
