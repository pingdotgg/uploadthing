/* eslint-disable no-restricted-globals */
import { f } from "node_modules/msw/lib/core/HttpResponse-vQNlixkj";
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
import {
  API_URL,
  INGEST_URL,
  it,
  requestSpy,
  testToken,
  UTFS_IO_URL,
} from "./__test-helpers";

describe("uploadFiles", () => {
  const fooFile = new File(["foo"], "foo.txt", { type: "text/plain" });

  it("uploads successfully", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });
    const result = await utapi.uploadFiles(fooFile);

    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(requestSpy).toHaveBeenCalledWith(
      expect.stringContaining(INGEST_URL),
      expect.objectContaining({
        method: "PUT",
        body: expect.any(FormData),
        headers: expect.objectContaining({
          range: "bytes=0-",
        }),
      }),
    );

    const key = result.data?.key;
    expect(result).toEqual({
      data: {
        key: expect.stringMatching(/.+/),
        name: "foo.txt",
        size: 3,
        lastModified: fooFile.lastModified,
        url: `${UTFS_IO_URL}/${key}`,
        customId: null,
        type: "text/plain",
      },
      error: null,
    });
  });

  it("returns array if array is passed", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });
    const result = await utapi.uploadFiles([fooFile]);
    expectTypeOf<UploadFileResult[]>(result);
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns single object if no array is passed", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });
    const result = await utapi.uploadFiles(fooFile);
    expectTypeOf<UploadFileResult>(result);
    expect(Array.isArray(result)).toBe(false);
  });

  it("accepts UTFile", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });
    const file = new UTFile(["foo"], "foo.txt");
    await utapi.uploadFiles(file);
    expect(file.type).toBe("text/plain");

    expect(requestSpy).toHaveBeenCalledWith(
      expect.stringContaining(`x-ut-file-name=foo.txt`),
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("accepts UndiciFile", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });
    const { File } = await import("undici");
    const file = new File(["foo"], "foo.txt");
    await utapi.uploadFiles(file);
  });

  it("accepts UTFile with customId", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });
    const fileWithId = new UTFile(["foo"], "foo.txt", { customId: "foo" });
    await utapi.uploadFiles(fileWithId);
    expect(fileWithId.customId).toBe("foo");

    expect(requestSpy).toHaveBeenCalledWith(
      expect.stringContaining(`x-ut-custom-id=foo`),
      expect.objectContaining({ method: "PUT" }),
    );
  });
});

describe("uploadFilesFromUrl", () => {
  it("downloads, then uploads successfully", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });
    const result = await utapi.uploadFilesFromUrl(
      "https://cdn.foo.com/foo.txt",
    );

    expect(requestSpy).toHaveBeenCalledTimes(2); // download, upload
    expect(requestSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(`x-ut-file-name=foo.txt`),
      {
        method: "PUT",
        body: expect.any(FormData),
        headers: expect.objectContaining({
          range: "bytes=0-",
        }),
      },
    );

    const key = result.data?.key;
    expect(result).toEqual({
      data: {
        key: expect.stringMatching(/.+/),
        name: "foo.txt",
        size: 26,
        lastModified: expect.any(Number),
        url: `${UTFS_IO_URL}/${key}`,
        customId: null,
        type: "text/plain",
      },
      error: null,
    });
  });

  it("returns array if array is passed", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });
    const result = await utapi.uploadFilesFromUrl([
      "https://cdn.foo.com/foo.txt",
      "https://cdn.foo.com/bar.txt",
    ]);
    expectTypeOf<UploadFileResult[]>(result);
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns single object if no array is passed", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });
    const result = await utapi.uploadFilesFromUrl(
      "https://cdn.foo.com/foo.txt",
    );
    expectTypeOf<UploadFileResult>(result);
    expect(Array.isArray(result)).toBe(false);
  });

  it("can override name", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });
    await utapi.uploadFilesFromUrl({
      url: "https://cdn.foo.com/my-super-long-pathname-thats-too-long-for-ut.txt",
      name: "bar.txt",
    });

    expect(requestSpy).toHaveBeenCalledWith(
      expect.stringContaining(`x-ut-file-name=bar.txt`),
      {
        method: "PUT",
        body: expect.any(FormData),
        headers: expect.objectContaining({
          range: "bytes=0-",
        }),
      },
    );
  });

  it("can provide a customId", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });
    await utapi.uploadFilesFromUrl({
      url: "https://cdn.foo.com/foo.txt",
      customId: "my-custom-id",
    });

    expect(requestSpy).toHaveBeenCalledWith(
      expect.stringContaining(`x-ut-custom-id=my-custom-id`),
      {
        method: "PUT",
        body: expect.any(FormData),
        headers: expect.objectContaining({
          range: "bytes=0-",
        }),
      },
    );
  });

  // if passed data url, array contains UploadThingError
  it("returns error if data url is passed", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });
    const result = await utapi.uploadFilesFromUrl(
      "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==",
    );
    expect(result).toStrictEqual({
      data: null,
      error: {
        code: "BAD_REQUEST",
        data: undefined,
        message:
          "Please use uploadFiles() for data URLs. uploadFilesFromUrl() is intended for use with remote URLs only.",
      },
    });
  });

  it("preserves order if some download fails", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });
    const result = await utapi.uploadFilesFromUrl([
      "https://cdn.foo.com/foo.txt",
      "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==",
      "https://cdn.foo.com/bar.txt",
    ]);
    const key1 = result[0].data?.key;
    const key2 = result[2].data?.key;
    expect(result).toStrictEqual([
      {
        data: {
          customId: null,
          key: expect.stringMatching(/.+/),
          lastModified: expect.any(Number),
          name: "foo.txt",
          size: 26,
          type: "text/plain",
          url: `${UTFS_IO_URL}/${key1}`,
        },
        error: null,
      },
      {
        data: null,
        error: {
          code: "BAD_REQUEST",
          data: undefined,
          message:
            "Please use uploadFiles() for data URLs. uploadFilesFromUrl() is intended for use with remote URLs only.",
        },
      },
      {
        data: {
          customId: null,
          key: expect.stringMatching(/.+/),
          lastModified: expect.any(Number),
          name: "bar.txt",
          size: 26,
          type: "text/plain",
          url: `${UTFS_IO_URL}/${key2}`,
        },
        error: null,
      },
    ]);
  });
});

describe("getSignedURL", () => {
  it("sends request without expiresIn", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });
    await utapi.getSignedURL("foo");

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith(`${API_URL}/v6/requestFileAccess`, {
      body: { fileKey: "foo" },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "server-sdk",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });

  it("sends request with valid expiresIn (1)", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });
    await utapi.getSignedURL("foo", { expiresIn: "1d" });

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith(`${API_URL}/v6/requestFileAccess`, {
      body: { fileKey: "foo", expiresIn: 86400 },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "server-sdk",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });

  it("sends request with valid expiresIn (2)", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });
    await utapi.getSignedURL("foo", { expiresIn: "3 minutes" });

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith(`${API_URL}/v6/requestFileAccess`, {
      body: { fileKey: "foo", expiresIn: 180 },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "server-sdk",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });

  it("throws if expiresIn is invalid", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });
    await expect(() =>
      // @ts-expect-error - intentionally passing invalid expiresIn
      utapi.getSignedURL("foo", { expiresIn: "something" }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[UploadThingError: expiresIn must be a valid time string, for example '1d', '2 days', or a number of seconds.]`,
    );
    expect(requestSpy).toHaveBeenCalledTimes(0);
  });

  it("throws if expiresIn is longer than 7 days", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });
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
    const utapi = new UTApi({ token: testToken.encoded });

    await expect(utapi.updateACL("ut-key", "public-read")).resolves.toEqual({
      success: true,
    });

    expect(requestSpy).toHaveBeenCalledWith(`${API_URL}/v6/updateACL`, {
      body: { updates: [{ fileKey: "ut-key", acl: "public-read" }] },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "server-sdk",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });

  it("many keys", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });

    await expect(
      utapi.updateACL(["ut-key1", "ut-key2"], "public-read"),
    ).resolves.toEqual({ success: true });

    expect(requestSpy).toHaveBeenCalledWith(`${API_URL}/v6/updateACL`, {
      body: {
        updates: [
          { fileKey: "ut-key1", acl: "public-read" },
          { fileKey: "ut-key2", acl: "public-read" },
        ],
      },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "server-sdk",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });

  it("many keys with keytype override", async ({ db }) => {
    const utapi = new UTApi({ token: testToken.encoded });

    await expect(
      utapi.updateACL(["my-custom-id1", "my-custom-id2"], "public-read", {
        keyType: "customId",
      }),
    ).resolves.toEqual({ success: true });

    expect(requestSpy).toHaveBeenCalledWith(`${API_URL}/v6/updateACL`, {
      body: {
        updates: [
          { customId: "my-custom-id1", acl: "public-read" },
          { customId: "my-custom-id2", acl: "public-read" },
        ],
      },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "server-sdk",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });
});

const shouldRun =
  typeof process.env.UPLOADTHING_TEST_TOKEN === "string" &&
  process.env.UPLOADTHING_TEST_TOKEN.length > 0;

describe.runIf(shouldRun)(
  "smoke test with live api",
  { timeout: 15_000 },
  () => {
    const utapi = new UTApi({
      token: shouldRun
        ? process.env.UPLOADTHING_TEST_TOKEN!
        : testToken.encoded,
    });

    const localInfo = { totalBytes: 0, filesUploaded: 0 };
    // const TEST_APP_LIMIT_BYTES = 2147483648; // free 2GB
    const TEST_APP_LIMIT_BYTES = 107374182400; // paid 100GB

    // Clean up any files before and after tests
    beforeAll(async () => {
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
          lastModified: file.lastModified,
          name: "foo.txt",
          size: 3,
          type: "text/plain",
          url: expect.stringMatching(new RegExp(`^${UTFS_IO_URL}/.+$`)),
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
          lastModified: file.lastModified,
          name: "foo.txt",
          size: 3,
          type: "text/plain",
          url: expect.stringMatching(new RegExp(`^${UTFS_IO_URL}/.+$`)),
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
          lastModified: expect.any(Number),
          name: "favicon.ico",
          size: expect.any(Number),
          type: "image/vnd.microsoft.icon",
          url: expect.stringMatching(new RegExp(`^${UTFS_IO_URL}/.+$`)),
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
          lastModified: file.lastModified,
          name: "bar.txt",
          size: 3,
          type: "text/plain",
          url: expect.stringMatching(new RegExp(`^${UTFS_IO_URL}/.+$`)),
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
          lastModified: file.lastModified,
          name: "foo.txt",
          size: 3,
          type: "text/plain",
          url: expect.stringMatching(new RegExp(`^${UTFS_IO_URL}/.+$`)),
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

      const response = await fetch(`${UTFS_IO_URL}/${someFile.key}`);
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
