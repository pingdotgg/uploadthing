import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const uploadRouter = {
  withMdwr: f
    .fileTypes(["image"])
    .fileCount(2, "max")
    .maxSize("16MB")
    .middleware(async (req) => {
      const h = req.headers.get("someProperty");

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

  withoutMdwr: f
    .maxSize("64MB")
    .fileCount(2, "max")
    .fileTypes(["image"])
    .middleware(async () => {
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
