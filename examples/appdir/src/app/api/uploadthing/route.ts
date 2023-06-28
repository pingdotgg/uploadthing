import { ZodError } from "zod";

import { createNextRouteHandler } from "uploadthing/next";

import { uploadRouter } from "~/server/uploadthing";

export const runtime = "edge";

export const { GET, POST } = createNextRouteHandler({
  router: uploadRouter,

  errorFormatter: (error) => {
    console.log("error", error.cause);
    return {
      message: error.message,
      foo: "my custom field",
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      // date: new Date(), // toggling this should cause type errors since Date is not JSON
    };
  },
});
