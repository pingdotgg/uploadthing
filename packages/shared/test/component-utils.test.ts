import * as E from "effect/Effect";
import { describe, expect, it } from "vitest";

import {
  generateClientDropzoneAccept,
  generateMimeTypes,
} from "../src/component-utils";
import { fillInputRouteConfig } from "../src/utils";

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

  it("accepts a route config", () => {
    const config = E.runSync(
      fillInputRouteConfig({
        image: {},
        video: {},
      }),
    );
    const [imageMimes, videoMimes] = generateMimeTypes(config);
    expect(imageMimes).toContain("image/*");
    expect(imageMimes).toContain("image/png");
    expect(imageMimes).toContain("image/jpeg");
    expect(imageMimes).toContain("image/gif");
    expect(imageMimes).toContain("image/webp");

    expect(videoMimes).toContain("video/*");
    expect(videoMimes).toContain("video/mp4");
    expect(videoMimes).toContain("video/webm");
  });
});

describe("generateClientDropzoneAccept", () => {
  it("includes file extensions for specific MIME types", () => {
    const result = generateClientDropzoneAccept(["application/java-archive"]);
    expect(result).toEqual({
      "application/java-archive": [".jar", ".war", ".ear"],
    });
  });

  it("includes file extensions for application/pdf via 'pdf' shorthand", () => {
    const result = generateClientDropzoneAccept(["pdf"]);
    expect(result).toEqual({
      "application/pdf": [".pdf"],
    });
  });

  it("returns empty object for blob type", () => {
    const result = generateClientDropzoneAccept(["blob"]);
    expect(result).toEqual({});
  });

  it("includes extensions for generic types like 'image'", () => {
    const result = generateClientDropzoneAccept(["image"]);
    const keys = Object.keys(result);
    expect(keys).toHaveLength(1);

    const extensions = Object.values(result)[0]!;
    expect(extensions).toContain(".png");
    expect(extensions).toContain(".jpg");
    expect(extensions).toContain(".gif");
    expect(extensions).toContain(".webp");
  });

  it("handles MIME types with no known extensions gracefully", () => {
    const result = generateClientDropzoneAccept(["application/x-unknown-type"]);
    expect(result).toEqual({
      "application/x-unknown-type": [],
    });
  });

  it("handles multiple file types", () => {
    const result = generateClientDropzoneAccept([
      "application/java-archive",
      "pdf",
    ]);
    expect(result["application/java-archive"]).toEqual([
      ".jar",
      ".war",
      ".ear",
    ]);
    expect(result["application/pdf"]).toEqual([".pdf"]);
  });
});
