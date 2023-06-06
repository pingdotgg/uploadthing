import { lookup } from "@uploadthing/mime-types";

import type { FileData } from "../uploadthing/src/internal/types";
import type { AllowedFileType } from "./file-types";
import type {
  ExpandedRouteConfig,
  FileRouterInputConfig,
  FileSize,
} from "./types";

function isRouteArray(
  routeConfig: FileRouterInputConfig,
): routeConfig is AllowedFileType[] {
  return Array.isArray(routeConfig);
}

export const getDefaultSizeForType = (fileType: AllowedFileType): FileSize => {
  if (fileType === "image") return "4MB";
  if (fileType === "video") return "16MB";
  if (fileType === "audio") return "8MB";
  if (fileType === "blob") return "8MB";
  if (fileType === "pdf") return "4MB";
  if (fileType === "text") return "64KB";

  return "4MB";
};

/**
 * This function takes in the user's input and "upscales" it to a full config
 *
 * Example:
 * ```ts
 * ["image"] => { image: { maxFileSize: "4MB", limit: 1 } }
 * ```
 */
export const fillInputRouteConfig = (
  routeConfig: FileRouterInputConfig,
): ExpandedRouteConfig => {
  // If array, apply defaults
  if (isRouteArray(routeConfig)) {
    return routeConfig.reduce((acc, fileType) => {
      acc[fileType] = {
        // Apply defaults
        maxFileSize: getDefaultSizeForType(fileType),
        maxFileCount: 1,
      };
      return acc;
    }, {} as ExpandedRouteConfig);
  }

  // Backfill defaults onto config
  const newConfig: ExpandedRouteConfig = {};
  (Object.keys(routeConfig) as AllowedFileType[]).forEach((key) => {
    const value = routeConfig[key];
    if (!value) throw new Error("Invalid config during fill");

    const defaultValues = {
      maxFileSize: getDefaultSizeForType(key),
      maxFileCount: 1,
    };

    newConfig[key] = { ...defaultValues, ...value };
  }, {} as ExpandedRouteConfig);

  return newConfig;
};

export const getTypeFromFileName = (
  fileName: string,
  allowedTypes: AllowedFileType[],
) => {
  const mimeType = lookup(fileName);
  if (!mimeType) {
    throw new Error(
      `Could not determine type for ${fileName}, presigned URL generation failed`,
    );
  }

  const type = mimeType.split("/")[0] as AllowedFileType;

  if (!allowedTypes.includes(type)) {
    // Blob is a catch-all for any file type not explicitly supported
    if (allowedTypes.includes("blob")) {
      return "blob";
    } else {
      throw new Error(`File type ${type} not allowed for ${fileName}`);
    }
  }

  return type;
};

export const generateUploadThingURL = (path: `/${string}`) => {
  const host = process.env.CUSTOM_INFRA_URL ?? "https://uploadthing.com";
  return `${host}${path}`;
};

export const withExponentialBackoff = async <T>(
  doTheThing: () => Promise<T | null>,
  MAXIMUM_BACKOFF_MS = 64 * 1000,
  MAX_RETRIES = 20,
): Promise<T | null> => {
  let tries = 0;
  let backoffMs = 500;
  let backoffFuzzMs = 0;

  let result = null;
  while (tries <= MAX_RETRIES) {
    result = await doTheThing();
    if (result !== null) return result;

    tries += 1;
    backoffMs = Math.min(MAXIMUM_BACKOFF_MS, backoffMs * 2);
    backoffFuzzMs = Math.floor(Math.random() * 500);

    if (tries > 3) {
      console.error(
        `[UT] Call unsuccessful after ${tries} tries. Retrying in ${Math.floor(
          backoffMs / 1000,
        )} seconds...`,
      );
    }

    await new Promise((r) => setTimeout(r, backoffMs + backoffFuzzMs));
  }

  return null;
};

export const pollForFileData = async (
  fileKey: string,
  callback?: (json: any) => Promise<any>,
) => {
  const queryUrl = generateUploadThingURL(`/api/pollUpload/${fileKey}`);

  return withExponentialBackoff(async () => {
    const res = await fetch(queryUrl);
    const json = (await res.json()) as
      | { status: "done"; fileData: FileData }
      | { status: "something else" };

    if (json.status !== "done") return null;

    await callback?.(json);
  });
};

export const GET_DEFAULT_URL = () => {
  /**
   * Use VERCEL_URL as the default callbackUrl if it's set
   * they don't set the protocol, so we need to add it
   * User can override this with the UPLOADTHING_URL env var,
   * if they do, they should include the protocol
   *
   * The pathname must be /api/uploadthing
   * since we call that via webhook, so the user
   * should not override that. Just the protocol and host
   */
  const vcurl = process.env.VERCEL_URL;
  if (vcurl) return `https://${vcurl}/api/uploadthing`; // SSR should use vercel url
  const uturl = process.env.UPLOADTHING_URL;
  if (uturl) return `${uturl}/api/uploadthing`;

  return `http://localhost:${process.env.PORT ?? 3000}/api/uploadthing`; // dev SSR should use localhost
};
