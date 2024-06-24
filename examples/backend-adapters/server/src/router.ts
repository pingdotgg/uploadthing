/**
 * @remarks Note that this router uses the `/server` entrypoint
 * but we re-use it even for adapters like Express, Fastify and H3.
 * The middleware options will therefore not be accurate, but
 * for this example we don't care and don't want to duplicate
 * the router for every adapter.
 *
 * In your app, import using the correct entrypoint for your adapter.
 * @see https://docs.uploadthing.com/api-reference/server#createuploadthing
 */
import { createUploadthing, type FileRouter } from "uploadthing/server";

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

/**
 * This is your Uploadthing file router. For more information:
 * @see https://docs.uploadthing.com/api-reference/server#file-routes
 */
export const uploadRouter = {
  videoAndImage: f(
    {
      image: {
        maxFileSize: "256MB",
        maxFileCount: 4,
      },
      video: {
        maxFileSize: "16MB",
      },
      blob: { maxFileSize: "8GB", maxFileCount: 10 },
    },
    {
      awaitServerData: true,
      presignedURLTTL: 10,
      // Each file will get a unique key (default)
      getFileHashParts: (file) => [file.name, Date.now()],

      // Uploading the same file will yield the same key
      // getFileHashParts: (file) => [file.name],
    },
  )
    .middleware(({ files }) => {
      return {
        uploadedBy: "fake-user-id-213",
      };
    })
    .onUploadComplete(async (data) => {
      console.log("upload completed", data);
      // await new Promise((r) => setTimeout(r, 15000));
      return { foo: "bar", baz: "qux" };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
