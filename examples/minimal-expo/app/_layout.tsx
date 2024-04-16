import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { TRPCProvider } from "~/utils/api";

import "./styles.css";

import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { Image } from "expo-image";
import { cssInterop } from "nativewind";

cssInterop(Image, { className: "style" });

export default function RootLayout() {
  return (
    <TRPCProvider>
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
        >
          <Stack.Screen
            name="upload-modal"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
        </Stack>
      </ActionSheetProvider>

      <StatusBar />
    </TRPCProvider>
  );
}
