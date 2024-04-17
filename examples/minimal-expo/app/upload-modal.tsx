import { useRouter } from "expo-router";
import { FileText, Image } from "lucide-react-native";
import { ActivityIndicator, Pressable, Text, View, useWindowDimensions } from "react-native";

import { generateReactNativeHelpers } from "@uploadthing/expo";

import { api } from "~/utils/api";
import { UploadRouter } from "./api/uploadthing+api";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideInRight, SlideOutDown } from "react-native-reanimated";
import { useState } from "react";

const { useImageUploader, useDocumentUploader } =
  generateReactNativeHelpers<UploadRouter>();

export default function Modal() {
  const router = useRouter();
  const utils = api.useUtils();

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
        className="absolute top-0 left-0 right-0 bottom-0"
      >
        <Animated.View entering={FadeIn} exiting={FadeOut} className="w-full h-full bg-black/50"/>
      </Pressable>
      <Animated.View style={{
        backgroundColor: "#18181b",
        elevation: 5,
        transform: [{ translateY: height*.75 }],
      }}
      entering={SlideInDown}
      exiting={SlideOutDown}
      className="flex flex-1 w-full shadow-lg rounded-lg p-12 gap-4 items-center">
        {isUploading ? (
          <View className="flex h-full flex-col items-center pt-8 gap-4">
            <ActivityIndicator size="large" color="#ccc" />
            <Text className="font-bold text-white">Uploading...</Text>
          </View>
        ) : (
          <>
            <Pressable
              onPress={() => {
                imageUploader.openImagePicker({});
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
