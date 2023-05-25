import {
  FileRouterInputConfig,
  AllowedFileType,
  NestedFileRouterConfig,
  FileSize,
} from "./types";

function isRouteArray(
  routeConfig: FileRouterInputConfig
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
  routeConfig: FileRouterInputConfig
): NestedFileRouterConfig => {
  // If array, apply defaults
  if (isRouteArray(routeConfig)) {
    return routeConfig.reduce((acc, fileType) => {
      acc[fileType] = {
        // Apply defaults
        maxFileSize: getDefaultSizeForType(fileType),
        maxFileCount: 1,
      };
      return acc;
    }, {} as NestedFileRouterConfig);
  }

  // Backfill defaults onto config
  const newConfig: NestedFileRouterConfig = {};
  (Object.keys(routeConfig) as AllowedFileType[]).forEach((key) => {
    const value = routeConfig[key];
    if (!value) throw new Error("Invalid config");

    const defaultValues = {
      maxFileSize: getDefaultSizeForType(key),
      maxFileCount: 1,
    };

    newConfig[key] = { ...defaultValues, ...value };
  }, {} as NestedFileRouterConfig);

  return newConfig;
};
