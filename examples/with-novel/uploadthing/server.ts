import { createUploadthing, FileRouter } from "uploadthing/next";

const f = createUploadthing({
  /**
   * Log out more information about the error, but don't return it to the client
   * @see https://docs.uploadthing.com/errors#error-formatting
   */
  errorFormatter: (err) => {
    console.log("Error uploading file", err.message);
    console.log("  - Above error caused by:", err.cause);

    return { message: err.message };
  },
});

export const uploadRouter = {
  imageUploader: f({ image: { maxFileSize: "1MB", maxFileCount: 4 } })
    .middleware(() => {
      return {};
    })
    .onUploadComplete(({ file }) => {
      console.log("upload completed", file);
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
