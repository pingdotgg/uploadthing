import { revalidateTag } from "next/cache";
import { z } from "zod";

import {
  createRouteHandler,
  createUploadthing,
  FileRouter,
} from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { CACHE_TAGS } from "../../../lib/const";
import { getSession } from "../../../lib/data";

const fileRoute = createUploadthing();

export const uploadRouter = {
  anything: fileRoute({ blob: { maxFileSize: "256MB" } })
    .input(z.object({}))
    .middleware(async (opts) => {
      const session = await getSession();
      if (!session) {
        throw new UploadThingError("Unauthorized");
      }

      console.log("middleware ::", session.sub, opts.input);

      return {};
    })
    .onUploadComplete(async (opts) => {
      console.log("Upload complete", opts.file);
      revalidateTag(CACHE_TAGS.LIST_FILES);
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  config: {},
});
