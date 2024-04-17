import { useState } from "react";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { FlashList } from "@shopify/flash-list";
import { router, Stack, useRouter } from "expo-router";
import { Ellipsis, FileText, Image, Plus } from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

import { generateDateFromString, isImage } from "~/utils/image-utils";
import { RouterOutputs, trpc } from "~/utils/trpc";

export default function HomeScreen() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: files, isPending } = trpc.getFiles.useQuery();

  const [refreshing, setRefreshing] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  return (
    <>
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
        />
      )}

      <Pressable
        className={[
          "absolute bottom-12 right-12 flex items-center justify-center rounded-full bg-blue-600 p-3 active:bg-blue-700",
          isScrolling ? "-z-50 opacity-0" : "z-10 opacity-100",
          "transition-opacity duration-300",
        ].join(" ")}
        onPress={() => router.push("/upload-modal")}
      >
        <Plus color="white" size={36} />
      </Pressable>
    </>
  );
}

function FileItem({ item }: { item: RouterOutputs["getFiles"][number] }) {
  const utils = trpc.useUtils();
  const { mutate: deleteFile } = trpc.deleteFile.useMutation({
    onMutate: () => {
      // Optimicially remove the file from the list
      const files = utils.getFiles.getData() ?? [];
      const newFiles = files.filter((f) => f.key !== item.key);
      utils.getFiles.setData(undefined, newFiles);
    },
    onSettled: () => utils.getFiles.invalidate(),
  });

  const { showActionSheetWithOptions } = useActionSheet();

  const Icon = isImage(item.name) ? Image : FileText;

  const openActionSheet = () => {
    const destructiveButtonIndex = 0;
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options: ["Delete", "Cancel"],
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      (selectedIndex) => {
        switch (selectedIndex) {
          case destructiveButtonIndex:
            deleteFile({ key: item.key });
            break;

          case cancelButtonIndex:
            // Canceled
            break;
        }
      },
    );
  };

  return (
    <Pressable
      className="flex w-full flex-row items-center gap-2 p-2 px-4 active:bg-zinc-700"
      onPress={() => router.push(`/f/${item.key}?name=${item.name}`)}
      onLongPress={() => openActionSheet()}
    >
      <Icon className="size-8" color="#ccc" />
      <View className="flex flex-1 flex-col gap-1">
        <Text className="line-clamp-1 truncate text-zinc-100">{item.name}</Text>
        <Text className="text-sm text-zinc-300">
          Created {generateDateFromString(item).toLocaleString()}
        </Text>
      </View>
      <Pressable className="shrink-0" onPress={() => openActionSheet()}>
        <Ellipsis color="#ccc" />
      </Pressable>
    </Pressable>
  );
}
