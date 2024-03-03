import { beforeEach, vi } from "vitest";

import type { FetchEsque } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../src/internal/constants";
import type { ActionType, PSPResponse } from "../src/internal/types";

export const fetchMock = vi.fn();
export const middlewareMock = vi.fn();
export const uploadCompleteMock = vi.fn();
beforeEach(() => {
  middlewareMock.mockClear();
  uploadCompleteMock.mockClear();
  fetchMock.mockClear();
});

export const createApiUrl = (slug: string, action?: ActionType) => {
  const url = new URL("https://not-used.com");
  url.searchParams.set("slug", slug);
  if (action) url.searchParams.set("actionType", action);
  return url;
};

export const baseHeaders = {
  "x-uploadthing-version": UPLOADTHING_VERSION,
  "x-uploadthing-package": "vitest",
};

const mockedPresignedPost: PSPResponse = {
  key: "abc-123.txt",
  url: "https://bucket.s3.amazonaws.com/abc-123.txt",
  fields: { key: "abc-123.txt" },
  fileUrl: "https://utfs.io/f/abc-123.txt",
  contentDisposition: "inline",
  fileName: "foo.txt",
  fileType: "text/plain",
  pollingUrl: "https://uploadthing.com/api/serverCallback",
  pollingJwt: "random-jwt",
};

export const mockExternalRequests: FetchEsque = async (url, init) => {
  fetchMock(url, init);
  if (url instanceof Request) return new Response("Wut?", { status: 500 });
  url = new URL(url);

  // Mock file downloads
  if (url.host === "cdn.foo.com") {
    return new Response("Lorem ipsum doler sit amet", {
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Mock UT Api
  if (url.host === "uploadthing.com") {
    if (url.pathname === "/api/uploadFiles") {
      return Response.json({
        // FIXME: Read body and return a better response?
        data: [mockedPresignedPost, mockedPresignedPost],
      });
    }
    if (url.pathname === "/api/prepareUpload") {
      return Response.json([mockedPresignedPost, mockedPresignedPost]);
    }
    if (url.pathname === "/api/completeMultipart") {
      return Response.json({ success: true });
    }
    if (url.pathname === "/api/failureCallback") {
      return Response.json({ success: true });
    }
    if (url.pathname.startsWith("/api/pollUpload")) {
      return Response.json({ status: "done" });
    }
    if (url.pathname === "/api/requestFileAccess") {
      return Response.json({ url: "https://example.com" });
    }
  }

  // Mock S3
  if (url.host === "bucket.s3.amazonaws.com") {
    return new Response(null, { status: 204 });
  }

  // Else 404 (shouldn't happen, mock the requests we expect to make)
  return new Response("Not Found", { status: 404 });
};
