import { process } from "std-env";

import { UploadThingError } from "@uploadthing/shared";

export function getApiKey(apiKey?: string) {
  if (apiKey) return apiKey;
  if (process.env.UPLOADTHING_SECRET) return process.env.UPLOADTHING_SECRET;
  return undefined;
}

export function getApiKeyOrThrow(apiKey?: string) {
  const key = getApiKey(apiKey);
  if (key) return key;

  throw new UploadThingError({
    code: "MISSING_ENV",
    message: "Missing `UPLOADTHING_SECRET` env variable.",
  });
}
