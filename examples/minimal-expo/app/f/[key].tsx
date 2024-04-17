import { Image } from "expo-image";
import { Stack, useGlobalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { FileText } from "lucide-react-native";
import { Button, View } from "react-native";

import { isImage } from "~/utils/image-utils";

export default function FileScreen() {
  const searchParams = useGlobalSearchParams<{ key: string; name: string }>();
  const { key, name } = searchParams;
  const fileUrl = `https://utfs.io/f/${key}`;

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
