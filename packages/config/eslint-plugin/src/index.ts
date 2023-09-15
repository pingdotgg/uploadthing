import noThrowingPromises from "./rules/no-throwing-promises";

const recommended = {
  plugins: ["@uploadthing"],
  rules: {
    ["@uploadthing/no-throwing-promises"]: "error",
  },
};

export const rules = {
  "no-throwing-promises": noThrowingPromises,
};

export const configs = { recommended };
