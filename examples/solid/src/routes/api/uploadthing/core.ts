import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

const auth = (req: Request) => Promise.resolve({ id: "fakeId" }); // Fake auth function

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  withMdwr: f({
    image: {
      maxFileCount: 2,
      maxFileSize: "1MB",
    },
  })
    .middleware(async (req) => {
      const h = req.headers.get("someProperty");
      const authed = await auth(req);

      return {
        someProperty: h,
        userId: authed.id,
      };
    })
    .onUploadComplete(({ metadata, file }) => {
      console.log("uploaded with the following metadata:", metadata);
      metadata.someProperty;
      //       ^?
      metadata.userId;
      //       ^?

      console.log("files successfully uploaded:", file);
      file;
      // ^?
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
