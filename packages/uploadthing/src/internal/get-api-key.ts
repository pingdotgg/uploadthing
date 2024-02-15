import { process } from "std-env";

export function getApiKey(apiKey?: string) {
  if (apiKey) return apiKey;
  if (process.env.UPLOADTHING_SECRET) return process.env.UPLOADTHING_SECRET;
  return undefined;
}
