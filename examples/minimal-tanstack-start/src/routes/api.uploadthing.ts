import { createFileRoute } from "@tanstack/react-router";

import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "../server/uploadthing";

const handlers = createRouteHandler({ router: uploadRouter });

export const Route = createFileRoute("/api/uploadthing")({
  server: {
    handlers: {
      GET: handlers,
      POST: handlers,
    },
  },
});
