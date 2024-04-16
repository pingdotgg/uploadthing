import { useActionSheet } from "@expo/react-native-action-sheet";
import { FlashList } from "@shopify/flash-list";
import { router, Stack, useRouter } from "expo-router";
import { Ellipsis, FileText, Image, Loader2, Plus } from "lucide-react-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { api, RouterOutputs } from "~/utils/api";

export default function HomeScreen() {
  const { data: files, isPending } = api.getFiles.useQuery();
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: "Home Page" }} />
      {isPending ? (
        <View className="flex h-full items-center justify-center">
          <ActivityIndicator size="large" color="#ccc" />
        </View>
      ) : (
        <FlashList
          data={files}
          estimatedItemSize={100}
          renderItem={({ item }) => <FileItem key={item.id} item={item} />}
        />
      )}
      <Pressable
        className="absolute bottom-8 right-8 flex items-center justify-center rounded-full bg-zinc-800 p-3"
        onPress={() => {
          router.push("/upload-modal");
        }}
      >
        <Plus color="white" className="size-40" />
      </Pressable>
    </>
  );
}

function isImage(filename: string) {
  const imageExtensions = ["jpg", "png", "jpeg", "webp", "gif"];
  return imageExtensions.some((ext) => filename.endsWith(ext));
}

/**
 * Generate a date from a file's key.
 * You'd have this from your db but since we just use UTApi i generate one here...
 * This algorithm is not even close to scientifically sound, but I just want a
 * deterministic way to generate a date from a string.
 */
function generateDateFromString(item: RouterOutputs["getFiles"][number]) {
  const numberFromItem = JSON.stringify(item)
    .split("")
    .reduce((a, b) => a + Math.pow(b.charCodeAt(0), 4), 0);
  return new Date(+new Date("2023-01-01") + numberFromItem);
}

function FileItem({ item }: { item: RouterOutputs["getFiles"][number] }) {
  const utils = api.useUtils();
  const { mutate: deleteFile } = api.deleteFile.useMutation({
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

  return (
    <Pressable
      className="flex w-full flex-row items-center gap-2 p-2 px-4 active:bg-zinc-700"
      onPress={() => {
        console.log("outer press", item);
        router.push(`/f/${item.key}?name=${item.name}`);
      }}
    >
      <Icon className="size-8" color="#ccc" />
      <View className="flex flex-1 flex-col gap-1">
        <Text className="line-clamp-1 truncate text-zinc-100">{item.name}</Text>
        <Text className="text-sm text-zinc-300">
          Created {generateDateFromString(item).toLocaleString()}
        </Text>
      </View>
      <Pressable
        className="shrink-0"
        onPress={() => {
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
        }}
      >
        <Ellipsis color="#ccc" />
      </Pressable>
    </Pressable>
  );
}
