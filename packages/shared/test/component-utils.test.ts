import { describe, expect, it } from "vitest";

import { generateMimeTypes } from "../src/component-utils";

describe("generateMimeTypes", () => {
  it("dumps all mime-types out when there's a generic type", () => {
    const [imageMimes] = generateMimeTypes(["image"]);
    expect(imageMimes).toContain("image/*");
    expect(imageMimes).toContain("image/png");
    expect(imageMimes).toContain("image/jpeg");
    expect(imageMimes).toContain("image/gif");
    expect(imageMimes).toContain("image/webp");
  });

  it("generates an empty array when there's 'blob' in the list", () => {
    expect(generateMimeTypes(["blob"])).toEqual([]);
    expect(generateMimeTypes(["image", "blob"])).toEqual([]);
  });
});
