import { process } from "std-env";

import { UploadThingError } from "@uploadthing/shared";

export const getApiKey = (apiKey?: string) => {
  if (apiKey) return apiKey;
  if (process.env.UPLOADTHING_SECRET) return process.env.UPLOADTHING_SECRET;
  return undefined;
};

export const getAppId = (appId?: string) => {
  if (appId) return appId;
  if (process.env.UPLOADTHING_APP_ID) return process.env.UPLOADTHING_APP_ID;
  return undefined;
};

export const getApiKeyOrThrow = (apiKey?: string) => {
  const key = getApiKey(apiKey);
  if (!key?.startsWith("sk_")) {
    throw new UploadThingError({
      code: "MISSING_ENV",
      message: "Missing or invalid API key. API keys must start with `sk_`.",
    });
  }
  return key;
};
