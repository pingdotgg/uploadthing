import { describe, expect, it } from "vitest";

import { UTFile } from "../src/sdk/ut-file";

describe("UTFile", () => {
  it("can be constructed using Blob", async () => {
    const blob = new Blob(["foo"], { type: "text/plain" });
    const file = new UTFile([blob], "foo.txt");
    expect(file.type).toBe("text/plain");
    await expect(file.text()).resolves.toBe("foo");

    const fileWithId = new UTFile([blob], "foo.txt", { customId: "foo" });
    expect(fileWithId.customId).toBe("foo");
  });

  it("can be constructed using string", async () => {
    const file = new UTFile(["foo"], "foo.txt");
    expect(file.type).toBe("text/plain");
    await expect(file.text()).resolves.toBe("foo");
  });
});
