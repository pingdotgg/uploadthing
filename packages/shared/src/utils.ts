// TODO: idk if we want to import logger here, think about bundle splitting maybe, not sure if it's a concern
/* eslint-disable no-console */

import { lookup } from "@uploadthing/mime-types";

import type {
  AllowedFileType,
  ExpandedRouteConfig,
  FileData,
  FileRouterInputConfig,
  FileRouterInputKey,
  FileSize,
  RequestLike,
  ResponseEsque,
} from "./types";

export function isRouteArray(
  routeConfig: FileRouterInputConfig,
): routeConfig is FileRouterInputKey[] {
  return Array.isArray(routeConfig);
}

export function getDefaultSizeForType(fileType: FileRouterInputKey): FileSize {
  if (fileType === "image") return "4MB";
  if (fileType === "video") return "16MB";
  if (fileType === "audio") return "8MB";
  if (fileType === "blob") return "8MB";
  if (fileType === "pdf") return "4MB";
  if (fileType === "text") return "64KB";

  return "4MB";
}

/**
 * This function takes in the user's input and "upscales" it to a full config
 *
 * Example:
 * ```ts
 * ["image"] => { image: { maxFileSize: "4MB", limit: 1 } }
 * ```
 */
export function fillInputRouteConfig(
  routeConfig: FileRouterInputConfig,
): ExpandedRouteConfig {
  // If array, apply defaults
  if (isRouteArray(routeConfig)) {
    return routeConfig.reduce<ExpandedRouteConfig>((acc, fileType) => {
      acc[fileType] = {
        // Apply defaults
        maxFileSize: getDefaultSizeForType(fileType),
        maxFileCount: 1,
        contentDisposition: "inline",
      };
      return acc;
    }, {});
  }

  // Backfill defaults onto config
  const newConfig: ExpandedRouteConfig = {};
  const inputKeys = objectKeys(routeConfig);
  inputKeys.forEach((key) => {
    const value = routeConfig[key];
    if (!value) throw new Error("Invalid config during fill");

    const defaultValues = {
      maxFileSize: getDefaultSizeForType(key),
      maxFileCount: 1,
      contentDisposition: "inline" as const,
    };

    newConfig[key] = { ...defaultValues, ...value };
  }, {} as ExpandedRouteConfig);

  return newConfig;
}

export function getTypeFromFileName(
  fileName: string,
  allowedTypes: FileRouterInputKey[],
) {
  const mimeType = lookup(fileName);
  if (!mimeType) {
    if (allowedTypes.includes("blob")) return "blob";
    throw new Error(
      `Could not determine type for ${fileName}, presigned URL generation failed`,
    );
  }

  // If the user has specified a specific mime type, use that
  if (allowedTypes.some((type) => type.includes("/"))) {
    if (allowedTypes.includes(mimeType)) {
      return mimeType;
    }
  }

  // Otherwise, we have a "magic" type eg. "image" or "video"
  const type = (
    mimeType.toLowerCase() === "application/pdf"
      ? "pdf"
      : mimeType.split("/")[0]
  ) as AllowedFileType;

  if (!allowedTypes.includes(type)) {
    // Blob is a catch-all for any file type not explicitly supported
    if (allowedTypes.includes("blob")) {
      return "blob";
    } else {
      throw new Error(`File type ${type} not allowed for ${fileName}`);
    }
  }

  return type;
}

export function generateUploadThingURL(path: `/${string}`) {
  let host = "https://uploadthing.com";

  if (typeof process !== "undefined") {
    host = process.env.CUSTOM_INFRA_URL ?? host;
  } else {
    // @ts-expect-error - import.meta is dumb
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    host = import.meta.env?.CUSTOM_INFRA_URL ?? host;
  }
  return `${host}${path}`;
}

/**
 * RETURN UNDEFINED TO KEEP GOING
 * SO MAKE SURE YOUR FUNCTION RETURNS SOMETHING
 * OTHERWISE IT'S AN IMPLICIT UNDEFINED AND WILL CAUSE
 * AN INFINITE LOOP
 */
export const withExponentialBackoff = async <T>(
  doTheThing: () => Promise<T | undefined>,
  MAXIMUM_BACKOFF_MS = 64 * 1000,
  MAX_RETRIES = 20,
): Promise<T | null> => {
  let tries = 0;
  let backoffMs = 500;
  let backoffFuzzMs = 0;

  let result = undefined;
  while (tries <= MAX_RETRIES) {
    result = await doTheThing();
    if (result !== undefined) return result;

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

export async function pollForFileData(
  opts: {
    url: string;
    // no apikey => no filedata will be returned, just status
    apiKey: string | null;
    sdkVersion: string;
  },
  callback?: (json: any) => Promise<any>,
) {
  return withExponentialBackoff(async () => {
    const res = await fetch(opts.url, {
      headers: {
        ...(opts.apiKey && { "x-uploadthing-api-key": opts.apiKey }),
        "x-uploadthing-version": opts.sdkVersion,
      },
    });
    const maybeJson = await safeParseJSON<
      { status: "done"; fileData?: FileData } | { status: "something else" }
    >(res);

    if (maybeJson instanceof Error) {
      console.error(
        `[UT] Error polling for file data for ${opts.url}: ${maybeJson.message}`,
      );
      return null;
    }

    if (maybeJson.status !== "done") return undefined;
    await callback?.(maybeJson);

    return Symbol("backoff done without response");
  });
}

export const FILESIZE_UNITS = ["B", "KB", "MB", "GB"] as const;
export type FileSizeUnit = (typeof FILESIZE_UNITS)[number];
export const fileSizeToBytes = (input: string) => {
  const regex = new RegExp(
    `^(\\d+)(\\.\\d+)?\\s*(${FILESIZE_UNITS.join("|")})$`,
    "i",
  );
  const match = input.match(regex);

  if (!match) {
    return new Error("Invalid file size format");
  }

  const sizeValue = parseFloat(match[1]);
  const sizeUnit = match[3].toUpperCase() as FileSizeUnit;

  if (!FILESIZE_UNITS.includes(sizeUnit)) {
    throw new Error("Invalid file size unit");
  }
  const bytes = sizeValue * Math.pow(1024, FILESIZE_UNITS.indexOf(sizeUnit));
  return Math.floor(bytes);
};

export async function safeParseJSON<T>(
  input: string | ResponseEsque | RequestLike,
): Promise<T | Error> {
  if (typeof input === "string") {
    try {
      return JSON.parse(input) as T;
    } catch (err) {
      console.error(`Error parsing JSON, got '${input}'`);
      return new Error(`Error parsing JSON, got '${input}'`);
    }
  }

  const clonedRes = input.clone?.();
  try {
    return (await input.json()) as T;
  } catch (err) {
    const text = (await clonedRes?.text()) ?? "unknown";
    console.error(`Error parsing JSON, got '${text}'`);
    return new Error(`Error parsing JSON, got '${text}'`);
  }
}

/** typesafe Object.keys */
export function objectKeys<T extends Record<string, unknown>>(
  obj: T,
): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/** checks if obj is a valid, non-null object */
export function isObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === "object" && obj !== null && !Array.isArray(obj);
}
