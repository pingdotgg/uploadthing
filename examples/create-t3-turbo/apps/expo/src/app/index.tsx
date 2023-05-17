import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { DocumentUploader, ImageUploader } from "@uploadthing/react-native";
import { type OurFileRouter } from "@acme/nextjs/src/app/api/uploadthing/core";
import { getBaseUrl } from "~/utils/api";

const Index = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="bg-[#1F104A]">
      {/* Changes page title visible on the header */}
      <Stack.Screen options={{ title: "Home Page" }} />
      <View className="h-full w-full">
        <Text className="mx-auto pb-2 text-3xl font-bold text-white">
          Create <Text className="text-pink-400">T3</Text> Turbo with
          UploadThing
        </Text>

        <Text className="text-2xl text-white px-4">Image Uploader</Text>

        <View className="p-4">
          <ImageUploader<OurFileRouter>
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              console.log(res);
            }}
            showPreview={true}
            onUploadError={(err) => {
              console.error(err);
            }}
            url={`${getBaseUrl()}/api/uploadthing`}
          />
        </View>

        <Text className="text-2xl text-white px-4">Document Uploader</Text>

        <View className="p-4">
          <DocumentUploader<OurFileRouter>
            endpoint="blobUploader"
            onClientUploadComplete={(res) => {
              console.log(res);
            }}
            onUploadError={(err) => {
              console.error(err);
            }}
            url={`${getBaseUrl()}/api/uploadthing`}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Index;
