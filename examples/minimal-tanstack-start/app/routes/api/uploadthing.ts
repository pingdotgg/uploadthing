import { createAPIFileRoute } from "@tanstack/start/api";

import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "../../server/uploadthing";

const handlers = createRouteHandler({ router: uploadRouter });
export const Route = createAPIFileRoute("/api/uploadthing")({
  GET: ({ request }) => handlers(request),
  POST: ({ request }) => handlers(request),
});
