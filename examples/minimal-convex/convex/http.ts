import { httpRouter } from "convex/server";

import { createRouteHandler } from "uploadthing/convex-helpers";

import { internal } from "./_generated/api";

const http = httpRouter();

createRouteHandler({
  http,
  internalAction: internal.uploadthing.handler,
  path: "/api/uploadthing",
});

export default http;
