/* eslint-disable no-restricted-globals */
import { process } from "std-env";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  expectTypeOf,
  it as rawIt,
} from "vitest";

import { UTApi, UTFile } from "../src/sdk";
import type { UploadFileResult } from "../src/sdk/types";
import { it, requestSpy, resetMocks } from "./__test-helpers";

describe("uploadFiles", () => {
  const fooFile = new File(["foo"], "foo.txt", { type: "text/plain" });

  it("uploads successfully", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    const result = await utapi.uploadFiles(fooFile);

    expect(requestSpy).toHaveBeenCalledTimes(3);
    expect(requestSpy).toHaveBeenNthCalledWith(
      1,
      "https://uploadthing.com/api/uploadFiles",
      {
        body: {
          files: [{ name: "foo.txt", type: "text/plain", size: 3 }],
          metadata: {},
          contentDisposition: "inline",
        },
        headers: {
          "content-type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
    expect(requestSpy).toHaveBeenNthCalledWith(
      2,
      "https://bucket.s3.amazonaws.com/",
      expect.objectContaining({
        body: expect.any(FormData),
        method: "POST",
      }),
    );
    expect(requestSpy).toHaveBeenNthCalledWith(
      3,
      "https://uploadthing.com/api/pollUpload/abc-123.txt",
      {
        body: null,
        headers: {
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "GET",
      },
    );

    expect(result).toEqual({
      data: {
        key: "abc-123.txt",
        name: "foo.txt",
        size: 3,
        url: "https://utfs.io/f/abc-123.txt",
        customId: null,
        type: "text/plain",
      },
      error: null,
    });
  });

  it("returns array if array is passed", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    const result = await utapi.uploadFiles([fooFile]);
    expectTypeOf<UploadFileResult[]>(result);
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns single object if no array is passed", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    const result = await utapi.uploadFiles(fooFile);
    expectTypeOf<UploadFileResult>(result);
    expect(Array.isArray(result)).toBe(false);
  });

  it("accepts UTFile", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    const file = new UTFile(["foo"], "foo.txt");
    await utapi.uploadFiles(file);
    expect(file.type).toBe("text/plain");

    expect(requestSpy).toHaveBeenCalledWith(
      "https://uploadthing.com/api/uploadFiles",
      expect.objectContaining({}),
    );
  });

  it("accepts UndiciFile", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    const { File } = await import("undici");
    const file = new File(["foo"], "foo.txt");
    await utapi.uploadFiles(file);
  });

  it("accepts UTFile with customId", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    const fileWithId = new UTFile(["foo"], "foo.txt", { customId: "foo" });
    await utapi.uploadFiles(fileWithId);
    expect(fileWithId.customId).toBe("foo");

    expect(requestSpy).toHaveBeenCalledWith(
      "https://uploadthing.com/api/uploadFiles",
      {
        body: {
          files: [
            { name: "foo.txt", type: "text/plain", size: 3, customId: "foo" },
          ],
          metadata: {},
          contentDisposition: "inline",
        },
        headers: {
          "content-type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });
});

describe("uploadFilesFromUrl", () => {
  it("downloads, then uploads successfully", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    const result = await utapi.uploadFilesFromUrl(
      "https://cdn.foo.com/foo.txt",
    );

    expect(requestSpy).toHaveBeenCalledTimes(4); // download, request url, upload, poll
    expect(requestSpy).toHaveBeenNthCalledWith(
      2,
      "https://uploadthing.com/api/uploadFiles",
      {
        body: {
          files: [{ name: "foo.txt", type: "text/plain", size: 26 }],
          metadata: {},
          contentDisposition: "inline",
        },
        headers: {
          "content-type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
    expect(requestSpy).toHaveBeenNthCalledWith(
      3,
      "https://bucket.s3.amazonaws.com/",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(requestSpy).toHaveBeenNthCalledWith(
      4,
      "https://uploadthing.com/api/pollUpload/abc-123.txt",
      expect.objectContaining({}),
    );

    expect(result).toEqual({
      data: {
        key: "abc-123.txt",
        name: "foo.txt",
        size: 26,
        url: "https://utfs.io/f/abc-123.txt",
        customId: null,
        type: "text/plain",
      },
      error: null,
    });
  });

  it("returns array if array is passed", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    const result = await utapi.uploadFilesFromUrl([
      "https://cdn.foo.com/foo.txt",
      "https://cdn.foo.com/bar.txt",
    ]);
    expectTypeOf<UploadFileResult[]>(result);
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns single object if no array is passed", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    const result = await utapi.uploadFilesFromUrl(
      "https://cdn.foo.com/foo.txt",
    );
    expectTypeOf<UploadFileResult>(result);
    expect(Array.isArray(result)).toBe(false);
  });

  it("can override name", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    await utapi.uploadFilesFromUrl({
      url: "https://cdn.foo.com/my-super-long-pathname-thats-too-long-for-ut.txt",
      name: "bar.txt",
    });

    expect(requestSpy).toHaveBeenCalledWith(
      "https://uploadthing.com/api/uploadFiles",
      {
        body: {
          files: [{ name: "bar.txt", type: "text/plain", size: 26 }],
          metadata: {},
          contentDisposition: "inline",
        },
        headers: {
          "content-type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });

  it("can provide a customId", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    await utapi.uploadFilesFromUrl({
      url: "https://cdn.foo.com/foo.txt",
      customId: "my-custom-id",
    });

    expect(requestSpy).toHaveBeenCalledWith(
      "https://uploadthing.com/api/uploadFiles",
      {
        body: {
          files: [
            {
              name: "foo.txt",
              type: "text/plain",
              size: 26,
              customId: "my-custom-id",
            },
          ],
          metadata: {},
          contentDisposition: "inline",
        },
        headers: {
          "content-type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });

  // if passed data url, array contains UploadThingError
  it("returns error if data url is passed", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    const result = await utapi.uploadFilesFromUrl(
      "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==",
    );
    expect(result).toMatchInlineSnapshot(`
      {
        "data": null,
        "error": {
          "code": "BAD_REQUEST",
          "data": undefined,
          "message": "Please use uploadFiles() for data URLs. uploadFilesFromUrl() is intended for use with remote URLs only.",
        },
      }
    `);
  });

  it("preserves order if some download fails", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    const result = await utapi.uploadFilesFromUrl([
      "https://cdn.foo.com/foo.txt",
      "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==",
      "https://cdn.foo.com/bar.txt",
    ]);
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "data": {
            "customId": null,
            "key": "abc-123.txt",
            "name": "foo.txt",
            "size": 26,
            "type": "text/plain",
            "url": "https://utfs.io/f/abc-123.txt",
          },
          "error": null,
        },
        {
          "data": null,
          "error": {
            "code": "BAD_REQUEST",
            "data": undefined,
            "message": "Please use uploadFiles() for data URLs. uploadFilesFromUrl() is intended for use with remote URLs only.",
          },
        },
        {
          "data": {
            "customId": null,
            "key": "abc-123.txt",
            "name": "bar.txt",
            "size": 26,
            "type": "text/plain",
            "url": "https://utfs.io/f/abc-123.txt",
          },
          "error": null,
        },
      ]
    `);
  });
});

describe("constructor throws if no apiKey or secret is set", () => {
  it("no secret or apikey", () => {
    expect(() => new UTApi()).toThrowErrorMatchingInlineSnapshot(
      `[UploadThingError: Missing or invalid API key. API keys must start with \`sk_\`.]`,
    );
  });
  it("env is set", () => {
    process.env.UPLOADTHING_SECRET = "sk_test_foo";
    expect(() => new UTApi()).not.toThrow();
  });
  it("apikey option is passed", () => {
    expect(() => new UTApi({ apiKey: "sk_test_foo" })).not.toThrow();
  });
});

describe("getSignedURL", () => {
  it("sends request without expiresIn", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    await utapi.getSignedURL("foo");

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith(
      "https://uploadthing.com/api/requestFileAccess",
      {
        body: { fileKey: "foo" },
        headers: {
          "content-type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });

  it("sends request with valid expiresIn (1)", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    await utapi.getSignedURL("foo", { expiresIn: "1d" });

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith(
      "https://uploadthing.com/api/requestFileAccess",
      {
        body: { fileKey: "foo", expiresIn: 86400 },
        headers: {
          "content-type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });

  it("sends request with valid expiresIn (2)", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    await utapi.getSignedURL("foo", { expiresIn: "3 minutes" });

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith(
      "https://uploadthing.com/api/requestFileAccess",
      {
        body: { fileKey: "foo", expiresIn: 180 },
        headers: {
          "content-type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });

  it("throws if expiresIn is invalid", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    await expect(() =>
      // @ts-expect-error - intentionally passing invalid expiresIn
      utapi.getSignedURL("foo", { expiresIn: "something" }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[UploadThingError: expiresIn must be a valid time string, for example '1d', '2 days', or a number of seconds.]`,
    );
    expect(requestSpy).toHaveBeenCalledTimes(0);
  });

  it("throws if expiresIn is longer than 7 days", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    await expect(() =>
      utapi.getSignedURL("foo", { expiresIn: "10 days" }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[UploadThingError: expiresIn must be less than 7 days (604800 seconds).]`,
    );
    expect(requestSpy).toHaveBeenCalledTimes(0);
  });
});

describe("updateACL", () => {
  it("single file", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });

    await expect(utapi.updateACL("ut-key", "public-read")).resolves.toEqual({
      success: true,
    });

    expect(requestSpy).toHaveBeenCalledWith(
      "https://uploadthing.com/api/updateACL",
      {
        body: { updates: [{ fileKey: "ut-key", acl: "public-read" }] },
        headers: {
          "content-type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });

  it("many keys", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });

    await expect(
      utapi.updateACL(["ut-key1", "ut-key2"], "public-read"),
    ).resolves.toEqual({ success: true });

    expect(requestSpy).toHaveBeenCalledWith(
      "https://uploadthing.com/api/updateACL",
      {
        body: {
          updates: [
            { fileKey: "ut-key1", acl: "public-read" },
            { fileKey: "ut-key2", acl: "public-read" },
          ],
        },
        headers: {
          "content-type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });

  it("many keys with keytype override", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });

    await expect(
      utapi.updateACL(["my-custom-id1", "my-custom-id2"], "public-read", {
        keyType: "customId",
      }),
    ).resolves.toEqual({ success: true });

    expect(requestSpy).toHaveBeenCalledWith(
      "https://uploadthing.com/api/updateACL",
      {
        body: {
          updates: [
            { customId: "my-custom-id1", acl: "public-read" },
            { customId: "my-custom-id2", acl: "public-read" },
          ],
        },
        headers: {
          "content-type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });
});

const shouldRun =
  typeof process.env.UPLOADTHING_TEST_SECRET === "string" &&
  process.env.UPLOADTHING_TEST_SECRET.length > 0;

describe.runIf(shouldRun)(
  "smoke test with live api",
  { timeout: 15_000 },
  () => {
    const utapi = new UTApi({
      apiKey: shouldRun ? process.env.UPLOADTHING_TEST_SECRET! : "sk_foo",
    });

    const localInfo = { totalBytes: 0, filesUploaded: 0 };
    const TEST_APP_LIMIT_BYTES = 2147483648;

    // Clean up any files before and after tests
    beforeAll(async () => {
      resetMocks();
      const { files } = await utapi.listFiles();
      await utapi.deleteFiles(files.map((f) => f.key));
    });
    afterAll(async () => {
      const { files } = await utapi.listFiles();
      await utapi.deleteFiles(files.map((f) => f.key));
    });

    // These will all run in serial

    rawIt("should have no files", async () => {
      const { files, hasMore } = await utapi.listFiles();
      expect(files).toHaveLength(0);
      expect(hasMore).toBe(false);

      const usageInfo = await utapi.getUsageInfo();
      expect(usageInfo).toEqual({
        totalBytes: 0,
        appTotalBytes: 0,
        filesUploaded: 0,
        limitBytes: TEST_APP_LIMIT_BYTES,
      });
      localInfo.totalBytes = usageInfo.totalBytes;
      localInfo.filesUploaded = usageInfo.filesUploaded;
    });

    rawIt("should upload a file", async () => {
      const file = new File(["foo"], "foo.txt", { type: "text/plain" });
      const result = await utapi.uploadFiles(file);
      expect(result).toEqual({
        data: {
          customId: null,
          key: expect.stringMatching(/.+/),
          name: "foo.txt",
          size: 3,
          type: "text/plain",
          url: expect.stringMatching(/https:\/\/utfs.io\/f\/.+/),
        },
        error: null,
      });

      const content = await fetch(result.data!.url).then((r) => r.text());
      expect(content).toBe("foo");

      const usageInfo = await utapi.getUsageInfo();
      expect(usageInfo).toEqual({
        totalBytes: 3,
        appTotalBytes: 3,
        filesUploaded: 1,
        limitBytes: TEST_APP_LIMIT_BYTES,
      });

      localInfo.totalBytes += result.data!.size;
      localInfo.filesUploaded++;
    });

    rawIt("should upload a private file", async () => {
      const file = new File(["foo"], "foo.txt", { type: "text/plain" });
      const result = await utapi.uploadFiles(file, {
        acl: "private",
      });
      expect(result).toEqual({
        data: {
          customId: null,
          key: expect.stringMatching(/.+/),
          name: "foo.txt",
          size: 3,
          type: "text/plain",
          url: expect.stringMatching(/https:\/\/utfs.io\/f\/.+/),
        },
        error: null,
      });

      const response = await fetch(result.data!.url);
      expect(response.status).toBe(403);

      const { url } = await utapi.getSignedURL(result.data!.key);
      const content = await fetch(url).then((r) => r.text());
      expect(content).toBe("foo");

      localInfo.totalBytes += result.data!.size;
      localInfo.filesUploaded++;
    });

    rawIt("should upload a file from a url", async () => {
      const result = await utapi.uploadFilesFromUrl(
        "https://uploadthing.com/favicon.ico",
      );
      expect(result).toEqual({
        data: {
          customId: null,
          key: expect.stringMatching(/.+/),
          name: "favicon.ico",
          size: expect.any(Number),
          type: "image/vnd.microsoft.icon",
          url: expect.stringMatching(/https:\/\/utfs.io\/f\/.+/),
        },
        error: null,
      });

      localInfo.totalBytes += result.data!.size;
      localInfo.filesUploaded++;
    });

    rawIt("should rename a file", async () => {
      const customId = crypto.randomUUID();

      const file = new UTFile(["foo"], "bar.txt", { customId });
      const result = await utapi.uploadFiles(file);
      expect(result).toEqual({
        data: {
          customId: customId,
          key: expect.stringMatching(/.+/),
          name: "bar.txt",
          size: 3,
          type: "text/plain",
          url: expect.stringMatching(/https:\/\/utfs.io\/f\/.+/),
        },
        error: null,
      });

      const { success } = await utapi.renameFiles({
        customId,
        newName: "baz.txt",
      });
      expect(success).toBe(true);

      const { files } = await utapi.listFiles();
      expect(files.find((f) => f.customId === customId)).toHaveProperty(
        "name",
        "baz.txt",
      );

      // FIXME: Bug in uploadthing server
      // const heads = await fetch(result.data!.url).then((r) => r.headers);
      // expect(heads.get("Content-Disposition")).toEqual(
      //   expect.stringContaining("filename=baz.txt"),
      // );

      localInfo.totalBytes += result.data!.size;
      localInfo.filesUploaded++;
    });

    rawIt("should update ACL", async () => {
      const file = new File(["foo"], "foo.txt", { type: "text/plain" });
      const result = await utapi.uploadFiles(file);
      expect(result).toEqual({
        data: {
          customId: null,
          key: expect.stringMatching(/.+/),
          name: "foo.txt",
          size: 3,
          type: "text/plain",
          url: expect.stringMatching(/https:\/\/utfs.io\/f\/.+/),
        },
        error: null,
      });
      const { url, key } = result.data!;

      const firstChange = await utapi.updateACL(key, "private");
      expect(firstChange.success).toBe(true);
      await expect(fetch(url)).resolves.toHaveProperty("status", 403);

      const secondChange = await utapi.updateACL(key, "public-read");
      expect(secondChange.success).toBe(true);
      await expect(fetch(url)).resolves.toHaveProperty("status", 200);

      localInfo.totalBytes += result.data!.size;
      localInfo.filesUploaded++;
    });

    rawIt("should delete a file", async () => {
      const { files } = await utapi.listFiles();
      const someFile = files[0];

      const response = await fetch(`https://utfs.io/f/${someFile.key}`);
      const size = Number(response.headers.get("Content-Length"));

      const result = await utapi.deleteFiles(someFile.key);
      expect(result).toEqual({
        deletedCount: 1,
        success: true,
      });

      localInfo.totalBytes -= size;
      localInfo.filesUploaded--;
    });

    rawIt("should have correct usage info", async () => {
      const usageInfo = await utapi.getUsageInfo();
      expect(usageInfo).toEqual({
        totalBytes: localInfo.totalBytes,
        appTotalBytes: localInfo.totalBytes,
        filesUploaded: localInfo.filesUploaded,
        limitBytes: TEST_APP_LIMIT_BYTES,
      });
    });
  },
);
