import type { Handle } from "@sveltejs/kit";
import {
  PORT,
  UPLOADTHING_APP_ID,
  UPLOADTHING_SECRET,
} from "$env/static/private";
import { uploadRouter } from "$lib/server/uploadthing";

import { createUploadthingHandle } from "uploadthing/sveltekit";

export const handle: Handle = createUploadthingHandle({
  router: uploadRouter,
  config: {
    callbackUrl: `http://localhost:${PORT ?? 5173}/api/uploadthing`,
    uploadthingSecret: UPLOADTHING_SECRET,
    uploadthingId: UPLOADTHING_APP_ID,
  },
});
