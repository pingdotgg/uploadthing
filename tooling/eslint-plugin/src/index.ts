import noHardcodedVersion from "./rules/no-hardcoded-version-in-test";
import noThrowingPromises from "./rules/no-throwing-promises";

const recommended = {
  plugins: ["@uploadthing"],
  rules: {
    ["@uploadthing/no-throwing-promises"]: "error",
  },
};

export const rules = {
  "no-throwing-promises": noThrowingPromises,
  "no-hard-coded-version-in-test": noHardcodedVersion,
};

export const configs = { recommended };
