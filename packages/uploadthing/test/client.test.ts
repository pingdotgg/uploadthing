// @vitest-environment happy-dom

import type { AddressInfo } from "node:net";
import express from "express";
import { describe, expect, expectTypeOf, it as rawIt, vi } from "vitest";

import { generateUploadThingURL } from "@uploadthing/shared";

import { genUploader } from "../src/client";
import { createRouteHandler, createUploadthing } from "../src/express";
import type { ClientUploadedFileData } from "../src/types";
import {
  doNotExecute,
  it,
  middlewareMock,
  onErrorMock,
  requestSpy,
  requestsToDomain,
  testToken,
  uploadCompleteMock,
  useBadS3,
  useHalfBadS3,
} from "./__test-helpers";

export const setupUTServer = async () => {
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
    withServerData: f(
      { text: { maxFileSize: "4MB" } },
      { awaitServerData: true },
    )
      .middleware((opts) => {
        middlewareMock(opts);
        return {};
      })
      .onUploadError(onErrorMock)
      .onUploadComplete((opts) => {
        uploadCompleteMock(opts);

        return { foo: "bar" as const };
      }),
    noServerData: f(
      { text: { maxFileSize: "4MB" } },
      { awaitServerData: false },
    )
      .middleware((opts) => {
        middlewareMock(opts);
        return {};
      })
      .onUploadError(onErrorMock)
      .onUploadComplete((opts) => {
        uploadCompleteMock(opts);

        return { foo: "bar" as const };
      }),
  };

  const app = express();
  app.use(
    "/api/uploadthing",
    createRouteHandler({
      router,
      config: {
        uploadthingToken: testToken.encoded,
        isDev: true,
      },
    }),
  );

  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  await new Promise((res) => server.once("listening", res));

  const { uploadFiles } = genUploader<typeof router>({
    package: "vitest",
    url: `http://localhost:${port}`,
  });

  return {
    uploadFiles,
    close: () => new Promise((res) => server.close(res)),
  };
};

rawIt(
  "propagates awaitServerData config on server to the client `serverData` property",
  async () => {
    const { uploadFiles, close } = await setupUTServer();
    const file = new File(["foo"], "foo.txt", { type: "text/plain" });

    doNotExecute(async () => {
      const res1 = await uploadFiles("withServerData", { files: [file] });
      expectTypeOf<ClientUploadedFileData<{ foo: "bar" }>[]>(res1);

      const res2 = await uploadFiles("noServerData", { files: [file] });
      expectTypeOf<ClientUploadedFileData<null>[]>(res2);
    });

    await close();
  },
);

describe("uploadFiles", () => {
  it("uploads with presigned post", async ({ db }) => {
    const { uploadFiles, close } = await setupUTServer();
    const file = new File(["foo"], "foo.txt", { type: "text/plain" });

    await expect(uploadFiles("foo", { files: [file] })).resolves.toEqual([
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

    await close();
  });

  it("uploads with multipart upload", async ({ db }) => {
    const { uploadFiles, close } = await setupUTServer();
    const bigFile = new File([new ArrayBuffer(10 * 1024 * 1024)], "foo.txt", {
      type: "text/plain",
    });

    await expect(uploadFiles("foo", { files: [bigFile] })).resolves.toEqual([
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

    await close();
  });

  it("sends custom headers if set (static object)", async ({ db }) => {
    const { uploadFiles, close } = await setupUTServer();

    const file = new File(["foo"], "foo.txt", { type: "text/plain" });
    await expect(
      uploadFiles("foo", {
        files: [file],
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

    await close();
  });

  it("sends custom headers if set (async function)", async ({ db }) => {
    const { uploadFiles, close } = await setupUTServer();

    const file = new File(["foo"], "foo.txt", { type: "text/plain" });
    await expect(
      uploadFiles("foo", {
        files: [file],
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

    await close();
  });

  // We don't retry PSPs, maybe we should?
  // it("succeeds after retries (PSP)", async ({ db }) => {
  //   const { uploadFiles, close } = await setupUTServer();
  //   useHalfBadS3();

  //   const file = new File(["foo"], "foo.txt", { type: "text/plain" });

  //   await expect(
  //     uploadFiles("foo", { files: [file] }),
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
    const { uploadFiles, close } = await setupUTServer();
    useHalfBadS3();

    const bigFile = new File([new ArrayBuffer(10 * 1024 * 1024)], "foo.txt", {
      type: "text/plain",
    });

    await expect(uploadFiles("foo", { files: [bigFile] })).resolves.toEqual([
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

    await close();
  });

  it("reports of failed post upload", async ({ db }) => {
    const { uploadFiles, close } = await setupUTServer();
    useBadS3();

    const file = new File(["foo"], "foo.txt", { type: "text/plain" });

    await expect(
      uploadFiles("foo", { files: [file] }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[UploadThingError: Failed to upload file foo.txt to S3]`,
    );

    expect(requestsToDomain("amazonaws.com")).toHaveLength(1);
    expect(onErrorMock).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith(
      generateUploadThingURL("/v6/failureCallback"),
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

    await close();
  });

  it("reports of failed multipart upload", async ({ db }) => {
    const { uploadFiles, close } = await setupUTServer();
    useBadS3();

    const bigFile = new File([new ArrayBuffer(10 * 1024 * 1024)], "foo.txt", {
      type: "text/plain",
    });

    await expect(
      uploadFiles("foo", { files: [bigFile] }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[UploadThingError: Failed to upload file foo.txt to S3]`,
    );

    expect(requestsToDomain("amazonaws.com")).toHaveLength(7);
    expect(onErrorMock).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith(
      generateUploadThingURL("/v6/failureCallback"),
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

    await close();
  });

  it("handles too big file size errors", async ({ db }) => {
    const { uploadFiles, close } = await setupUTServer();

    const tooBigFile = new File(
      [new ArrayBuffer(20 * 1024 * 1024)],
      "foo.txt",
      {
        type: "text/plain",
      },
    );

    await expect(
      uploadFiles("foo", { files: [tooBigFile] }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[UploadThingError: Invalid config: FileSizeMismatch]`,
    );

    await close();
  });

  it("handles invalid file type errors", async ({ db }) => {
    const { uploadFiles, close } = await setupUTServer();

    const file = new File(["foo"], "foo.png", { type: "image/png" });

    await expect(
      uploadFiles("foo", { files: [file] }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[UploadThingError: Invalid config: InvalidFileType]`,
    );

    await close();
  });
});
