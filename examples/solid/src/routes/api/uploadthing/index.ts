import { ourFileRouter } from "./core";
import { createServerHandler } from "uploadthing/server";

export const { GET, POST } = createServerHandler({
  router: ourFileRouter,
});
