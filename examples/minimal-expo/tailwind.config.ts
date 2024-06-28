// @ts-expect-error - no types
import nativewind from "nativewind/preset";
import { hairlineWidth } from "nativewind/theme";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [nativewind],
  theme: {
    extend: {
      borderWidth: {
        hairline: hairlineWidth(),
        DEFAULT: hairlineWidth(),
      },
    },
  },
} satisfies import("tailwindcss").Config;
