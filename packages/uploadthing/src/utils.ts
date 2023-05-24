import {
  FileRouterInputConfig,
  AllowedFileType,
  NestedFileRouterConfig,
} from "./types";

function isRouteArray(
  routeConfig: FileRouterInputConfig
): routeConfig is AllowedFileType[] {
  return Array.isArray(routeConfig);
}

export const convertRouteArrayToRecord = (
  routeConfig: FileRouterInputConfig
): NestedFileRouterConfig => {
  // If array, apply defaults
  if (isRouteArray(routeConfig)) {
    return routeConfig.reduce((acc, fileType) => {
      acc[fileType] = {
        // Apply defaults
        maxFileSize: "4MB",
      };
      return acc;
    }, {} as NestedFileRouterConfig);
  }

  return routeConfig;
};
