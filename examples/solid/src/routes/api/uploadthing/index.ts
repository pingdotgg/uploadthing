import { createServerHandler } from "@uploadthing/solid";
import { ourFileRouter } from "./core";

export const { GET, POST } = createServerHandler({
  router: ourFileRouter,
});
