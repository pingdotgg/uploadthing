import { Stack } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

import { generateReactNativeHelpers } from "@uploadthing/expo";

import type { UploadRouter } from "./api/uploadthing+api";

const { useImageUploader, useDocumentUploader } =
  generateReactNativeHelpers<UploadRouter>();

export default function ModalScreen() {
  const { openImagePicker, isUploading: isUploadingImage } =
    useImageUploader("videoAndImage");
  const { openDocumentPicker, isUploading: isUploadingDocument } =
    useDocumentUploader("document");

  return (
    <>
      <Stack.Screen options={{ title: "Home Page" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Modal</Text>
        <Button
          title="Open Gallery"
          onPress={() => openImagePicker({})}
          disabled={isUploadingImage}
        />
        <Button
          title="Select File"
          onPress={() => {
            return openDocumentPicker({
              input: { foo: "bar" },
            });
          }}
          disabled={isUploadingDocument}
        />
        <View style={styles.separator} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
