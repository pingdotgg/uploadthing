import { createNuxtRouteHandler } from "uploadthing/nuxt";

import { uploadRouter } from "../uploadthing";

export default createNuxtRouteHandler({
  router: uploadRouter,
});
