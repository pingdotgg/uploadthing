import { ourFileRouter } from "./core";
import { createNextRouteHandler } from "uploadthing/next";

export const { GET, POST } = createNextRouteHandler({
  router: ourFileRouter,
});
