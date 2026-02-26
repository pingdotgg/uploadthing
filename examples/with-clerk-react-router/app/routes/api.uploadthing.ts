import { getAuth } from "@clerk/react-router/ssr.server";
import { LoaderFunctionArgs } from "react-router";

import {
  createRouteHandler,
  createUploadthing,
} from "uploadthing/react-router";
import { UploadThingError } from "uploadthing/server";
import { FileRouter } from "uploadthing/types";

const f = createUploadthing();

export const uploadRouter = {
  videoAndImage: f({
    image: { maxFileSize: "4MB" },
    video: { maxFileSize: "16MB" },
  })
    .middleware(async ({ event }) => {
      // You should perform authentication here
      const authObject = await getAuth(event as LoaderFunctionArgs);
      console.log({ authObject });

      if (!authObject.userId) {
        throw new UploadThingError("You need to be signed in to upload");
      }

      return { userId: authObject.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.ufsUrl);
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

const handler = createRouteHandler({ router: uploadRouter });

export const loader = handler.loader;
export const action = handler.action;
