import Constants from "expo-constants";

import { generateReactHelpers } from "@uploadthing/react/native";
import { warnIfInvalidPeerDependency } from "@uploadthing/shared";
import { version as uploadthingClientVersion } from "uploadthing/client";
import type { FileRouter } from "uploadthing/types";

import { peerDependencies } from "../package.json";
import { GENERATE_useDocumentUploader } from "./document-picker";
import { GENERATE_useImageUploader } from "./image-picker";

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
  warnIfInvalidPeerDependency(
    "@uploadthing/expo",
    peerDependencies.uploadthing,
    uploadthingClientVersion,
  );

  const debuggerHost = Constants.expoConfig?.hostUri;
  let url = new URL("http://localhost:8081/api/uploadthing");
  try {
    url = new URL(
      initOpts?.url ?? "/api/uploadthing",
      typeof window.location !== "undefined"
        ? window.location.origin
        : (process.env.EXPO_PUBLIC_SERVER_ORIGIN ?? `http://${debuggerHost}`),
    );
  } catch (e) {
    // Can't throw since window.location is undefined in Metro pass
    // but may get defined when app mounts.
    console.warn(
      `Failed to resolve URL from ${initOpts?.url?.toString()} and ${process.env.EXPO_PUBLIC_SERVER_ORIGIN} or ${debuggerHost}. Your application may not work as expected.`,
    );
  }

  const vanillaHelpers = generateReactHelpers<TRouter>({ ...initOpts, url });
  const useImageUploader = GENERATE_useImageUploader<TRouter>({ url });
  const useDocumentUploader = GENERATE_useDocumentUploader<TRouter>({ url });

  return { ...vanillaHelpers, useImageUploader, useDocumentUploader };
};
