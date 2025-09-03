import corsRouter from "convex-helpers/server/cors";
import { httpRouter } from "convex/server";

import { createRouteHandler } from "uploadthing/convex-helpers";

import { internal } from "./_generated/api";

const http = httpRouter();

const cors = corsRouter(http, {
  allowedOrigins: ["http://localhost:3000"],
});

createRouteHandler({
  http: cors,
  internalAction: internal.uploadthing.handler,
  path: "/api/uploadthing",
});

export default http;
