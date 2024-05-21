import FeatherIcon from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { Stack, useGlobalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Button, View } from "react-native";

import { isImage } from "~/lib/utils";

export default function FileScreen() {
  const searchParams = useGlobalSearchParams<{ key: string; name?: string }>();
  const { key, name = "Untitled" } = searchParams;
  const fileUrl = `https://utfs.io/f/${key}`;

  return (
    <>
      <Stack.Screen options={{ title: name, headerBackTitleVisible: false }} />
      <View className="flex h-full items-center justify-center">
        {!isImage(name) ? (
          <View className="flex flex-col items-center gap-4">
            <FeatherIcon name="file-text" size={72} className="text-zinc-300" />
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
