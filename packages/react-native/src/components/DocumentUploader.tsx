import { useEffect } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Text, TouchableOpacity, View } from "react-native";
import type { TextProps, ViewProps } from "react-native";

import {
  allowedContentTextLabelGenerator,
  generatePermittedFileTypes,
} from "@uploadthing/shared/format";
import type { DANGEROUS__uploadFiles } from "uploadthing/client";
import type { FileRouter } from "uploadthing/server";

import { useUploadThing } from "../useUploadThing";
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

type DocumentUploaderTheme = {
  /**
   * Styling for the container of the uploader component
   */
  containerStyle?: ViewProps["style"];
  /**
   * Styling for the constraints text at the bottom of the uploader component
   */
  constraintsTextStyle?: TextProps["style"];
  /**
   * Styling for the upload button
   * Can be different for loading, idle, and all = both states
   */
  uploadButtonStyle?: {
    loading: ViewProps["style"];
    all: ViewProps["style"];
    idle: ViewProps["style"];
  };
  /**
   * Styling for the text inside the upload button
   */
  uploadButtonTextStyle?: TextProps["style"];
  /**
   * Styling for the spinner inside the upload button
   */
  spinnerStyle?: ViewProps["style"];
};

/**
 * @example
 * <DocumentUploader<OurFileRouter>
 *   endpoint="someEndpoint"
 *   onUploadComplete={(res) => console.log(res)}
 *   onUploadError={(err) => console.log(err)}
 * />
 */
export function DocumentUploader<
  TRouter extends void | FileRouter = void,
>(props: {
  endpoint: EndpointHelper<TRouter>;
  multiple?: boolean;
  onClientUploadComplete?: (
    res?: Awaited<
      ReturnType<typeof DANGEROUS__uploadFiles<EndpointHelper<TRouter>>>
    >,
  ) => void;
  onUploadError?: (error: Error) => void;
  url?: string;
  theme?: DocumentUploaderTheme;
}) {
  const { startUpload, isUploading, permittedFileInfo } =
    useUploadThing<string>({
      endpoint: props.endpoint as string,
      onClientUploadComplete: props.onClientUploadComplete,
      onUploadError: props.onUploadError,
      url: props.url,
    });

  const { multiple, fileTypes } = generatePermittedFileTypes(
    permittedFileInfo?.config,
  );

  useEffect(() => {
    if (fileTypes) {
      if (
        fileTypes.filter(
          (fileType) => fileType === "image" || fileType === "video",
        ).length === fileTypes.length &&
        fileTypes.length > 0
      ) {
        console.warn(
          "[UT] Using document uploader on a route which only allows images/videos",
        );
      }
    }
  }, [fileTypes]);

  useEffect(() => {
    if (props.multiple && !multiple) {
      console.warn(
        "[UT] Multiple asset upload allowed on client-side, but disabled on backend",
      );
    }
  }, [props.multiple, multiple]);

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
    <View style={props.theme?.containerStyle}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          void upload();
        }}
        style={[
          {
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
          },
          props.theme?.uploadButtonStyle?.all || {},
          isUploading
            ? props.theme?.uploadButtonStyle?.loading || {}
            : props.theme?.uploadButtonStyle?.idle || {},
        ]}
      >
        {isUploading ? (
          <>
            <Spinner style={props.theme?.spinnerStyle} />
            <Text
              style={[{ color: "white" }, props.theme?.uploadButtonTextStyle]}
            >
              {" "}
              Uploading
            </Text>
          </>
        ) : (
          <Text
            style={[{ color: "white" }, props.theme?.uploadButtonTextStyle]}
          >
            Upload
          </Text>
        )}
      </TouchableOpacity>
      {fileTypes ? (
        <Text
          style={[
            {
              fontSize: 12,
              marginTop: 8,
              width: "100%",
              textAlign: "center",
              color: "white",
            },
            props.theme?.constraintsTextStyle,
          ]}
        >
          {allowedContentTextLabelGenerator(permittedFileInfo?.config)}
        </Text>
      ) : null}
    </View>
  );
}

DocumentUploader.displayName = "DocumentUploader";
