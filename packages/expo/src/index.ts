import Constants from "expo-constants";

import { generateReactHelpers } from "@uploadthing/react/native";
import type * as _TS_FIND_ME_1 from "@uploadthing/shared";
import type { FileRouter } from "uploadthing/internal/types";

import {
  GENERATE_useDocumentUploader,
  GENERATE_useImageUploader,
} from "./hooks";

export interface GenerateTypedHelpersOptions {
  /**
   * URL to the UploadThing API endpoint
   * @example "/api/uploadthing"
   * @example "https://www.example.com/api/uploadthing"
   *
   * If relative, host will be inferred from either the `EXPO_PUBLIC_SERVER_ORIGIN` environment variable or `ExpoConstants.hostUri`
   *
   * @default (process.env.EXPO_PUBLIC_SERVER_ORIGIN ?? ExpoConstants.debuggerHost) + "/api/uploadthing"
   */
  url?: URL | string;
}

export const generateReactNativeHelpers = <TRouter extends FileRouter>(
  initOpts?: GenerateTypedHelpersOptions,
) => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  let url: URL;
  try {
    url = new URL(
      initOpts?.url ?? "/api/uploadthing",
      process.env.EXPO_PUBLIC_SERVER_ORIGIN ?? `http://${debuggerHost}`,
    );
    console.log("resolved url", url);
  } catch (e) {
    throw new Error(
      `Failed to resolve URL from ${initOpts?.url?.toString()} and ${process.env.EXPO_PUBLIC_SERVER_ORIGIN} or ${debuggerHost}`,
    );
  }

  const vanillaHelpers = generateReactHelpers<TRouter>({
    ...initOpts,
    url,
  });
  const useImageUploader = GENERATE_useImageUploader<TRouter>({ url });
  const useDocumentUploader = GENERATE_useDocumentUploader<TRouter>({ url });

  return { ...vanillaHelpers, useImageUploader, useDocumentUploader };
};
