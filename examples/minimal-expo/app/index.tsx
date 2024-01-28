import { useMemo } from "react";
import * as ImagePicker from "expo-image-picker";
import { Stack } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

import { generateReactHelpers } from "@uploadthing/react/native";
import { generatePermittedFileTypes } from "uploadthing/client";

import type { UploadRouter } from "./uploadthing+api";

const { useUploadThing } = generateReactHelpers<UploadRouter>({
  url: new URL("http://localhost:8081/uploadthing"),
});

export default function ModalScreen() {
  const { startUpload, permittedFileInfo } = useUploadThing("videoAndImage");
  const { fileTypes, multiple } = generatePermittedFileTypes(
    permittedFileInfo?.config,
  );

  const mediaTypes = useMemo(() => {
    const allowsImages = fileTypes.includes("image");
    const allowsVideos = fileTypes.includes("video");

    if (allowsImages && allowsVideos) return ImagePicker.MediaTypeOptions.All;
    if (allowsImages) return ImagePicker.MediaTypeOptions.Images;
    if (allowsVideos) return ImagePicker.MediaTypeOptions.Videos;
  }, [fileTypes]);

  console.log({ fileTypes, multiple });

  return (
    <>
      <Stack.Screen options={{ title: "Home Page" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Modal</Text>
        <Button
          title="Open Gallery"
          onPress={async () => {
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
                  asset.fileName ??
                  asset.uri.split("/").pop() ??
                  "unknown-filename";
                return new File([blob], name, { type: asset.type });
              }),
            );
            try {
              const utresponse = await startUpload(files);
              console.log({ utresponse });
            } catch (e) {
              console.log(e);
            }
          }}
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
