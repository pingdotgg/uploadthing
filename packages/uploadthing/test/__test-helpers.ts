/* eslint-disable no-restricted-globals */
/* eslint-disable no-console */
import { http, HttpResponse } from "msw";
import { beforeEach, it as itBase, vi } from "vitest";

import { lookup } from "@uploadthing/mime-types";
import { generateUploadThingURL, isObject } from "@uploadthing/shared";
import type { FetchEsque } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../src/internal/constants";
import type {
  ActionType,
  MPUResponse,
  PresignedBase,
  PSPResponse,
} from "../src/internal/types";

export interface MockDbInterface {
  files: any[];
  insertFile: (file: any) => void;
  getFileByKey: (key: string) => any;
}

export const it = itBase.extend<{ db: MockDbInterface }>({
  // eslint-disable-next-line no-empty-pattern
  db: async ({}, use) => {
    const files: any[] = [];
    const db: MockDbInterface = {
      files,
      insertFile: (file) => files.push(file),
      getFileByKey: (key) => files.find((f) => f.key === key),
    };
    await use(db);
    files.length = 0;
  },
});

export const s3Mock = vi.fn();
export const fetchMock = vi.fn();
export const middlewareMock = vi.fn();
export const uploadCompleteMock = vi.fn();
export const onErrorMock = vi.fn();
beforeEach(() => {
  s3Mock.mockClear();
  middlewareMock.mockClear();
  uploadCompleteMock.mockClear();
  fetchMock.mockClear();
  onErrorMock.mockClear();
});

export const createApiUrl = (slug: string, action?: ActionType) => {
  const url = new URL("http://localhost:3000");
  url.searchParams.set("slug", slug);
  if (action) url.searchParams.set("actionType", action);
  return url;
};

export const baseHeaders = {
  "x-uploadthing-version": UPLOADTHING_VERSION,
  "x-uploadthing-package": "vitest",
};

const mockPresigned = (file: {
  name: string;
  size: number;
  customId: string | null;
}): PSPResponse | MPUResponse => {
  const base: PresignedBase = {
    contentDisposition: "inline",
    customId: file.customId ?? null,
    fileName: file.name,
    fileType: lookup(file.name) as any,
    fileUrl: "https://utfs.io/f/abc-123.txt",
    key: "abc-123.txt",
    pollingJwt: "random-jwt",
    pollingUrl: generateUploadThingURL("/api/serverCallback"),
  };
  if (file.size > 5 * 1024 * 1024) {
    return {
      ...base,
      chunkCount: 2,
      chunkSize: file.size / 2,
      uploadId: "random-upload-id",
      urls: [
        "https://bucket.s3.amazonaws.com/abc-123.txt?partNumber=1&uploadId=random-upload-id",
        "https://bucket.s3.amazonaws.com/abc-123.txt?partNumber=2&uploadId=random-upload-id",
      ],
    };
  }
  return {
    ...base,
    url: "https://bucket.s3.amazonaws.com",
    fields: { key: "abc-123.txt" },
  };
};

export const mockExternalRequests =
  (db: MockDbInterface): FetchEsque =>
  async (_url, init) => {
    fetchMock(_url, init);
    if (_url instanceof Request) return new Response("Wut?", { status: 500 });
    const url = new URL(_url);

    // Pass through localhost requests
    if (url.host.startsWith("localhost")) {
      return fetch(_url, init);
    }

    // Mock file downloads
    if (url.host === "cdn.foo.com") {
      return new Response("Lorem ipsum doler sit amet", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Mock UT Api
    if (url.host === "uploadthing.com") {
      const body = (() => {
        if ((init?.method ?? "GET") === "GET") return null;
        const json = JSON.parse(init?.body as string);
        if (!isObject(json)) throw new Error("Expected body to be an object");
        return json;
      })();

      if (url.pathname === "/api/uploadFiles") {
        const presigneds = (body?.files as any[]).map((file) => {
          const presigned = mockPresigned(file);
          db.insertFile({
            ...file,
            key: presigned.key,
          });
          return presigned;
        });
        return Response.json({ data: presigneds });
      }
      if (url.pathname === "/api/prepareUpload") {
        const presigneds = (body?.files as any[]).map((file) => {
          const presigned = mockPresigned(file);
          db.insertFile({
            ...file,
            key: presigned.key,
            callbackUrl: body!.callbackUrl,
            callbackSlug: body!.callbackSlug,
          });
          return presigned;
        });
        return Response.json(presigneds);
      }
      if (url.pathname === "/api/completeMultipart") {
        return Response.json({ success: true });
      }
      if (url.pathname === "/api/failureCallback") {
        return Response.json({ success: true });
      }
      if (url.pathname.startsWith("/api/pollUpload")) {
        const key = url.pathname.slice("/api/pollUpload/".length);
        console.log("Polled for key", key);
        console.log("db contains", db.files);
        return Response.json({
          status: "done",
          fileData: db.getFileByKey(key),
        });
      }
      if (url.pathname === "/api/requestFileAccess") {
        return Response.json({ url: "https://example.com" });
      }
      if (url.pathname === "/api/serverCallback") {
        return Response.json({ success: true });
      }
    }

    // Mock S3
    if (url.host === "bucket.s3.amazonaws.com") {
      return new Response(null, { status: 204 });
    }

    // Else 404 (shouldn't happen, mock the requests we expect to make)
    console.warn(
      "[UT FETCH MOCK] :: Unhandled request. Did you mean to mock this?",
      { url, init },
    );
    return new Response("Not Found", { status: 404 });
  };

const staticAssetServer = [
  http.get("https://cdn.foo.com/:fileKey", () => {
    return HttpResponse.text("Lorem ipsum doler sit amet", {
      headers: { "Content-Type": "text/plain" },
    });
  }),
];

const s3Api = [
  http.post("https://bucket.s3.amazonaws.com/", ({ params, request }) => {
    s3Mock(params, request);
    return HttpResponse.json(null, { status: 204 });
  }),
  http.put("https://bucket.s3.amazonaws.com/:key", ({ params, request }) => {
    s3Mock(params, request);
    return HttpResponse.json(null, {
      status: 204,
      headers: { ETag: "abc123" },
    });
  }),
];

export const handlers = [...staticAssetServer, ...s3Api];
