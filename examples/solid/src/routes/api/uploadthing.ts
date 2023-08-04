import { createServerHandler } from 'uploadthing/server';

import { uploadRouter } from '~/server/uploadthing.ts';

export const { GET, POST } = createServerHandler({
  router: uploadRouter,
  config: {
    callbackUrl: `http://localhost:${process.env.PORT ?? 9898}/api/uploadthing`,
  },
});
