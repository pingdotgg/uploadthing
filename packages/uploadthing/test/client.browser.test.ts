import { http } from "msw";
import { setupWorker } from "msw/browser";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from "vitest";

import { genUploader } from "../src/client";
import { createRouteHandler, createUploadthing } from "../src/server";
import type {
  ClientUploadedFileData,
  GenerateUploaderOptions,
} from "../src/types";
import {
  doNotExecute,
  fileUrlPattern,
  handlers,
  middlewareMock,
  onErrorMock,
  requestSpy,
  testToken,
  uploadCompleteMock,
} from "./__test-helpers";

const worker = setupWorker(...handlers);
beforeAll(() => worker.start({ quiet: true, onUnhandledRequest: "bypass" }));
afterAll(() => worker.stop());

export const setupUTServer = async (
  clientOpts?: Partial<GenerateUploaderOptions>,
) => {
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

  const handler = createRouteHandler({
    router,
    config: {
      token: testToken.encoded,
      isDev: true,
    },
  });

  const port = Math.floor(Math.random() * 10000) + 10000;
  const url = `http://localhost:${port}`;
  worker.use(...handlers, http.all(`${url}/api/uploadthing`, handler));

  const { uploadFiles } = genUploader<typeof router>({
    package: "vitest",
    url,
    ...clientOpts,
  });

  return {
    uploadFiles,
    [Symbol.dispose]: () => {
      // Restore to original handlers
      worker.use(...handlers);
    },
  };
};

it("propagates awaitServerData config on server to the client `serverData` property", async () => {
  using $ = await setupUTServer();
  const file = new File(["foo"], "foo.txt", { type: "text/plain" });

  doNotExecute(async () => {
    const res1 = await $.uploadFiles("withServerData", { files: [file] });
    expectTypeOf<ClientUploadedFileData<{ foo: "bar" }>[]>(res1);

    const res2 = await $.uploadFiles("noServerData", { files: [file] });
    expectTypeOf<ClientUploadedFileData<null>[]>(res2);
  });
});

describe("uploadFiles", () => {
  it("uploads file using presigned PUT", async () => {
    using $ = await setupUTServer();
    const file = new File(["foo"], "foo.txt", { type: "text/plain" });

    await expect(
      $.uploadFiles((routeRegistry) => routeRegistry.foo, { files: [file] }),
    ).resolves.toEqual([
      {
        name: "foo.txt",
        size: 3,
        type: "text/plain",
        customId: null,
        serverData: null,
        lastModified: expect.any(Number),
        key: expect.stringMatching(/.+/),
        url: expect.stringMatching(fileUrlPattern()),
        appUrl: expect.stringMatching(fileUrlPattern()),
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
  });

  it("sends custom headers if set (static object)", async () => {
    using $ = await setupUTServer();

    const file = new File(["foo"], "foo.txt", { type: "text/plain" });
    await expect(
      $.uploadFiles((routeRegistry) => routeRegistry.foo, {
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
        url: expect.stringMatching(fileUrlPattern()),
        appUrl: expect.stringMatching(fileUrlPattern()),
        fileHash: expect.any(String),
      },
    ]);

    expect(
      Object.fromEntries(middlewareMock.mock.calls[0]![0]!.req.headers),
    ).toMatchObject({
      authorization: "Bearer my-auth-token",
      "x-uploadthing-package": "vitest",
      "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
    });
  });

  it("sends custom headers if set (async function)", async () => {
    using $ = await setupUTServer();

    const file = new File(["foo"], "foo.txt", { type: "text/plain" });
    await expect(
      $.uploadFiles("foo", {
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
        url: expect.stringMatching(fileUrlPattern()),
        appUrl: expect.stringMatching(fileUrlPattern()),
        fileHash: expect.any(String),
      },
    ]);

    expect(
      Object.fromEntries(middlewareMock.mock.calls[0]![0]!.req.headers),
    ).toMatchObject({
      authorization: "Bearer my-auth-token",
      "x-uploadthing-package": "vitest",
      "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
    });
  });

  it("uses custom fetch implementation if set", async () => {
    const fetchFn = vi.fn();

    using $ = await setupUTServer({
      fetch: (input, init) => {
        fetchFn(input, init);
        return window.fetch(input, init);
      },
    });

    const file = new File(["foo"], "foo.txt", { type: "text/plain" });
    await $.uploadFiles("foo", { files: [file] });

    expect(fetchFn).toHaveBeenCalled();
  });

  // Should we retry?
  // it("succeeds after retries", { timeout: 15e3 }, async () => {
  //   using $ = await setupUTServer();
  //   useHalfBadS3();

  //   const bigFile = new File([new ArrayBuffer(10 * 1024 * 1024)], "foo.txt", {
  //     type: "text/plain",
  //   });

  //   await expect($.uploadFiles("foo", { files: [bigFile] })).resolves.toEqual([
  //     {
  //       name: "foo.txt",
  //       size: 10485760,
  //       type: "text/plain",
  //       customId: null,
  //       serverData: null,
  //       key: "abc-123.txt",
  //       url: "https://app-1.ufs.sh/f/abc-123.txt",
  //     },
  //   ]);
  //   expect(onErrorMock).not.toHaveBeenCalled();
  //   await vi.waitUntil(() => uploadCompleteMock.mock.calls.length > 0, {
  //     timeout: 5000,
  //   });
  // });

  it("handles too big file size errors", async () => {
    using $ = await setupUTServer();

    const tooBigFile = new File(
      [new ArrayBuffer(20 * 1024 * 1024)],
      "foo.txt",
      {
        type: "text/plain",
      },
    );

    await expect(
      $.uploadFiles("foo", { files: [tooBigFile] }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[UploadThingError: Invalid config: FileSizeMismatch]`,
    );
  });

  it("handles too many files errors", async () => {
    using $ = await setupUTServer();

    const file1 = new File(["foo"], "foo.txt", { type: "text/plain" });
    const file2 = new File(["bar"], "bar.txt", { type: "text/plain" });

    await expect(
      $.uploadFiles("foo", { files: [file1, file2] }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[UploadThingError: Invalid config: FileCountMismatch]`,
    );
  });

  it("handles invalid file type errors", async () => {
    using $ = await setupUTServer();

    const file = new File(["foo"], "foo.png", { type: "image/png" });

    await expect(
      $.uploadFiles("foo", { files: [file] }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[UploadThingError: Invalid config: InvalidFileType]`,
    );
  });

  it("runs onUploadBegin before uploading (single file)", async () => {
    using $ = await setupUTServer();

    const file = new File(["foo"], "foo.txt", { type: "text/plain" });
    const onUploadBegin = vi.fn();

    await $.uploadFiles("foo", {
      files: [file],
      onUploadBegin,
    });

    expect(onUploadBegin).toHaveBeenCalledWith({ file: "foo.txt" });
  });

  it("runs onUploadBegin before uploading (multi file)", async () => {
    using $ = await setupUTServer();

    const file1 = new File(["foo"], "foo.txt", { type: "text/plain" });
    const file2 = new File(["bar"], "bar.txt", { type: "text/plain" });
    const onUploadBegin = vi.fn();

    await $.uploadFiles("multi", {
      files: [file1, file2],
      onUploadBegin,
    });

    expect(onUploadBegin).toHaveBeenCalledWith({ file: "foo.txt" });
    expect(onUploadBegin).toHaveBeenCalledWith({ file: "bar.txt" });
  });
});
