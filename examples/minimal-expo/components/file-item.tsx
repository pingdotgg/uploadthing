import { useActionSheet } from "@expo/react-native-action-sheet";
import { useRouter } from "expo-router";
import { Ellipsis, FileText, Image } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { generateDateFromString, isImage } from "~/utils/image-utils";
import { RouterOutputs, trpc } from "~/utils/trpc";

export function FileItem({
  item,
}: {
  item: RouterOutputs["getFiles"][number];
}) {
  const utils = trpc.useUtils();
  const router = useRouter();

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
