import * as z from "zod";

import { createUploadthing } from "uploadthing/nuxt";
import type { FileRouter } from "uploadthing/nuxt";

const f = createUploadthing();

export const uploadRouter = {
  videoAndImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 4,
    },
    video: {
      maxFileSize: "16MB",
    },
  })
    .middleware(() => ({}))
    .onUploadComplete((data) => {
      console.log("upload completed", data);
    }),

  withInput: f(["image"])
    .input(
      z.object({
        foo: z.string().min(5),
      }),
    )
    .middleware((opts) => {
      console.log("input", opts.input);
      return {};
    })
    .onUploadComplete((data) => {
      console.log("upload completed", data);
    }),

  withMdwr: f({
    image: {
      maxFileCount: 2,
      maxFileSize: "1MB",
    },
  })
    .middleware(({ req }) => {
      const h = req.headers["someProperty"];

      if (!h) throw new Error("someProperty is required");

      return {
        someProperty: h,
        otherProperty: "hello" as const,
      };
    })
    .onUploadComplete(({ metadata, file }) => {
      console.log("uploaded with the following metadata:", metadata);
      metadata.someProperty;
      //       ^?
      metadata.otherProperty;
      //       ^?

      console.log("files successfully uploaded:", file);
      file;
      // ^?
    }),

  withoutMdwr: f({
    image: {
      maxFileCount: 2,
      maxFileSize: "16MB",
    },
  })
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
