import { getRouterManifest } from "@tanstack/start/router-manifest";
import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/start/server";

import { extractRouterConfig } from "uploadthing/server";

import { createRouter } from "./router";
import { uploadRouter } from "./server/uploadthing";

globalThis.__UPLOADTHING = extractRouterConfig(uploadRouter);

export default createStartHandler({
  createRouter,
  getRouterManifest,
})(defaultStreamHandler);
