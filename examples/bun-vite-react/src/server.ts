import { createServerHandler, createUploadthing } from "uploadthing/server";
import type { FileRouter } from "uploadthing/server";

const f = createUploadthing();

/**
 * This is your Uploadthing file router. For more information:
 * @see https://docs.uploadthing.com/api-reference/server#file-routes
 */

const uploadRouter = {
  videoAndImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 4,
    },
    video: {
      maxFileSize: "16MB",
    },
  })
    .middleware(({ req }) => {
      // Check some condition based on the incoming requrest
      req;
      //^?
      // if (!req.headers.get("x-some-header")) {
      //   throw new Error("x-some-header is required");
      // }

      // Return some metadata to be stored with the file
      return { foo: "bar" as const };
    })
    .onUploadComplete(({ file, metadata }) => {
      metadata;
      // ^?
      console.log("upload completed", file);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;

const server = Bun.serve({
  port: 5174,
  fetch(request) {
    let reqPath = new URL(request.url).pathname;

    if (reqPath === "/api/uploadthing") {
      const handlers = createServerHandler({
        router: uploadRouter,
      });

      if (request.method === "GET") {
        return handlers.GET({ request });
      } else if (request.method === "POST") {
        return handlers.POST({ request });
      }
    }

    return new Response("No route matches that path", {
      status: 404,
    });
  },
});

console.log(`Listening on http://localhost:${server.port}`);
