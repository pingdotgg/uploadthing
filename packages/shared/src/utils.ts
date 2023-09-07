import { lookup } from "@uploadthing/mime-types";

import type { AllowedFileType } from "./file-types";
import type {
  ExpandedRouteConfig,
  FileData,
  FileRouterInputConfig,
  FileRouterInputKey,
  FileSize,
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
      };
      return acc;
    }, {});
  }

  // Backfill defaults onto config
  const newConfig: ExpandedRouteConfig = {};
  const inputKeys = Object.keys(routeConfig) as FileRouterInputKey[];
  inputKeys.forEach((key) => {
    const value = routeConfig[key];
    if (!value) throw new Error("Invalid config during fill");

    const defaultValues = {
      maxFileSize: getDefaultSizeForType(key),
      maxFileCount: 1,
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
  const host = process.env.CUSTOM_INFRA_URL ?? "https://uploadthing.com";
  return `${host}${path}`;
}

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

export async function pollForFileData(
  fileKey: string,
  callback?: (json: any) => Promise<any>,
) {
  const queryUrl = generateUploadThingURL(`/api/pollUpload/${fileKey}`);

  return withExponentialBackoff(async () => {
    const res = await fetch(queryUrl);
    const json = (await res.json()) as
      | { status: "done"; fileData: FileData }
      | { status: "something else" };

    if (json.status !== "done") return null;

    await callback?.(json);
  });
}

export function getUploadthingUrl() {
  /**
   * The pathname must be /api/uploadthing
   * since we call that via webhook, so the user
   * should not override that. Just the protocol and host
   *
   * User can override the callback url with the UPLOADTHING_URL env var,
   * if they do, they should include the protocol
   */
  const uturl = process.env.UPLOADTHING_URL;
  if (uturl) return `${uturl}/api/uploadthing`;

  /**
   * If the VERCEL_URL is set, we will fall back to that next.
   * They don't set the protocol, however, so we need to add it
   */
  const vcurl = process.env.VERCEL_URL;
  if (vcurl) return `https://${vcurl}/api/uploadthing`; // SSR should use vercel url

  return `http://localhost:${process.env.PORT ?? 3000}/api/uploadthing`; // dev SSR should use localhost
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

// This is absolutely horrendous, but we need some way to resole environment
// variables regardless of build tooling. If you have a better idea, please
// fix this.
export const DANGEROUS__checkEnvironmentVariable = (variable: string) => {
  // We need to check all of the places where environment variables can be set
  // eg process.env, process.env.NEXT_PUBLIC_, import.meta.env, etc.

  // first check if process is defined
  if (typeof process !== "undefined") {
    if (process.env[variable]) return process.env[variable];
    if (process.env[`NEXT_PUBLIC_${variable}`])
      return process.env[`NEXT_PUBLIC_${variable}`];
    if (process.env[`PUBLIC_${variable}`])
      return process.env[`PUBLIC_${variable}`];
  }

  // we havent found it yet, so check import.meta.env

  // @ts-expect-error - whatever
  if (typeof import.meta.env !== "undefined") {
    // @ts-expect-error - whatever
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    if (import.meta.env[variable]) return import.meta.env[variable];

    // @ts-expect-error - whatever
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (import.meta.env[`VITE_${variable}`]) {
      // @ts-expect-error - whatever
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
      return import.meta.env[`VITE_${variable}`];
    }

    // @ts-expect-error - whatever
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (import.meta.env[`ASTRO_${variable}`]) {
      // @ts-expect-error - whatever
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
      return import.meta.env[`ASTRO_${variable}`];
    }

    // @ts-expect-error - whatever
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (import.meta.env[`PUBLIC_${variable}`]) {
      // @ts-expect-error - whatever
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
      return import.meta.env[`PUBLIC_${variable}`];
    }
  }

  // last resort, check window... yolo?
  if (typeof window !== "undefined") {
    // @ts-expect-error - whatever
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (window[variable]) return window[variable];
  }

  // throw an error if we still havent found it
  throw new Error("Could not find environment variable");
};
