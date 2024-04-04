import { process } from "std-env";

import { lookup } from "@uploadthing/mime-types";

import type { AllowedFileType } from "./file-types";
import type {
  ContentDisposition,
  ExpandedRouteConfig,
  FetchEsque,
  FileRouterInputConfig,
  FileRouterInputKey,
  FileSize,
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
        minFileCount: 1,
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
      minFileCount: 1,
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
  if (process.env.CUSTOM_INFRA_URL) {
    host = process.env.CUSTOM_INFRA_URL;
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
    fetch: FetchEsque;
  },
  callback?: (json: any) => Promise<any>,
) {
  return withExponentialBackoff(async () => {
    const res = await opts.fetch(opts.url, {
      headers: {
        ...(opts.apiKey && { "x-uploadthing-api-key": opts.apiKey }),
        "x-uploadthing-version": opts.sdkVersion,
      },
    });
    const maybeJson = await safeParseJSON<
      { status: "done"; fileData?: any } | { status: "something else" }
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
  input: string | ResponseEsque | Request,
): Promise<T | Error> {
  if (typeof input === "string") {
    try {
      return JSON.parse(input) as T;
    } catch (err) {
      console.error(`Error parsing JSON, got '${input}'`);
      return new Error(`Error parsing JSON, got '${input}'`);
    }
  }

  const text = await input.text();
  try {
    return JSON.parse(text ?? "null") as T;
  } catch (err) {
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

export function asArray<T>(val: T | T[]): T[] {
  return Array.isArray(val) ? val : [val];
}

/** construct content-disposition header */
export function contentDisposition(
  contentDisposition: ContentDisposition,
  fileName: string,
) {
  return [
    contentDisposition,
    `filename="${encodeURI(fileName)}"`,
    `filename*=UTF-8''${encodeURI(fileName)}`,
  ].join("; ");
}

export function semverLite(required: string, toCheck: string) {
  // Pull out numbers from strings like `6.0.0`, `^6.4`, `~6.4.0`
  const semverRegex = /(\d+)\.?(\d+)?\.?(\d+)?/;
  const requiredMatch = required.match(semverRegex);
  if (!requiredMatch?.[0]) {
    throw new Error(`Invalid semver requirement: ${required}`);
  }
  const toCheckMatch = toCheck.match(semverRegex);
  if (!toCheckMatch?.[0]) {
    throw new Error(`Invalid semver to check: ${toCheck}`);
  }

  const [_1, rMajor, rMinor, rPatch] = requiredMatch;
  const [_2, cMajor, cMinor, cPatch] = toCheckMatch;

  if (required.startsWith("^")) {
    // Major must be equal, minor must be greater or equal
    if (rMajor !== cMajor) return false;
    if (rMinor > cMinor) return false;
    return true;
  }

  if (required.startsWith("~")) {
    // Major must be equal, minor must be equal
    if (rMajor !== cMajor) return false;
    if (rMinor !== cMinor) return false;
    return true;
  }

  // Exact match
  return rMajor === cMajor && rMinor === cMinor && rPatch === cPatch;
}

function getFullApiUrl(maybeUrl?: string): URL {
  const base = (() => {
    if (typeof window !== "undefined") return window.location.origin;
    if (process.env?.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  })();

  try {
    const url = new URL(maybeUrl ?? "/api/uploadthing", base);
    if (url.pathname === "/") {
      url.pathname = "/api/uploadthing";
    }
    return url;
  } catch (err) {
    throw new Error(
      `Failed to parse '${maybeUrl}' as a URL. Make sure it's a valid URL or path`,
    );
  }
}

/*
 * Returns a full URL to the dev's uploadthing endpoint
 * Can take either an origin, or a pathname, or a full URL
 * and will return the "closest" url matching the default
 * `<VERCEL_URL || localhost>/api/uploadthing`
 */
export function resolveMaybeUrlArg(maybeUrl: string | URL | undefined) {
  return maybeUrl instanceof URL ? maybeUrl : getFullApiUrl(maybeUrl);
}
