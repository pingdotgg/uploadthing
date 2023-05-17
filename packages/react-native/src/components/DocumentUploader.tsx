import { type FileRouter } from "uploadthing/server";
import { useUploadThing } from "../useUploadThing";
import { type DANGEROUS__uploadFiles } from "uploadthing/client";
import * as DocumentPicker from "expo-document-picker";
import { TouchableOpacity, View, Text } from "react-native";
import { useEffect } from "react";
import { Spinner } from "./Spinner";

export type EndpointHelper<TRouter extends void | FileRouter> =
  void extends TRouter
    ? "YOU FORGOT TO PASS THE GENERIC"
    : keyof TRouter extends string
    ? keyof TRouter
    : string;

function generateMimeTypes(fileTypes: string[]) {
  const allowedMimeTypes = [];
  if (fileTypes.includes("image")) {
    allowedMimeTypes.push("image/*");
  }
  if (fileTypes.includes("video")) {
    allowedMimeTypes.push("video/*");
  }
  if (fileTypes.includes("audio")) {
    allowedMimeTypes.push("audio/*");
  }
  if (fileTypes.includes("blob")) {
    allowedMimeTypes.push("&ast;/*");
    allowedMimeTypes.push("*/*");
  }
  return allowedMimeTypes;
}

/**
 * @example
 * <DocumentUploader<OurFileRouter>
 *   endpoint="someEndpoint"
 *   onUploadComplete={(res) => console.log(res)}
 *   onUploadError={(err) => console.log(err)}
 * />
 */
export function DocumentUploader<
  TRouter extends void | FileRouter = void
>(props: {
  endpoint: EndpointHelper<TRouter>;
  multiple?: boolean;
  onClientUploadComplete?: (
    res?: Awaited<
      ReturnType<typeof DANGEROUS__uploadFiles<EndpointHelper<TRouter>>>
    >
  ) => void;
  onUploadError?: (error: Error) => void;
  url?: string;
}) {
  const { startUpload, isUploading, permittedFileInfo } =
    useUploadThing<string>({
      endpoint: props.endpoint as string,
      onClientUploadComplete: props.onClientUploadComplete,
      onUploadError: props.onUploadError,
      url: props.url,
    });

  const { maxSize, fileTypes } = permittedFileInfo ?? {};

  useEffect(() => {
    if (fileTypes) {
      if (
        fileTypes.filter(
          (fileType) => fileType === "image" || fileType === "video"
        ).length === fileTypes.length &&
        fileTypes.length > 0
      ) {
        console.warn(
          "[UT] Using document uploader on a route which only allows images/videos"
        );
      }
    }
  }, [fileTypes]);

  async function upload() {
    const response = await DocumentPicker.getDocumentAsync({
      type: generateMimeTypes(fileTypes || []),
      multiple: props.multiple ?? false,
      copyToCacheDirectory: true,
    });
    if (response.type === "success") {
      void startUpload([
        {
          uri: response.uri,
          type: response.type,
          name: response.name,
        },
      ]);
    }
  }

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          void upload();
        }}
        style={{
          backgroundColor: "blue",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          justifyContent: "center",
          alignItems: "center",
          padding: 8,
          borderRadius: 8,
          columnGap: 4,
        }}
      >
        {isUploading ? (
          <>
            <Spinner />
            <Text style={{ color: "white" }}> Uploading</Text>
          </>
        ) : (
          <Text style={{ color: "white" }}>Upload</Text>
        )}
      </TouchableOpacity>
      {fileTypes ? (
        <Text
          style={{
            fontSize: 12,
            marginTop: 8,
            width: "100%",
            textAlign: "center",
            color: "white",
          }}
        >
          {`${fileTypes
            .map(
              (fileType) =>
                `${fileType[0].toLocaleUpperCase()}${fileType.slice(1)}s`
            )
            .join(", ")}`}
          {maxSize && ` up to ${maxSize}`}
        </Text>
      ) : null}
    </View>
  );
}

DocumentUploader.displayName = "DocumentUploader";
