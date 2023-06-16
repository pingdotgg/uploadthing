import { getServerSession } from "next-auth";

import { createUploadthing } from "uploadthing/next-legacy";
import type { FileRouter } from "uploadthing/next-legacy";

import { options } from "~/pages/api/auth/[...nextauth]";

const f = createUploadthing();

export const uploadRouter = {
  withMdwr: f(["image"])
    .middleware(async ({ req, res }) => {
      const auth = await getServerSession(req, res, options);

      console.log("auth:", auth);

      return {
        userEmail: auth?.user?.email,
        otherProperty: "hello" as const,
      };
    })
    .onUploadComplete(({ metadata, file }) => {
      console.log("uploaded with the following metadata:", metadata);

      console.log(
        `${metadata.userEmail ?? ""} successfully uploaded file:`,
        file,
      );
      file;
      // ^?
    }),

  withoutMdwr: f(["image"])
    .middleware(() => {
      return { testMetadata: "lol" };
    })
    .onUploadComplete(({ metadata, file }) => {
      console.log("uploaded with the following metadata:", metadata);
      metadata;
      // ^?

      console.log("files successfully uploaded:", file);
      file;
      // ^?
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
