// In a real Convex app, you'd create this file at `convex/http.ts` to set
// up HTTP routes for UploadThing.

import { httpRouter } from "convex/server";

import {
  addUploadthingRoutes,
  createUploadthing,
  FileRouter,
} from "uploadthing/convex";

// In a real app, you can wire up `createUploadthing` to your Convex
// schema for increased type safety.
// ```ts
// import schema from "./schema";
// const f = createUploadthing({ schema })
// ```
const f = createUploadthing();

const router = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async ({ event }) => {
      const identity = await event.auth.getUserIdentity();
      return { userId: identity?.subject ?? "nothing" };
    })
    .onUploadComplete(({ metadata, event }) => {
      console.log("Upload complete!", metadata);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

const http = httpRouter();
addUploadthingRoutes(http, { router });
export default http;
