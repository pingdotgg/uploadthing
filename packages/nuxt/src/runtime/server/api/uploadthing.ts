import { uploadRouter } from "#uploadthing-router";
import { defineEventHandler } from "h3";

import { createH3EventHandler } from "uploadthing/h3";

export default defineEventHandler(
  createH3EventHandler({ router: uploadRouter }),
);
