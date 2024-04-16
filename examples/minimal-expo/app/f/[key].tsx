import { Image } from "expo-image";
import { Stack, useGlobalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { FileText } from "lucide-react-native";
import { Button, View } from "react-native";

export default function FileScreen() {
  const searchParams = useGlobalSearchParams<{ key: string; name: string }>();
  const { key, name } = searchParams;
  const fileUrl = `https://utfs.io/f/${key}`;
  const isPdf = key.endsWith("pdf");

  return (
    <>
      <Stack.Screen options={{ title: name, headerBackTitleVisible: false }} />
      <View className="flex h-full items-center justify-center">
        {isPdf ? (
          <View className="flex flex-col items-center gap-4">
            <FileText color="white" size={72} />
            <Button
              title="Open PDF in Browser"
              onPress={() => WebBrowser.openBrowserAsync(fileUrl)}
            />
          </View>
        ) : (
          <Image
            source={fileUrl}
            className="flex h-full w-full"
            contentFit="contain"
          />
        )}
      </View>
    </>
  );
}
