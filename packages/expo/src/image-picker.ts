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
  if (allowsImg) mediaTypes = ImagePicker.MediaTypeOptions.Images;
  if (allowsVid) mediaTypes = ImagePicker.MediaTypeOptions.Videos;

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
    const { mediaTypes, multiple } = generateMediaTypes(
      uploadthing.permittedFileInfo?.config,
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
      let launchFn: typeof ImagePicker.launchImageLibraryAsync;
      let getPermissionFn: () => Promise<ImagePicker.PermissionResponse>;
      let requestPermissionFn: () => Promise<ImagePicker.PermissionResponse>;

      if ((opts.source ?? "library") === "camera") {
        launchFn = ImagePicker.launchCameraAsync;
        getPermissionFn = ImagePicker.getCameraPermissionsAsync;
        requestPermissionFn = ImagePicker.requestCameraPermissionsAsync;
      } else {
        launchFn = ImagePicker.launchImageLibraryAsync;
        getPermissionFn = ImagePicker.getMediaLibraryPermissionsAsync;
        requestPermissionFn = ImagePicker.requestMediaLibraryPermissionsAsync;
      }

      let granted = true;
      const currentPermissions = await getPermissionFn();
      if (!currentPermissions.granted && currentPermissions.canAskAgain) {
        const newPermissions = await requestPermissionFn();
        granted = newPermissions.granted;
      }
      if (!granted) return opts.onInsufficientPermissions?.();

      const response = await launchFn({
        mediaTypes,
        allowsEditing: multiple ? false : opts.allowsEditing,
        allowsMultipleSelection: multiple,
      });
      if (response.canceled) return opts.onCancel?.();

      const files = response.assets.map((ass) => ({
        uri: ass.uri,
        type: ass.type,
        name: ass.fileName ?? ass.uri.split("/").pop() ?? "unknown-filename",
        size: ass.fileSize,
      }));

      // This cast works cause you can append { uri, type, name } as FormData
      return uploadthing.startUpload(
        files as unknown as File[],
        "input" in opts ? opts.input : undefined,
      );
    };

    return { openImagePicker, isUploading: uploadthing.isUploading };
  };
