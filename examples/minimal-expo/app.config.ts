import type { ExpoConfig } from "expo/config";

export default (): ExpoConfig => ({
  name: "Minimal Expo x UploadThing",
  slug: "minimal-expo",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "myapp",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.jpg",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#ffffff",
    },
  },

  web: {
    bundler: "metro",
    output: "server",
  },
  plugins: ["expo-router"],
  experiments: {
    typedRoutes: true,
  },
});
