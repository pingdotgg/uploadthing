import { describe, expect, it } from "vitest";

import { semverLite } from "../src/utils";

describe("semverLite", () => {
  it.each([
    ["^7.2.0", "7.10.0", true],
    ["^7.10.0", "7.2.0", false],
    ["^7.2.5", "7.2.4", false],
    ["^7.2.5", "7.2.5", true],
    ["^7.2.5", "7.3.0", true],
    ["^7.2.5", "8.0.0", false],
    ["~7.2.5", "7.2.4", false],
    ["~7.2.5", "7.2.10", true],
    ["~7.2.5", "7.3.0", false],
    ["7.2.5", "7.2.5", true],
    ["7.2.5", "7.2.6", false],
  ])("matches %s against %s as %s", (required, installed, matches) => {
    expect(semverLite(required, installed)).toBe(matches);
  });
});
