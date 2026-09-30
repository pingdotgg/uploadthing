import * as E from "effect/Effect";
import { describe, expect, it } from "vitest";

import {
  generateClientDropzoneAccept,
  generateMimeTypes,
} from "../src/component-utils";
import { acceptPropAsAcceptAttr } from "../src/dropzone-utils";
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

  it("includes file extensions for specific MIME types", () => {
    const [jarAccept] = generateMimeTypes(["application/java-archive"]);
    expect(jarAccept).toContain("application/java-archive");
    expect(jarAccept).toContain(".jar");
    expect(jarAccept).toContain(".war");
    expect(jarAccept).toContain(".ear");

    const [pdfAccept] = generateMimeTypes(["pdf"]);
    expect(pdfAccept).toContain("application/pdf");
    expect(pdfAccept).toContain(".pdf");
  });
});

describe("generateClientDropzoneAccept", () => {
  it("maps specific MIME types to their extensions for the file picker", () => {
    const accept = generateClientDropzoneAccept(["application/java-archive"]);
    expect(accept).toEqual({
      "application/java-archive": [".jar", ".war", ".ear"],
    });

    const acceptAttr = acceptPropAsAcceptAttr(accept);
    expect(acceptAttr).toContain("application/java-archive");
    expect(acceptAttr).toContain(".jar");
  });

  it("returns an empty accept map when blob is allowed", () => {
    expect(generateClientDropzoneAccept(["blob"])).toEqual({});
    expect(generateClientDropzoneAccept(["image", "blob"])).toEqual({});
  });
});
