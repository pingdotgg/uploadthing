import { useState } from "react";
import { FlashList } from "@shopify/flash-list";
import { Stack } from "expo-router";
import { ActivityIndicator, RefreshControl, Text, View } from "react-native";

import { FileItem } from "~/components/file-item";
import { UploadActionDrawer } from "~/components/upload-drawer";
import { trpc } from "~/utils/trpc";

export default function HomeScreen() {
  const utils = trpc.useUtils();
  const { data: files, isPending } = trpc.getFiles.useQuery();

  const [refreshing, setRefreshing] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  return (
    <View className="relative h-full">
      <Stack.Screen options={{ title: "UploadThing Expo Demo" }} />
      {isPending ? (
        <View className="flex h-full items-center justify-center">
          <ActivityIndicator size="large" color="#ccc" />
        </View>
      ) : (
        <FlashList
          data={files ?? []}
          estimatedItemSize={100}
          onMomentumScrollBegin={() => setIsScrolling(true)}
          onMomentumScrollEnd={() => setIsScrolling(false)}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => <FileItem item={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await utils.getFiles.invalidate();
                setRefreshing(false);
              }}
              tintColor={"#ccc"}
            />
          }
          ListEmptyComponent={
            <View className="flex items-center justify-center p-16">
              <Text className="text-lg font-bold text-zinc-200">{`No files uploaded yet.`}</Text>
            </View>
          }
          ItemSeparatorComponent={() => (
            <View className="border-b border-zinc-700" />
          )}
        />
      )}
      <UploadActionDrawer showTrigger={!isScrolling} />
    </View>
  );
}
