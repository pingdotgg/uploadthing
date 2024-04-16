import { useRouter } from "expo-router";
import { FileText, Image } from "lucide-react-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { generateReactNativeHelpers } from "@uploadthing/expo";

import { api } from "~/utils/api";
import { UploadRouter } from "./api/uploadthing+api";

const { useImageUploader, useDocumentUploader } =
  generateReactNativeHelpers<UploadRouter>();

export default function Modal() {
  const router = useRouter();
  const utils = api.useUtils();

  const imageUploader = useImageUploader("videoAndImage", {
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

  return (
    <View className="flex h-96 flex-col items-center gap-4 p-16">
      {isUploading ? (
        <View className="flex h-full flex-col items-center justify-center gap-2">
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
    </View>
  );
}
