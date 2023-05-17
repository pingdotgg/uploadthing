import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

// This is the main layout of the app
// It wraps your pages with the providers they need
const RootLayout = () => {
  return (
    <SafeAreaProvider>
      {/*
        The Stack component displays the current page.
        It also allows you to configure your screens 
      */}
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#f472b6",
          },
        }}
      />
      <StatusBar />
    </SafeAreaProvider>
  );
};

export default RootLayout;
