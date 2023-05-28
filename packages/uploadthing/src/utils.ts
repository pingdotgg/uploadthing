import { lookup } from "mime-types";

import type {
  AllowedFileType,
  ExpandedRouteConfig,
  FileRouterInputConfig,
  FileSize,
} from "./types";

function isRouteArray(
  routeConfig: FileRouterInputConfig,
): routeConfig is AllowedFileType[] {
  return Array.isArray(routeConfig);
}

const getDefaultSizeForType = (fileType: AllowedFileType): FileSize => {
  if (fileType === "image") return "4MB";
  if (fileType === "video") return "16MB";
  if (fileType === "audio") return "8MB";
  if (fileType === "blob") return "8MB";

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
