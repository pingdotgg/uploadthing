// @vitest-environment happy-dom

import express from "express";
import { describe, expect, vi } from "vitest";

import { generateUploadThingURL } from "@uploadthing/shared";

import { genUploader } from "../src/client";
import { createRouteHandler, createUploadthing } from "../src/express";
import {
  it,
  middlewareMock,
  onErrorMock,
  requestSpy,
  requestsToDomain,
  uploadCompleteMock,
  useBadS3,
  useHalfBadS3,
} from "./__test-helpers";

export const setupUTServer = () => {
  const f = createUploadthing({
    errorFormatter(err) {
      return { message: err.message };
    },
  });
  const router = {
    foo: f({ text: { maxFileSize: "16MB" } })
      .middleware((opts) => {
        middlewareMock(opts);
        return {};
      })
      .onUploadError(onErrorMock)
      .onUploadComplete(uploadCompleteMock),
  };

  const app = express();
  app.use(
    "/api/uploadthing",
    createRouteHandler({
      router,
      config: {
        uploadthingSecret: "sk_test_123",
        isDev: true,
      },
    }),
  );

  const server = app.listen();
  const port = (server.address() as { port: number }).port;

  const uploadFiles = genUploader<typeof router>({
    package: "vitest",
    url: `http://localhost:${port}`,
  });

  return { uploadFiles, close: () => server.close() };
};

describe("uploadFiles", () => {
  it("uploads with presigned post", async ({ db }) => {
    const { uploadFiles, close } = setupUTServer();
    const file = new File(["foo"], "foo.txt", { type: "text/plain" });

    await expect(
      uploadFiles("foo", {
        files: [file],
        skipPolling: true,
      }),
    ).resolves.toEqual([
      {
        name: "foo.txt",
        size: 3,
        type: "text/plain",
        customId: null,
        serverData: null,
        key: "abc-123.txt",
        url: "https://utfs.io/f/abc-123.txt",
      },
    ]);

    expect(requestsToDomain("amazonaws.com")).toHaveLength(1);
    expect(requestSpy).toHaveBeenCalledWith(
      "https://bucket.s3.amazonaws.com/",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    );

    expect(middlewareMock).toHaveBeenCalledOnce();
    expect(onErrorMock).not.toHaveBeenCalled();
    await vi.waitUntil(() => uploadCompleteMock.mock.calls.length > 0, {
      timeout: 5000,
    });

    close();
  });

  it("uploads with multipart upload", async ({ db }) => {
    const { uploadFiles, close } = setupUTServer();
    const bigFile = new File([new ArrayBuffer(10 * 1024 * 1024)], "foo.txt", {
      type: "text/plain",
    });

    await expect(
      uploadFiles("foo", {
        files: [bigFile],
        skipPolling: true,
      }),
    ).resolves.toEqual([
      {
        name: "foo.txt",
        size: 10485760,
        type: "text/plain",
        customId: null,
        serverData: null,
        key: "abc-123.txt",
        url: "https://utfs.io/f/abc-123.txt",
      },
    ]);

    expect(requestsToDomain("amazonaws.com")).toHaveLength(2);
    expect(requestSpy).toHaveBeenCalledWith(
      "https://bucket.s3.amazonaws.com/abc-123.txt?partNumber=1&uploadId=random-upload-id",
      expect.objectContaining({
        method: "PUT",
        body: expect.any(Blob),
      }),
    );

    expect(middlewareMock).toHaveBeenCalledOnce();
    expect(onErrorMock).not.toHaveBeenCalled();
    await vi.waitUntil(() => uploadCompleteMock.mock.calls.length > 0, {
      timeout: 5000,
    });

    close();
  });

  it("sends custom headers if set (static object)", async ({ db }) => {
    const { uploadFiles, close } = setupUTServer();

    const file = new File(["foo"], "foo.txt", { type: "text/plain" });
    await expect(
      uploadFiles("foo", {
        files: [file],
        skipPolling: true,
        headers: {
          authorization: "Bearer my-auth-token",
        },
      }),
    ).resolves.toEqual([
      {
        name: "foo.txt",
        size: 3,
        type: "text/plain",
        customId: null,
        serverData: null,
        key: "abc-123.txt",
        url: "https://utfs.io/f/abc-123.txt",
      },
    ]);

    expect(middlewareMock.mock.calls[0][0].req.headers).toMatchObject({
      authorization: "Bearer my-auth-token",
      "x-uploadthing-package": "vitest",
      "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
    });

    close();
  });

  it("sends custom headers if set (async function)", async ({ db }) => {
    const { uploadFiles, close } = setupUTServer();

    const file = new File(["foo"], "foo.txt", { type: "text/plain" });
    await expect(
      uploadFiles("foo", {
        files: [file],
        skipPolling: true,
        headers: async () => ({
          authorization: "Bearer my-auth-token",
        }),
      }),
    ).resolves.toEqual([
      {
        name: "foo.txt",
        size: 3,
        type: "text/plain",
        customId: null,
        serverData: null,
        key: "abc-123.txt",
        url: "https://utfs.io/f/abc-123.txt",
      },
    ]);

    expect(middlewareMock.mock.calls[0][0].req.headers).toMatchObject({
      authorization: "Bearer my-auth-token",
      "x-uploadthing-package": "vitest",
      "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
    });

    close();
  });

  // We don't retry PSPs, maybe we should?
  // it("succeeds after retries (PSP)", async ({ db }) => {
  //   const { uploadFiles, close } = setupUTServer();
  //   useHalfBadS3();

  //   const file = new File(["foo"], "foo.txt", { type: "text/plain" });

  //   await expect(
  //     uploadFiles("foo", {
  //       files: [file],
  //       skipPolling: true,
  //     }),
  //   ).resolves.toEqual([
  //     {
  //       name: "foo.txt",
  //       size: 3,
  //       type: "text/plain",
  //       customId: null,
  //       serverData: null,
  //       key: "abc-123.txt",
  //       url: "https://utfs.io/f/abc-123.txt",
  //     },
  //   ]);

  //   expect(requestsToDomain("amazonaws.com")).toHaveLength(3);
  //   expect(onErrorMock).not.toHaveBeenCalled();

  //   close();
  // });

  it("succeeds after retries (MPU)", { timeout: 15e3 }, async ({ db }) => {
    const { uploadFiles, close } = setupUTServer();
    useHalfBadS3();

    const bigFile = new File([new ArrayBuffer(10 * 1024 * 1024)], "foo.txt", {
      type: "text/plain",
    });

    await expect(
      uploadFiles("foo", {
        files: [bigFile],
        skipPolling: true,
      }),
    ).resolves.toEqual([
      {
        name: "foo.txt",
        size: 10485760,
        type: "text/plain",
        customId: null,
        serverData: null,
        key: "abc-123.txt",
        url: "https://utfs.io/f/abc-123.txt",
      },
    ]);

    expect(onErrorMock).not.toHaveBeenCalled();
    await vi.waitUntil(() => uploadCompleteMock.mock.calls.length > 0, {
      timeout: 5000,
    });

    close();
  });

  it("reports of failed post upload", async ({ db }) => {
    const { uploadFiles, close } = setupUTServer();
    useBadS3();

    const file = new File(["foo"], "foo.txt", { type: "text/plain" });

    await expect(
      uploadFiles("foo", {
        files: [file],
        skipPolling: true,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[UploadThingError: Failed to upload file foo.txt to S3]`,
    );

    expect(requestsToDomain("amazonaws.com")).toHaveLength(1);
    expect(onErrorMock).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith(
      generateUploadThingURL("/api/failureCallback"),
      {
        body: { fileKey: "abc-123.txt", uploadId: null },
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": "sk_test_123",
          "x-uploadthing-be-adapter": "express",
          "x-uploadthing-fe-package": "vitest",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );

    close();
  });

  it("reports of failed multipart upload", async ({ db }) => {
    const { uploadFiles, close } = setupUTServer();
    useBadS3();

    const bigFile = new File([new ArrayBuffer(10 * 1024 * 1024)], "foo.txt", {
      type: "text/plain",
    });

    await expect(
      uploadFiles("foo", {
        files: [bigFile],
        skipPolling: true,
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[UploadThingError: Failed to upload file foo.txt to S3]`,
    );

    expect(requestsToDomain("amazonaws.com")).toHaveLength(2);
    expect(onErrorMock).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith(
      generateUploadThingURL("/api/failureCallback"),
      {
        body: { fileKey: "abc-123.txt", uploadId: "random-upload-id" },
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": "sk_test_123",
          "x-uploadthing-be-adapter": "express",
          "x-uploadthing-fe-package": "vitest",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );

    close();
  });
});
