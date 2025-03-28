import Constants from "expo-constants";

import { generateReactHelpers } from "@uploadthing/react/native";
import type { FetchEsque } from "@uploadthing/shared";
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
  /**
   * Provide a custom fetch implementation.
   * @default `globalThis.fetch`
   * @example
   * ```ts
   * fetch: (input, init) => {
   *   if (input.toString().startsWith(MY_SERVER_URL)) {
   *     // Include cookies in the request to your API
   *     return fetch(input, {
   *       ...init,
   *       credentials: "include",
   *     });
   *   }
   *
   *   return fetch(input, init);
   * }
   * ```
   */
  fetch?: FetchEsque | undefined;
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
      typeof window !== "undefined" && typeof window.location !== "undefined"
        ? window.location.origin
        : (process.env.EXPO_PUBLIC_SERVER_ORIGIN ?? `http://${debuggerHost}`),
    );
  } catch (err) {
    // Can't throw since window.location is undefined in Metro pass
    // but may get defined when app mounts.
    // eslint-disable-next-line no-console
    console.warn(
      `Failed to resolve URL from ${initOpts?.url?.toString()} and ${process.env.EXPO_PUBLIC_SERVER_ORIGIN} or ${debuggerHost}. Your application may not work as expected.`,
      err,
    );
  }

  const fetch = initOpts?.fetch ?? globalThis.fetch.bind(globalThis);
  const opts = {
    ...initOpts,
    url,
    fetch,
  };

  const vanillaHelpers = generateReactHelpers<TRouter>(opts);
  const useImageUploader = GENERATE_useImageUploader<TRouter>(opts);
  const useDocumentUploader = GENERATE_useDocumentUploader<TRouter>(opts);

  return { ...vanillaHelpers, useImageUploader, useDocumentUploader };
};
