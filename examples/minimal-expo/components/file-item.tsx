import { useActionSheet } from "@expo/react-native-action-sheet";
import FeatherIcon from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
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
      className="flex w-full flex-row items-center gap-4 p-2 active:bg-zinc-700"
      onPress={() => router.push(`/f/${item.key}?name=${item.name}`)}
      onLongPress={() => openActionSheet()}
    >
      <FeatherIcon
        name={isImage(item.name) ? "image" : "file-text"}
        size={24}
        className="ml-2 text-zinc-100"
      />
      <View className="flex flex-1 flex-col gap-1">
        <Text className="line-clamp-1 truncate text-zinc-100">{item.name}</Text>
        <Text className="text-sm text-zinc-300">
          Created {generateDateFromString(item).toLocaleString()}
        </Text>
      </View>
      <Pressable
        className="mr-2 flex shrink-0 items-center justify-center rounded p-1 active:bg-zinc-700"
        onPress={() => openActionSheet()}
      >
        <FeatherIcon
          name="more-horizontal"
          size={20}
          className="text-zinc-300"
        />
      </Pressable>
    </Pressable>
  );
}
