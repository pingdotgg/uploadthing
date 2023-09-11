import type { Handle } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { uploadRouter } from "$lib/server/uploadthing";

import { createUploadthingHandle } from "uploadthing/sveltekit";

export const handle: Handle = createUploadthingHandle({
  router: uploadRouter,
  config: {
    callbackUrl: `http://localhost:${env.PORT ?? 5173}/api/uploadthing`,
    uploadthingSecret: env.UPLOADTHING_SECRET,
    uploadthingId: env.UPLOADTHING_APP_ID,
  },
});
