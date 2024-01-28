import { useCallback, useMemo } from "react";
import { Stack } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

import { generateReactHelpers } from "@uploadthing/react/native";

import type { UploadRouter } from "./uploadthing+api";

const { useUploadThing } = generateReactHelpers<UploadRouter>({
  url: new URL("http://localhost:8081/uploadthing"),
});

export default function ModalScreen() {
  const { startUpload, permittedFileInfo } = useUploadThing("videoAndImage");

  console.log(permittedFileInfo);

  return (
    <>
      <Stack.Screen options={{ title: "Home Page" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Modal</Text>
        <Button title="Open Gallery" />
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
