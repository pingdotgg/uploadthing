import { useRef } from "react";
import FeatherIcon from "@expo/vector-icons/Feather";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { openSettings } from "expo-linking";
import { useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import { trpc } from "~/utils/trpc";
import { useDocumentUploader, useImageUploader } from "~/utils/uploadthing";

export function UploadActionDrawer(props: { showTrigger: boolean }) {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const utils = trpc.useUtils();
  const router = useRouter();

  const imageUploader = useImageUploader("videoAndImage", {
    onUploadProgress: (p) => {
      console.log("upload progress", p);
    },
    onUploadError: (e) => {
      Alert.alert("Upload Error", e.data?.reason ?? e.message);
    },
    onClientUploadComplete: (files) => {
      utils.getFiles.invalidate();

      if (files.length === 1) {
        // Auto-open the file if there's only one
        const { key, name } = files[0];
        bottomSheetModalRef.current?.dismiss();
        router.push(`/f/${key}?name=${name}`);
      } else {
        bottomSheetModalRef.current?.dismiss();
      }
    },
  });
  const pdfUploader = useDocumentUploader("document", {
    onUploadProgress: (p) => {
      console.log("upload progress", p);
    },
    onUploadError: (e) => {
      Alert.alert("Upload Error", e.data?.reason ?? e.message);
    },
    onClientUploadComplete: (files) => {
      utils.getFiles.invalidate();

      if (files.length === 1) {
        // Auto-open the file if there's only one
        const { key, name } = files[0];
        bottomSheetModalRef.current?.dismiss();
        router.push(`/f/${key}?name=${name}`);
      } else {
        bottomSheetModalRef.current?.dismiss();
      }
    },
  });

  const isUploading = imageUploader.isUploading || pdfUploader.isUploading;

  return (
    <BottomSheetModalProvider>
      {/* Trigger */}
      <Pressable
        className={[
          "absolute bottom-12 right-12 flex items-center justify-center rounded-full bg-blue-600 p-3 active:bg-blue-700",
          props.showTrigger ? "z-0 opacity-100" : "-z-50 opacity-0",
          "transition-opacity duration-300",
        ].join(" ")}
        onPress={() => bottomSheetModalRef.current?.present()}
      >
        <FeatherIcon name="plus" size={36} className="text-zinc-100" />
      </Pressable>

      {/* Sheet Content */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        enableDynamicSizing
        backgroundStyle={{ backgroundColor: "#27272a" }}
      >
        <BottomSheetView className="flex items-center">
          {isUploading ? (
            <View className="flex h-full flex-col items-center gap-4 pt-8">
              <ActivityIndicator size="large" color="#ccc" />
              <Text className="font-bold text-white">Uploading...</Text>
            </View>
          ) : (
            <>
              <Pressable
                onPress={() => {
                  imageUploader.openImagePicker({
                    source: "library",
                    onInsufficientPermissions: () => {
                      Alert.alert(
                        "No Permissions",
                        "You need to grant permission to your Photos to use this",
                        [
                          { text: "Dismiss" },
                          { text: "Open Settings", onPress: openSettings },
                        ],
                      );
                    },
                  });
                }}
                className="flex w-full flex-row items-center gap-4 p-4 active:bg-zinc-900"
              >
                <FeatherIcon
                  name="image"
                  size={24}
                  className="ml-2 text-zinc-100"
                />
                <Text className="font-bold text-white">Select Image</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  imageUploader.openImagePicker({
                    source: "camera",
                    onInsufficientPermissions: () => {
                      Alert.alert(
                        "No Permissions",
                        "You need to grant camera permissions to use this",
                        [
                          {
                            text: "Dismiss",
                          },
                          {
                            text: "Open Settings",
                            onPress: () => openSettings(),
                            isPreferred: true,
                          },
                        ],
                      );
                    },
                  });
                }}
                className="flex w-full flex-row items-center gap-4 p-4 active:bg-zinc-900"
              >
                <FeatherIcon
                  name="camera"
                  size={24}
                  className="ml-2 text-zinc-100"
                />
                <Text className="font-bold text-white">Take Photo</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  pdfUploader.openDocumentPicker({
                    input: { foo: "bar" },
                  });
                }}
                className="flex w-full flex-row items-center gap-4 p-4 active:bg-zinc-900"
              >
                <FeatherIcon
                  name="file-text"
                  size={24}
                  className="ml-2 text-zinc-100"
                />
                <Text className="font-bold text-white">Select PDF</Text>
              </Pressable>
              {/* Bottom "padding" */}
              <View className="h-10" />
            </>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
}
