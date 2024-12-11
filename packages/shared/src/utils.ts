import * as Micro from "effect/Micro";

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
  FileProperties,
  FileRouterInputConfig,
  FileRouterInputKey,
  FileSize,
  Json,
  ResponseEsque,
  RouteConfig,
  Time,
  TimeShort,
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

export function getDefaultRouteConfigValues(
  type: FileRouterInputKey,
): RouteConfig<Record<string, never>> {
  return {
    maxFileSize: getDefaultSizeForType(type),
    maxFileCount: 1,
    minFileCount: 1,
    contentDisposition: "inline" as const,
  };
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
        acc[fileType] = getDefaultRouteConfigValues(fileType);
        return acc;
      }, {}),
    );
  }

  // Backfill defaults onto config
  const newConfig: ExpandedRouteConfig = {};
  for (const key of objectKeys(routeConfig)) {
    const value = routeConfig[key];
    if (!value) return Micro.fail(new InvalidRouteConfigError(key));
    newConfig[key] = { ...getDefaultRouteConfigValues(key), ...value };
  }

  // we know that the config is valid, so we can stringify it and parse it back
  // this allows us to replace numbers with "safe" equivalents
  return Micro.succeed(
    JSON.parse(
      JSON.stringify(newConfig, safeNumberReplacer),
    ) as ExpandedRouteConfig,
  );
};

/**
 * Match the file's type for a given allow list e.g. `image/png => image`
 * Prefers the file's type, then falls back to a extension-based lookup
 */
export const matchFileType = (
  file: FileProperties,
  allowedTypes: FileRouterInputKey[],
): Micro.Micro<
  FileRouterInputKey,
  UnknownFileTypeError | InvalidFileTypeError
> => {
  // Type might be "" if the browser doesn't recognize the mime type
  const mimeType = file.type || lookup(file.name);
  if (!mimeType) {
    if (allowedTypes.includes("blob")) return Micro.succeed("blob");
    return Micro.fail(new UnknownFileTypeError(file.name));
  }

  // If the user has specified a specific mime type, use that
  if (allowedTypes.some((type) => type.includes("/"))) {
    if (allowedTypes.includes(mimeType as FileRouterInputKey)) {
      return Micro.succeed(mimeType as FileRouterInputKey);
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
      return Micro.fail(new InvalidFileTypeError(type, file.name));
    }
  }

  return Micro.succeed(type);
};

export const FILESIZE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;
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

export const bytesToFileSize = (bytes: number) => {
  if (bytes === 0 || bytes === -1) {
    return "0B";
  }

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)}${FILESIZE_UNITS[i]}`;
};

export async function safeParseJSON<T>(
  input: ResponseEsque,
): Promise<T | Error> {
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

export function filterDefinedObjectValues<T>(
  obj: Record<string, T | null | undefined>,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(obj).filter((pair): pair is [string, T] => pair[1] != null),
  );
}

/** construct content-disposition header according to RFC 6266 section 4.1
 * https://www.rfc-editor.org/rfc/rfc6266#section-4.1
 *
 * @example
 * contentDisposition("inline", 'my "special" file,name.pdf');
 * // => "inline; filename="my \"special\" file\,name.pdf"; filename*=UTF-8''my%20%22special%22%20file%2Cname.pdf"
 */
export function contentDisposition(
  contentDisposition: ContentDisposition,
  fileName: string,
) {
  // Encode the filename for the legacy parameter
  const legacyFileName = fileName.replace(/[",\\']/g, "\\$&");

  //UTF-8 encode for the extended parameter (RFC 5987)
  const utf8FileName = encodeURIComponent(fileName)
    .replace(/[')(]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/\*/g, "%2A");

  return [
    contentDisposition,
    `filename="${legacyFileName}"`,
    `filename*=UTF-8''${utf8FileName}`,
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

export function warnIfInvalidPeerDependency(
  pkg: string,
  required: string,
  toCheck: string,
) {
  if (!semverLite(required, toCheck)) {
    console.warn(
      `!!!WARNING::: ${pkg} requires "uploadthing@${required}", but version "${toCheck}" is installed`,
    );
  }
}

export const getRequestUrl = (req: Request) =>
  Micro.gen(function* () {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    const protocol = proto.endsWith(":") ? proto : `${proto}:`;
    const url = yield* Micro.try({
      try: () => new URL(req.url, `${protocol}//${host}`),
      catch: () => new InvalidURLError(req.url),
    });
    url.search = "";
    return url;
  });

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

export function parseTimeToSeconds(time: Time) {
  if (typeof time === "number") return time;

  const match = time.split(/(\d+)/).filter(Boolean);
  const num = Number(match[0]);
  const unit = (match[1] ?? "s").trim().slice(0, 1) as TimeShort;

  const multiplier = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  }[unit];

  return num * multiplier;
}

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

export function noop() {
  // noop
}

export function createIdentityProxy<TObj extends Record<string, unknown>>() {
  return new Proxy(noop, {
    get: (_, prop) => prop,
  }) as unknown as TObj;
}

export function unwrap<T extends Json | PropertyKey, Param extends unknown[]>(
  x: T | ((...args: Param) => T),
  ...args: Param
) {
  return typeof x === "function" ? x(...args) : x;
}
