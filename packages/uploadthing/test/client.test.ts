// @vitest-environment happy-dom

import type { AddressInfo } from "node:net";
import express from "express";
import { describe, expect, expectTypeOf, it as rawIt, vi } from "vitest";

import { genUploader } from "../src/client";
import { createRouteHandler, createUploadthing } from "../src/express";
import type { ClientUploadedFileData } from "../src/types";
import {
  appUrlPattern,
  doNotExecute,
  fileUrlPattern,
  it,
  middlewareMock,
  onErrorMock,
  requestSpy,
  testToken,
  uploadCompleteMock,
  UTFS_IO_URL,
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
    multi: f({ text: { maxFileSize: "16MB", maxFileCount: 2 } })
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
        token: testToken.encoded,
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
  it("uploads file using presigned PUT", async ({ db }) => {
    const { uploadFiles, close } = await setupUTServer();
    const file = new File(["foo"], "foo.txt", { type: "text/plain" });

    await expect(
      uploadFiles((rr) => rr.foo, { files: [file] }),
    ).resolves.toEqual([
      {
        name: "foo.txt",
        size: 3,
        type: "text/plain",
        customId: null,
        serverData: null,
        lastModified: expect.any(Number),
        key: expect.stringMatching(/.+/),
        url: expect.stringMatching(fileUrlPattern),
        appUrl: expect.stringMatching(appUrlPattern()),
        fileHash: expect.any(String),
      },
    ]);

    expect(requestSpy).toHaveBeenCalledWith(
      expect.stringContaining("x-ut-file-name=foo.txt"),
      expect.objectContaining({
        method: "PUT",
        body: expect.any(FormData),
      }),
    );

    expect(middlewareMock).toHaveBeenCalledOnce();
    expect(onErrorMock).not.toHaveBeenCalled();
    /**
     * @todo: Make the mock streaming so we can hit the callback??
     */
    // await vi.waitUntil(() => uploadCompleteMock.mock.calls.length > 0, {
    //   timeout: 5000,
    // });

    await close();
  });

  it("sends custom headers if set (static object)", async ({ db }) => {
    const { uploadFiles, close } = await setupUTServer();

    const file = new File(["foo"], "foo.txt", { type: "text/plain" });
    await expect(
      uploadFiles((rr) => rr.foo, {
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
        lastModified: expect.any(Number),
        key: expect.stringMatching(/.+/),
        url: expect.stringMatching(fileUrlPattern),
        appUrl: expect.stringMatching(appUrlPattern()),
        fileHash: expect.any(String),
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
        lastModified: expect.any(Number),
        key: expect.stringMatching(/.+/),
        url: expect.stringMatching(fileUrlPattern),
        appUrl: expect.stringMatching(appUrlPattern()),
        fileHash: expect.any(String),
      },
    ]);

    expect(middlewareMock.mock.calls[0][0].req.headers).toMatchObject({
      authorization: "Bearer my-auth-token",
      "x-uploadthing-package": "vitest",
      "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
    });

    await close();
  });

  // Should we retry?
  // it("succeeds after retries", { timeout: 15e3 }, async ({ db }) => {
  //   const { uploadFiles, close } = await setupUTServer();
  //   useHalfBadS3();

  //   const bigFile = new File([new ArrayBuffer(10 * 1024 * 1024)], "foo.txt", {
  //     type: "text/plain",
  //   });

  //   await expect(uploadFiles("foo", { files: [bigFile] })).resolves.toEqual([
  //     {
  //       name: "foo.txt",
  //       size: 10485760,
  //       type: "text/plain",
  //       customId: null,
  //       serverData: null,
  //       key: "abc-123.txt",
  //       url: "https://utfs.io/f/abc-123.txt",
  //     },
  //   ]);
  //   expect(onErrorMock).not.toHaveBeenCalled();
  //   await vi.waitUntil(() => uploadCompleteMock.mock.calls.length > 0, {
  //     timeout: 5000,
  //   });

  //   await close();
  // });

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

  it("handles too many files errors", async ({ db }) => {
    const { uploadFiles, close } = await setupUTServer();

    const file1 = new File(["foo"], "foo.txt", { type: "text/plain" });
    const file2 = new File(["bar"], "bar.txt", { type: "text/plain" });

    await expect(
      uploadFiles("foo", { files: [file1, file2] }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[UploadThingError: Invalid config: FileCountMismatch]`,
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

  it("runs onUploadBegin before uploading (single file)", async () => {
    const { uploadFiles, close } = await setupUTServer();

    const file = new File(["foo"], "foo.txt", { type: "text/plain" });
    const onUploadBegin = vi.fn();

    await uploadFiles("foo", {
      files: [file],
      onUploadBegin,
    });

    expect(onUploadBegin).toHaveBeenCalledWith({ file: "foo.txt" });

    await close();
  });

  it("runs onUploadBegin before uploading (multi file)", async () => {
    const { uploadFiles, close } = await setupUTServer();

    const file1 = new File(["foo"], "foo.txt", { type: "text/plain" });
    const file2 = new File(["bar"], "bar.txt", { type: "text/plain" });
    const onUploadBegin = vi.fn();

    await uploadFiles("multi", {
      files: [file1, file2],
      onUploadBegin,
    });

    expect(onUploadBegin).toHaveBeenCalledWith({ file: "foo.txt" });
    expect(onUploadBegin).toHaveBeenCalledWith({ file: "bar.txt" });

    await close();
  });
});
