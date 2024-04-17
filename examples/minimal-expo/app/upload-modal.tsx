import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { FileText, Image } from "lucide-react-native";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";

import { generateReactNativeHelpers } from "@uploadthing/expo";

import { trpc } from "~/utils/trpc";
import { UploadRouter } from "./api/uploadthing+api";

const { useImageUploader, useDocumentUploader } =
  generateReactNativeHelpers<UploadRouter>();

export default function Modal() {
  const router = useRouter();
  const utils = trpc.useUtils();

  const imageUploader = useImageUploader("videoAndImage", {
    onUploadProgress: (p) => {
      console.log("upload progress", p);
    },
    onClientUploadComplete: ([{ key, name }]) => {
      utils.getFiles.invalidate();
      router.dismissAll();
      router.push(`/f/${key}?name=${name}`);
    },
  });
  const pdfUploader = useDocumentUploader("document", {
    onClientUploadComplete: ([{ key, name }]) => {
      utils.getFiles.invalidate();
      router.dismissAll();
      router.push(`/f/${key}?name=${name}`);
    },
    onUploadProgress: (p) => {
      console.log("upload progress", p);
    },
  });

  const isUploading = imageUploader.isUploading || pdfUploader.isUploading;

  const { height } = useWindowDimensions();

  return (
    <View className="flex h-full flex-col items-center justify-center">
      <Pressable
        disabled={isUploading}
        onPress={() => {
          router.dismissAll();
        }}
        className="absolute bottom-0 left-0 right-0 top-0"
      >
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          className="h-full w-full bg-black/50"
        />
      </Pressable>
      <Animated.View
        style={{
          backgroundColor: "#18181b",
          elevation: 5,
          transform: [{ translateY: height * 0.75 }],
        }}
        entering={SlideInDown}
        exiting={SlideOutDown}
        className="flex w-full flex-1 items-center gap-4 rounded-lg p-12 shadow-lg"
      >
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
                          onPress: () => Linking.openSettings(),
                          isPreferred: true,
                        },
                      ],
                    );
                  },
                });
              }}
              className="flex w-full max-w-52 flex-row items-center justify-center gap-2 rounded-lg bg-blue-600 p-4 active:bg-blue-700"
            >
              <Image size={24} color="white" />
              <Text className="font-bold text-white">Select Image</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                pdfUploader.openDocumentPicker({
                  input: { foo: "bar" },
                });
              }}
              className="flex w-full max-w-52 flex-row items-center justify-center gap-2 rounded-lg bg-blue-600 p-4 active:bg-blue-700"
            >
              <FileText size={24} color="white" />
              <Text className="font-bold text-white">Select PDF</Text>
            </Pressable>
          </>
        )}
      </Animated.View>
    </View>
  );
}
