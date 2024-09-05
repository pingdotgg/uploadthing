import * as Micro from "effect/Micro";
import { process } from "std-env";

import { lookup } from "@uploadthing/mime-types";

import type { AllowedFileType } from "./file-types";
import {
  InvalidFileSizeError,
  InvalidFileTypeError,
  InvalidRouteConfigError,
  InvalidURLError,
  UnknownFileTypeError,
} from "./tagged-errors";
import type {
  ContentDisposition,
  ExpandedRouteConfig,
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
 * Additionally, it replaces numbers with "safe" equivalents
 *
 * Example:
 * ```ts
 * ["image"] => { image: { maxFileSize: "4MB", limit: 1 } }
 * ```
 */

export const fillInputRouteConfig = (
  routeConfig: FileRouterInputConfig,
): Micro.Micro<ExpandedRouteConfig, InvalidRouteConfigError> => {
  // If array, apply defaults
  if (isRouteArray(routeConfig)) {
    return Micro.succeed(
      routeConfig.reduce<ExpandedRouteConfig>((acc, fileType) => {
        acc[fileType] = {
          // Apply defaults
          maxFileSize: getDefaultSizeForType(fileType),
          maxFileCount: 1,
          minFileCount: 1,
          contentDisposition: "inline" as const,
        };
        return acc;
      }, {}),
    );
  }

  // Backfill defaults onto config
  const newConfig: ExpandedRouteConfig = {};
  for (const key of objectKeys(routeConfig)) {
    const value = routeConfig[key];
    if (!value) return Micro.fail(new InvalidRouteConfigError(key));

    const defaultValues = {
      maxFileSize: getDefaultSizeForType(key),
      maxFileCount: 1,
      minFileCount: 1,
      contentDisposition: "inline" as const,
    };

    newConfig[key] = { ...defaultValues, ...value };
  }

  // we know that the config is valid, so we can stringify it and parse it back
  // this allows us to replace numbers with "safe" equivalents
  return Micro.succeed(
    JSON.parse(
      JSON.stringify(newConfig, safeNumberReplacer),
    ) as ExpandedRouteConfig,
  );
};

export const getTypeFromFileName = (
  fileName: string,
  allowedTypes: FileRouterInputKey[],
): Micro.Micro<
  FileRouterInputKey,
  UnknownFileTypeError | InvalidFileTypeError
> => {
  const mimeType = lookup(fileName);
  if (!mimeType) {
    if (allowedTypes.includes("blob")) return Micro.succeed("blob");
    return Micro.fail(new UnknownFileTypeError(fileName));
  }

  // If the user has specified a specific mime type, use that
  if (allowedTypes.some((type) => type.includes("/"))) {
    if (allowedTypes.includes(mimeType)) {
      return Micro.succeed(mimeType);
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
      return Micro.succeed("blob");
    } else {
      return Micro.fail(new InvalidFileTypeError(type, fileName));
    }
  }

  return Micro.succeed(type);
};

export function generateUploadThingURL(path: `/${string}`) {
  let host = "https://api.uploadthing.com";
  if (process.env.CUSTOM_INFRA_URL) {
    host = process.env.CUSTOM_INFRA_URL;
  }
  return `${host}${path}`;
}

export const FILESIZE_UNITS = ["B", "KB", "MB", "GB"] as const;
export type FileSizeUnit = (typeof FILESIZE_UNITS)[number];
export const fileSizeToBytes = (
  fileSize: FileSize,
): Micro.Micro<number, InvalidFileSizeError> => {
  const regex = new RegExp(
    `^(\\d+)(\\.\\d+)?\\s*(${FILESIZE_UNITS.join("|")})$`,
    "i",
  );

  // make sure the string is in the format of 123KB
  const match = fileSize.match(regex);
  if (!match) {
    return Micro.fail(new InvalidFileSizeError(fileSize));
  }

  const sizeValue = parseFloat(match[1]);
  const sizeUnit = match[3].toUpperCase() as FileSizeUnit;
  const bytes = sizeValue * Math.pow(1024, FILESIZE_UNITS.indexOf(sizeUnit));
  return Micro.succeed(Math.floor(bytes));
};

/**
 * Converts a file size in bytes to a human readable string, uses 1000 as the base
 * @example `bytesToFileSize(2500)` => `2.5MB`
 * @public
 */
export const bytesToFileSize = (bytes: number) => {
  if (bytes === 0 || bytes === -1) {
    return "0B";
  }

  const i = Math.floor(Math.log(bytes) / Math.log(1000));
  return `${(bytes / Math.pow(1000, i)).toFixed(2)}${FILESIZE_UNITS[i]}`;
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

export const getFullApiUrl = (
  maybeUrl?: string,
): Micro.Micro<URL, InvalidURLError> =>
  Micro.gen(function* () {
    const base = (() => {
      if (typeof window !== "undefined") return window.location.origin;
      if (process.env?.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
      return "http://localhost:3000";
    })();

    const url = yield* Micro.try({
      try: () => new URL(maybeUrl ?? "/api/uploadthing", base),
      catch: () => new InvalidURLError(maybeUrl ?? "/api/uploadthing"),
    });

    if (url.pathname === "/") {
      url.pathname = "/api/uploadthing";
    }
    return url;
  });

/*
 * Returns a full URL to the dev's uploadthing endpoint
 * Can take either an origin, or a pathname, or a full URL
 * and will return the "closest" url matching the default
 * `<VERCEL_URL || localhost>/api/uploadthing`
 */
export const resolveMaybeUrlArg = (maybeUrl: string | URL | undefined): URL => {
  return maybeUrl instanceof URL
    ? maybeUrl
    : Micro.runSync(getFullApiUrl(maybeUrl));
};

/**
 * Replacer for JSON.stringify that will replace numbers that cannot be
 * serialized to JSON with "reasonable equivalents".
 *
 * Infinity and -Infinity are replaced by MAX_SAFE_INTEGER and MIN_SAFE_INTEGER
 * NaN is replaced by 0
 *
 */
export const safeNumberReplacer = (_: string, value: unknown) => {
  if (typeof value !== "number") return value;
  if (
    Number.isSafeInteger(value) ||
    (value <= Number.MAX_SAFE_INTEGER && value >= Number.MIN_SAFE_INTEGER)
  ) {
    return value;
  }
  if (value === Infinity) return Number.MAX_SAFE_INTEGER;
  if (value === -Infinity) return Number.MIN_SAFE_INTEGER;
  if (Number.isNaN(value)) return 0;
};
