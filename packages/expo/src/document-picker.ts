import * as DocumentPicker from "expo-document-picker";

import type { UseUploadthingProps } from "@uploadthing/react";
import { INTERNAL_uploadthingHookGen } from "@uploadthing/react/native";
import { generatePermittedFileTypes } from "@uploadthing/shared";
import type { ExpandedRouteConfig, ExtendObjectIf } from "@uploadthing/shared";
import type { FileRouter } from "uploadthing/server";
import type { inferEndpointInput } from "uploadthing/types";

const generateFileTypes = (config: ExpandedRouteConfig | undefined) => {
  const { fileTypes, multiple } = generatePermittedFileTypes(config);

  // Forward mime-types from route config
  const allowedMimeTypes: string[] = fileTypes;

  // Handle special UploadThing types
  if (fileTypes.includes("image")) allowedMimeTypes.push("image/*");
  if (fileTypes.includes("video")) allowedMimeTypes.push("video/*");
  if (fileTypes.includes("audio")) allowedMimeTypes.push("audio/*");
  if (fileTypes.includes("pdf")) allowedMimeTypes.push("application/pdf");
  if (fileTypes.includes("text")) allowedMimeTypes.push("text/*");

  if (fileTypes.includes("blob")) {
    allowedMimeTypes.push("&ast;/*");
    allowedMimeTypes.push("*/*");
  }

  return { mimeTypes: allowedMimeTypes, multiple };
};

export const GENERATE_useDocumentUploader =
  <TRouter extends FileRouter>(initOpts: { url: URL }) =>
  <TEndpoint extends keyof TRouter>(
    endpoint: TEndpoint,
    opts?: UseUploadthingProps<TRouter, TEndpoint>,
  ) => {
    const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>({
      url: initOpts.url,
    });
    const uploadthing = useUploadThing(endpoint, opts);
    const { mimeTypes, multiple } = generateFileTypes(
      uploadthing.permittedFileInfo?.config,
    );

    const openDocumentPicker = async (
      opts: {
        /**
         * Called when the user cancels the picker
         */
        onCancel?: () => void;
      } & ExtendObjectIf<
        inferEndpointInput<TRouter[TEndpoint]>,
        { input: inferEndpointInput<TRouter[TEndpoint]> }
      >,
    ) => {
      const response = await DocumentPicker.getDocumentAsync({
        multiple,
        type: mimeTypes,
      });
      if (response.canceled) return opts.onCancel?.();

      const files = await Promise.all(
        response.assets.map(async (a) => {
          const blob = await fetch(a.uri).then((r) => r.blob());
          const n = a.name ?? a.uri.split("/").pop() ?? "unknown-filename";
          const file = new File([blob], n, {
            type: a.mimeType,
          });
          /**
           * According to React Native's FormData implementation:
           * "a "blob", which in React Native just means an object with a uri attribute"
           * @see https://github.com/facebook/react-native/blob/030663bb0634fc76f811cdc63e4d09e7ca32f3d4/packages/react-native/Libraries/Network/FormData.js#L78C1-L82C48
           */
          const RNFormDataCompatibleFile = Object.assign(file, { uri: a.uri });
          return RNFormDataCompatibleFile;
        }),
      );

      // This cast works cause you can append { uri, type, name } as FormData
      return uploadthing.startUpload(
        files as unknown as File[],
        "input" in opts ? opts.input : undefined,
      );
    };

    return { openDocumentPicker, isUploading: uploadthing.isUploading };
  };
