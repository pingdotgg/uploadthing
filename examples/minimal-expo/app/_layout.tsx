import "./styles.css";

import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import FeatherIcon from "@expo/vector-icons/Feather";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { cssInterop } from "nativewind";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { TRPCProvider } from "~/utils/trpc";

cssInterop(Image, { className: "style" });
cssInterop(BottomSheetView, { className: "style" });
cssInterop(FeatherIcon, { className: "style" });

export default function RootLayout() {
  return (
    <TRPCProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ActionSheetProvider>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: "#27272a",
              },
              contentStyle: {
                backgroundColor: "#18181b",
              },
              headerTintColor: "#fff",
            }}
          ></Stack>
        </ActionSheetProvider>
      </GestureHandlerRootView>

      <StatusBar />
    </TRPCProvider>
  );
}
