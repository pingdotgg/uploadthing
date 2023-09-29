import { defineEventHandler } from "h3";

import { createH3EventHandler } from "uploadthing/h3";

export default defineEventHandler((event) =>
  createH3EventHandler({ router: event.context.uploadRouter })(event),
);
