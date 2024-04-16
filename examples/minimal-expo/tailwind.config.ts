// @ts-expect-error - no types
import nativewind from "nativewind/preset";

export default {
  content: ["./app/**/*.{ts,tsx}"],
  presets: [nativewind],
};
