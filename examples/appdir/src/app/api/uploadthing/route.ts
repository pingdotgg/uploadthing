import { createNextRouteHandler } from "uploadthing/next";

import { uploadRouter } from "~/server/uploadthing";

export const runtime = "edge";

export const { GET, POST } = createNextRouteHandler({
  router: uploadRouter,
  errorFormatter: (error) => {
    return {
      message: error.message,
      foo: "my custom field",
      // date: new Date(), // invalid json - should type-error
    };
  },
});
