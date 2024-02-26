import * as ImagePicker from "expo-image-picker";

import type { UseUploadthingProps } from "@uploadthing/react";
import { INTERNAL_uploadthingHookGen } from "@uploadthing/react/native";
import type { ExpandedRouteConfig } from "@uploadthing/shared";
import { generatePermittedFileTypes } from "uploadthing/client";
import type { FileRouter, inferEndpointInput } from "uploadthing/server";

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
      opts: undefined extends inferEndpointInput<TRouter[TEndpoint]>
        ? void
        : {
            input: inferEndpointInput<TRouter[TEndpoint]>;
          },
    ) => {
      const response = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: true,
        allowsMultipleSelection: multiple,
      });
      if (response.canceled) {
        console.log("User cancelled image picker");
        return;
      }

      const files = response.assets.map((ass) => ({
        uri: ass.uri,
        type: ass.type,
        name: ass.fileName ?? ass.uri.split("/").pop() ?? "unknown-filename",
        size: ass.fileSize,
      }));

      // This cast works cause you can append { uri, type, name } as FormData
      return uploadthing.startUpload(files as unknown as File[], opts?.input);
    };

    return { openImagePicker };
  };
