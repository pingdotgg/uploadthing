import { createUploadthing, type FileRouter } from "uploadthing/next";
const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f
    // Set permissions and file types for this FileRoute
    .fileTypes(["image"])
    .maxSize("1GB")
    .onUploadComplete(({ file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("[SERVER] Image upload complete: file url", file.url);
    }),
  blobUploader: f.fileTypes(["blob"]).maxSize("1GB").onUploadComplete(({ file }) => {
    console.log("[SERVER] Blob upload complete: file url", file.url);
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
