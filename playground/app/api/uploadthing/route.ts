import { revalidateTag } from "next/cache";
import { z } from "zod";

import {
  createRouteHandler,
  createUploadthing,
  FileRouter,
  UTRegion,
} from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { CACHE_TAGS } from "../../../lib/const";
import { getSession } from "../../../lib/data";

const fileRoute = createUploadthing();

export const uploadRouter = {
  anyPrivate: fileRoute({
    blob: { maxFileSize: "256MB", maxFileCount: 10, acl: "public-read" },
  })
    .input(z.object({}))
    .middleware(async (opts) => {
      const session = await getSession();
      if (!session) {
        throw new UploadThingError("Unauthorized");
      }

      console.log("middleware ::", session.sub, opts.input);

      const region = (
        {
          AF: "fra1",
          AN: "sea1",
          AS: "bom1",
          EU: "fra1",
          NA: "sea1",
          OC: "sea1",
          SA: "sea1",
        } as const
      )[opts.req.headers.get("x-vercel-ip-continent")?.toUpperCase() ?? "US"]!;

      return { [UTRegion]: region };
    })
    .onUploadComplete(async (opts) => {
      console.log("Upload complete", opts.file);
      revalidateTag(CACHE_TAGS.LIST_FILES);
    }),

  anyPublic: fileRoute({
    blob: { maxFileSize: "256MB", maxFileCount: 10, acl: "public-read" },
  })
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

  images: fileRoute(
    { image: { maxFileSize: "256MB", maxFileCount: 10, acl: "public-read" } },
    { awaitServerData: false },
  )
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
