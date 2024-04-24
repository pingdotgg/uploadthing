import { useMemo } from "react";
import * as ImagePicker from "expo-image-picker";

import type { UseUploadthingProps } from "@uploadthing/react";
import { INTERNAL_uploadthingHookGen } from "@uploadthing/react/native";
import { generatePermittedFileTypes } from "@uploadthing/shared";
import type { ExpandedRouteConfig, ExtendObjectIf } from "@uploadthing/shared";
import type { FileRouter } from "uploadthing/server";
import type { inferEndpointInput } from "uploadthing/types";

const generateMediaTypes = (config: ExpandedRouteConfig | undefined) => {
  const { fileTypes, multiple } = generatePermittedFileTypes(config);
  const allowsImg = fileTypes.some((t) => t.startsWith("image"));
  const allowsVid = fileTypes.some((t) => t.startsWith("video"));

  let mediaTypes: ImagePicker.MediaTypeOptions | undefined = undefined;
  if (allowsImg && allowsVid) mediaTypes = ImagePicker.MediaTypeOptions.All;
  else if (allowsImg) mediaTypes = ImagePicker.MediaTypeOptions.Images;
  else if (allowsVid) mediaTypes = ImagePicker.MediaTypeOptions.Videos;

  return { mediaTypes, multiple };
};

export const GENERATE_useImageUploader =
  <TRouter extends FileRouter>(initOpts: { url: URL }) =>
  <TEndpoint extends keyof TRouter>(
    endpoint: TEndpoint,
    opts?: UseUploadthingProps<TRouter, TEndpoint>,
  ) => {
    const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>({
      url: initOpts.url,
    });
    const uploadthing = useUploadThing(endpoint, opts);
    const { mediaTypes, multiple } = useMemo(
      () => generateMediaTypes(uploadthing.permittedFileInfo?.config),
      [uploadthing.permittedFileInfo?.config],
    );

    const openImagePicker = async (
      opts: {
        /**
         * Whether to show a UI to edit the image after it is picked
         * If multiple files are allowed to be uploaded, this will be ignored and set to false
         */
        allowsEditing?: boolean;
        /**
         * Open Library or Camera
         * @default "library"
         */
        source?: "library" | "camera";
        /**
         * Called when there are insufficient permissions to use the image picker
         */
        onInsufficientPermissions?: () => void;
        /**
         * Called when the user cancels the picker
         */
        onCancel?: () => void;
      } & ExtendObjectIf<
        inferEndpointInput<TRouter[TEndpoint]>,
        { input: inferEndpointInput<TRouter[TEndpoint]> }
      >,
    ) => {
      const { source = "library", allowsEditing = false } = opts;
      let launchFn: typeof ImagePicker.launchImageLibraryAsync;
      let getPermissionFn: () => Promise<ImagePicker.PermissionResponse>;
      let requestPermissionFn: () => Promise<ImagePicker.PermissionResponse>;

      if (source === "camera") {
        launchFn = ImagePicker.launchCameraAsync;
        getPermissionFn = ImagePicker.getCameraPermissionsAsync;
        requestPermissionFn = ImagePicker.requestCameraPermissionsAsync;
      } else {
        launchFn = ImagePicker.launchImageLibraryAsync;
        getPermissionFn = ImagePicker.getMediaLibraryPermissionsAsync;
        requestPermissionFn = ImagePicker.requestMediaLibraryPermissionsAsync;
      }

      const currentPermissions = await getPermissionFn();
      let granted = currentPermissions.granted;
      if (!granted && currentPermissions.canAskAgain) {
        const newPermissions = await requestPermissionFn();
        granted = newPermissions.granted;
      }
      if (!granted) return opts.onInsufficientPermissions?.();

      const response = await launchFn({
        mediaTypes: mediaTypes ?? ImagePicker.MediaTypeOptions.All,
        allowsEditing: multiple ? false : allowsEditing,
        allowsMultipleSelection: multiple,
      });
      if (response.canceled) return opts.onCancel?.();

      const files = await Promise.all(
        response.assets.map(async (a) => {
          const blob = await fetch(a.uri).then((r) => r.blob());
          const n = a.fileName ?? a.uri.split("/").pop() ?? "unknown-filename";
          const file = new File([blob], n, {
            type: a.mimeType ?? a.type ?? "application/octet-stream",
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

    return { openImagePicker, isUploading: uploadthing.isUploading };
  };
