import { createAstroRouteHandler } from "uploadthing/astro";

import { uploadRouter } from "../../uploadthing";

const { get, post } = createAstroRouteHandler({
  router: uploadRouter,
});

export { get, post };

export const prerender = false;
