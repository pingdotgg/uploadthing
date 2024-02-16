import * as DocumentPicker from "expo-document-picker";
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
      const files = await Promise.all(
        response.assets.map(async (asset) => {
          const blob = await fetch(asset.uri).then((r) => r.blob());
          const name =
            asset.fileName ?? asset.uri.split("/").pop() ?? "unknown-filename";
          return new File([blob], name, { type: asset.type });
        }),
      );

      return uploadthing.startUpload(files, opts?.input);
    };

    return { openImagePicker };
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
    const { fileTypes, multiple } = generatePermittedFileTypes(
      uploadthing.permittedFileInfo?.config,
    );

    const openDocumentPicker = async (
      opts: undefined extends inferEndpointInput<TRouter[TEndpoint]>
        ? void
        : {
            input: inferEndpointInput<TRouter[TEndpoint]>;
          },
    ) => {
      const response = await DocumentPicker.getDocumentAsync({
        // type: fileTypes,
        multiple,
      });
      if (response.canceled) {
        console.log("User cancelled document picker");
        return;
      }
      const files = await Promise.all(
        response.assets.map(async (asset) => {
          const blob = await fetch(asset.uri).then((r) => r.blob());
          console.log("blob", blob, )
          return new File([blob], asset.name, { type: asset.mimeType });
        }),
      ).then((files) => files.filter((f): f is File => f !== undefined));

      console.log("picked files", files);

      return uploadthing.startUpload(files, opts?.input);
    };

    return { openDocumentPicker };
  };
