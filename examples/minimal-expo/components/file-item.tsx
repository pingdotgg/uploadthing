import { useRef } from "react";
import FeatherIcon from "@expo/vector-icons/Feather";
import * as Haptics from "expo-haptics";
import { Link } from "expo-router";
import { Animated, Text, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";

import { RouterOutputs, trpc } from "~/lib/trpc";
import { isImage } from "~/lib/utils";

const AnimatedRectButton = Animated.createAnimatedComponent(RectButton);
const AnimatedIcon = Animated.createAnimatedComponent(FeatherIcon);

export function FileItem({
  item,
}: {
  item: RouterOutputs["getFiles"][number];
}) {
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

  const threshhold = 64;
  const height = useRef(new Animated.Value(threshhold)).current;
  const threshholdHit = useRef(false);
  const swipeableRef = useRef<Swipeable>(null);

  const swipeRight = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    //Scale icon as we approach the threshold
    const scale = dragX.interpolate({
      inputRange: [-threshhold, 0],
      outputRange: [1, 0.3],
      extrapolate: "clamp",
    });

    dragX.addListener(({ value }) => {
      // Haptic feedback when we go over the threshold
      if (-value >= threshhold) {
        if (!threshholdHit.current) Haptics.impactAsync();
        threshholdHit.current = true;
      } else {
        threshholdHit.current = false;
      }
    });

    return (
      <Animated.View className="w-full bg-red-600">
        <View
          className="ml-auto flex h-full items-center justify-center"
          style={{ width: threshhold }}
        >
          <AnimatedIcon
            name="trash-2"
            size={24}
            className="text-zinc-100"
            style={{ transform: [{ scale }] }}
          />
        </View>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootFriction={6}
      rightThreshold={threshhold}
      renderRightActions={swipeRight}
      onSwipeableOpen={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.timing(height, {
          toValue: 0,
          duration: 350,
          useNativeDriver: false,
        }).start(() => deleteFile({ key: item.key }));
      }}
    >
      <Link href={`/f/${item.key}?name=${item.name}`} asChild>
        <AnimatedRectButton
          className="flex w-full flex-row items-center gap-4 bg-zinc-900"
          style={{ height }}
        >
          <FeatherIcon
            name={isImage(item.name) ? "image" : "file-text"}
            size={24}
            className="ml-4 text-zinc-100"
          />
          <View className="flex flex-1 flex-col gap-1">
            <Text
              numberOfLines={1}
              className="text-lg font-semibold text-zinc-100"
            >
              {item.name}
            </Text>
            <Text className="text-base text-zinc-300">
              Created {new Date(item.date).toLocaleString()}
            </Text>
          </View>
          <FeatherIcon
            name="chevron-right"
            size={20}
            className="mr-2 text-zinc-300"
          />
        </AnimatedRectButton>
      </Link>
    </Swipeable>
  );
}
