import "./styles.css";

import FeatherIcon from "@expo/vector-icons/Feather";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { cssInterop } from "nativewind";
import {
  GestureHandlerRootView,
  RectButton,
} from "react-native-gesture-handler";

import { TRPCProvider } from "~/utils/trpc";

export default function RootLayout() {
  return (
    <TRPCProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
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
      </GestureHandlerRootView>

      <StatusBar />
    </TRPCProvider>
  );
}

/**
 * Add CSS Styling to some 3rd party components
 * @see https://www.nativewind.dev/v4/guides/third-party-components#handling-components-with-style-attribute-props
 */
cssInterop(BottomSheetView, { className: "style" });
cssInterop(BottomSheetModal, {
  className: "style",
  bgClassName: "backgroundStyle",
});
cssInterop(FeatherIcon, { className: "style" });
cssInterop(Image, { className: "style" });
cssInterop(RectButton, { className: "style" });

/**
 * Add className type to props of some 3rd party components that don't have it
 * @see https://www.nativewind.dev/v4/guides/third-party-components#typescript
 */
declare module "react-native-gesture-handler" {
  interface RectButtonProps {
    className?: string;
  }
}
declare module "@gorhom/bottom-sheet" {
  interface BottomSheetModalProps {
    className?: string;
    bgClassName?: string;
  }
}
