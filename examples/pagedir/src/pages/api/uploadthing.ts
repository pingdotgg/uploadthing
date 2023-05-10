// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createNextPageApiHandler } from "uploadthing/next-legacy";
import { uploadRouter } from "~/server/uploadthing/router";

const handler = createNextPageApiHandler({
  router: uploadRouter,
});

export default handler;
