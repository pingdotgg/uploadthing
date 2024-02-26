import * as ImagePicker from "expo-image-picker";

import type { UseUploadthingProps } from "@uploadthing/react";
import { INTERNAL_uploadthingHookGen } from "@uploadthing/react/native";
import { generatePermittedFileTypes } from "uploadthing/client";
import type { FileRouter, inferEndpointInput } from "uploadthing/server";

const generateMediaTypes = (fileTypes: string[]) => {
  const allowsImages = fileTypes.some((t) => t.startsWith("image"));
  const allowsVideos = fileTypes.some((t) => t.startsWith("video"));

  if (allowsImages && allowsVideos) return ImagePicker.MediaTypeOptions.All;
  if (allowsImages) return ImagePicker.MediaTypeOptions.Images;
  if (allowsVideos) return ImagePicker.MediaTypeOptions.Videos;
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
    const { fileTypes, multiple } = generatePermittedFileTypes(
      uploadthing.permittedFileInfo?.config,
    );
    const mediaTypes = generateMediaTypes(fileTypes);

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
