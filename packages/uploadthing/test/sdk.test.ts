import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  expectTypeOf,
  it,
} from "vitest";

import { UTApi, UTFile } from "../src/sdk";
import type { UploadFileResult } from "../src/sdk/types";
import {
  API_URL,
  handlers,
  INGEST_URL,
  requestSpy,
  testToken,
  UFS_HOST,
} from "./__test-helpers";

const msw = setupServer(...handlers);
beforeAll(() => msw.listen());
afterAll(() => msw.close());

describe("uploadFiles", () => {
  const fooFile = new File(["foo"], "foo.txt", { type: "text/plain" });

  it("uploads successfully", async () => {
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
        url: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key}`,
        appUrl: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key}`,
        customId: null,
        type: "text/plain",
        fileHash: expect.any(String),
      },
      error: null,
    });
  });

  it("returns array if array is passed", async () => {
    const utapi = new UTApi({ token: testToken.encoded });
    const result = await utapi.uploadFiles([fooFile]);
    expectTypeOf<UploadFileResult[]>(result);
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns single object if no array is passed", async () => {
    const utapi = new UTApi({ token: testToken.encoded });
    const result = await utapi.uploadFiles(fooFile);
    expectTypeOf<UploadFileResult>(result);
    expect(Array.isArray(result)).toBe(false);
  });

  it("accepts UTFile", async () => {
    const utapi = new UTApi({ token: testToken.encoded });
    const file = new UTFile(["foo"], "foo.txt");
    await utapi.uploadFiles(file);
    expect(file.type).toBe("text/plain");

    expect(requestSpy).toHaveBeenCalledWith(
      expect.stringContaining(`x-ut-file-name=foo.txt`),
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("accepts UTFile with customId", async () => {
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
  it("downloads, then uploads successfully", async () => {
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
        url: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key}`,
        appUrl: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key}`,
        customId: null,
        type: "text/plain",
        fileHash: expect.any(String),
      },
      error: null,
    });
  });

  it("returns array if array is passed", async () => {
    const utapi = new UTApi({ token: testToken.encoded });
    const result = await utapi.uploadFilesFromUrl([
      "https://cdn.foo.com/foo.txt",
      "https://cdn.foo.com/bar.txt",
    ]);
    expectTypeOf<UploadFileResult[]>(result);
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns single object if no array is passed", async () => {
    const utapi = new UTApi({ token: testToken.encoded });
    const result = await utapi.uploadFilesFromUrl(
      "https://cdn.foo.com/foo.txt",
    );
    expectTypeOf<UploadFileResult>(result);
    expect(Array.isArray(result)).toBe(false);
  });

  it("can override name", async () => {
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

  it("can provide a customId", async () => {
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
  it("returns error if data url is passed", async () => {
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

  it("gracefully handles download errors", async () => {
    const utapi = new UTApi({ token: testToken.encoded });

    msw.use(
      http.get("https://cdn.foo.com/does-not-exist.txt", () => {
        return new HttpResponse("Not found", { status: 404 });
      }),
    );

    const result = await utapi.uploadFilesFromUrl(
      "https://cdn.foo.com/does-not-exist.txt",
    );
    expect(result).toEqual({
      data: null,
      error: {
        code: "BAD_REQUEST",
        data: expect.objectContaining({
          _tag: "ResponseError",
          description: "non 2xx status code",
        }),
        message:
          "Failed to download requested file: StatusCode: non 2xx status code (404 GET https://cdn.foo.com/does-not-exist.txt)",
      },
    });
  });

  it("gracefully handles download errors", async () => {
    const utapi = new UTApi({ token: testToken.encoded });

    msw.use(
      http.get("https://cdn.foo.com/does-not-exist.txt", () => {
        return new HttpResponse("Not found", { status: 404 });
      }),
    );

    const result = await utapi.uploadFilesFromUrl([
      "https://cdn.foo.com/exists.txt",
      "https://cdn.foo.com/does-not-exist.txt",
    ]);
    const key1 = result[0]?.data?.key;
    expect(result).toEqual([
      {
        data: {
          customId: null,
          fileHash: expect.any(String),
          key: expect.stringMatching(/.+/),
          lastModified: expect.any(Number),
          name: "exists.txt",
          size: 26,
          type: "text/plain",
          url: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key1}`,
          appUrl: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key1}`,
        },
        error: null,
      },
      {
        data: null,
        error: {
          code: "BAD_REQUEST",
          data: expect.objectContaining({
            _tag: "ResponseError",
            description: "non 2xx status code",
          }),
          message:
            "Failed to download requested file: StatusCode: non 2xx status code (404 GET https://cdn.foo.com/does-not-exist.txt)",
        },
      },
    ]);
  });

  it("preserves order if some download fails", async () => {
    const utapi = new UTApi({ token: testToken.encoded });
    const result = await utapi.uploadFilesFromUrl([
      "https://cdn.foo.com/foo.txt",
      "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==",
      "https://cdn.foo.com/bar.txt",
    ]);
    const key1 = result[0]?.data?.key;
    const key2 = result[2]?.data?.key;
    expect(result).toStrictEqual([
      {
        data: {
          customId: null,
          key: expect.stringMatching(/.+/),
          lastModified: expect.any(Number),
          name: "foo.txt",
          size: 26,
          type: "text/plain",
          url: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key1}`,
          appUrl: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key1}`,
          fileHash: expect.any(String),
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
          url: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key2}`,
          appUrl: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key2}`,
          fileHash: expect.any(String),
        },
        error: null,
      },
    ]);
  });
});

describe("getSignedURL", () => {
  it("sends request without expiresIn", async () => {
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

  it("sends request with valid expiresIn (1)", async () => {
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

  it("sends request with valid expiresIn (2)", async () => {
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

  it("throws if expiresIn is invalid", async () => {
    const utapi = new UTApi({ token: testToken.encoded });
    await expect(() =>
      // @ts-expect-error - intentionally passing invalid expiresIn
      utapi.getSignedURL("foo", { expiresIn: "something" }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[UploadThingError: expiresIn must be a valid time string, for example '1d', '2 days', or a number of seconds.]`,
    );
    expect(requestSpy).toHaveBeenCalledTimes(0);
  });

  it("throws if expiresIn is longer than 7 days", async () => {
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
  it("single file", async () => {
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

  it("many keys", async () => {
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

  it("many keys with keytype override", async () => {
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
