import { useEffect } from "react";
import { Image } from "expo-image";
import { Stack, useGlobalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { FileText } from "lucide-react-native";
import { Button, View } from "react-native";

import { isImage } from "~/utils/image-utils";

import Constants from "expo-constants";

export default function FileScreen() {
  const searchParams = useGlobalSearchParams<{ key: string; name: string }>();
  const { key, name } = searchParams;
  const fileUrl = `https://utfs.io/f/${key}`;

  const apiUrl = Constants?.expoConfig?.hostUri
  ? `http://${Constants.expoConfig.hostUri.split(':')[0]}:8081/api/test-upload`
  : `https://api.uploadthing.com`;

  console.log(apiUrl);

  useEffect(() => {
    (async () => {
      // Download blob
      const blob = await new Promise<Blob>((r) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", fileUrl);
        xhr.responseType = "blob";
        xhr.addEventListener("progress", ({ loaded, total }) => {
          console.log("DOWNLOAD progress", { loaded, total });
        });
        xhr.addEventListener("load", () => {
          const blob = xhr.response;
          const uri = URL.createObjectURL(blob);
          console.log("DOWNLOAD loaded");
          r(Object.assign(blob, { uri }));
        });
        xhr.send();
      });

      console.log(
        "Downloaded blob, trying to POST it. Blob is ",
        blob.size,
        "B",
      );

      // Upload blob
      const formData = new FormData();
      formData.append("file", blob);

      const xhr = new XMLHttpRequest();
      // xhr.responseType = "text";
      xhr.upload.addEventListener(
        "progress",
        ({ loaded, total }) => {
          console.log("UPLOAD progress", { loaded, total });
        },
        false,
      );
      xhr.upload.addEventListener("load", () => {
        console.log("UPLOAD loaded", xhr.response);
      });

      xhr.open("POST", apiUrl, true);
      xhr.setRequestHeader("Content-Length", String(blob.size));
      xhr.setRequestHeader("Content-Type", "multipart/form-data");

      xhr.send(formData);
    })();
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: name, headerBackTitleVisible: false }} />
      <View className="flex h-full items-center justify-center">
        {!isImage(name) ? (
          <View className="flex flex-col items-center gap-4">
            <FileText color="white" size={72} />
            <Button
              title="Preview File in Browser"
              onPress={() => WebBrowser.openBrowserAsync(fileUrl)}
            />
          </View>
        ) : (
          <Image
            source={{ uri: fileUrl }}
            className="flex h-full w-full"
            contentFit="contain"
          />
        )}
      </View>
    </>
  );
}
