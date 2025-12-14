import { revalidateTag } from "next/cache";
import { z } from "zod";

import {
  createRouteHandler,
  createUploadthing,
  experimental_UTRegion,
  FileRouter,
} from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

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

      /**
       * Example on how to select region based on user's location
       */
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

      return { [experimental_UTRegion]: region };
    })
    .onUploadComplete(async (opts) => {
      console.log("Upload complete", opts.file);
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
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  config: {},
});
