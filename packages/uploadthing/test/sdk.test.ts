import { process } from "std-env";
import { describe, expect, expectTypeOf } from "vitest";

import { UTApi, UTFile } from "../src/sdk";
import type { UploadFileResult } from "../src/sdk/types";
import { it, s3Mock, staticAssetMock, utApiMock } from "./__test-helpers";

describe("UTFile", () => {
  it("can be constructed using Blob", async () => {
    const blob = new Blob(["foo"], { type: "text/plain" });
    const file = new UTFile([blob], "foo.txt");
    expect(file.type).toBe("text/plain");
    await expect(file.text()).resolves.toBe("foo");

    const fileWithId = new UTFile([blob], "foo.txt", { customId: "foo" });
    expect(fileWithId.customId).toBe("foo");
  });

  it("can be constructed using string", async () => {
    const file = new UTFile(["foo"], "foo.txt");
    expect(file.type).toBe("text/plain");
    await expect(file.text()).resolves.toBe("foo");
  });
});

describe("uploadFiles", () => {
  const fooFile = new File(["foo"], "foo.txt", { type: "text/plain" });

  it("uploads successfully", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    const result = await utapi.uploadFiles(fooFile);

    expect(utApiMock).toHaveBeenCalledTimes(2);
    expect(utApiMock).toHaveBeenNthCalledWith(
      1,
      "https://uploadthing.com/api/uploadFiles",
      {
        body: '{"files":[{"name":"foo.txt","type":"text/plain","size":3}],"metadata":{},"contentDisposition":"inline"}',
        headers: {
          "content-type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
    expect(s3Mock).toHaveBeenCalledOnce();
    expect(s3Mock).toHaveBeenCalledWith(
      "https://bucket.s3.amazonaws.com/",
      expect.objectContaining({
        body: expect.any(FormData),
        method: "POST",
      }),
    );
    expect(utApiMock).toHaveBeenNthCalledWith(
      2,
      "https://uploadthing.com/api/pollUpload/abc-123.txt",
      {
        headers: {
          "x-uploadthing-api-key": "sk_foo",
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

    expect(utApiMock).toHaveBeenCalledWith(
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

    expect(utApiMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/uploadFiles",
      {
        body: '{"files":[{"name":"foo.txt","type":"text/plain","size":3,"customId":"foo"}],"metadata":{},"contentDisposition":"inline"}',
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

    expect(staticAssetMock).toHaveBeenCalledOnce(); // download, request url, upload, poll
    expect(utApiMock).toHaveBeenCalledTimes(2);
    expect(s3Mock).toHaveBeenCalledOnce();

    expect(utApiMock).toHaveBeenNthCalledWith(
      1,
      "https://uploadthing.com/api/uploadFiles",
      {
        body: '{"files":[{"name":"foo.txt","type":"text/plain","size":26}],"metadata":{},"contentDisposition":"inline"}',
        headers: {
          "content-type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
    expect(s3Mock).toHaveBeenCalledWith(
      "https://bucket.s3.amazonaws.com/",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(utApiMock).toHaveBeenNthCalledWith(
      2,
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

    expect(utApiMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/uploadFiles",
      {
        body: '{"files":[{"name":"bar.txt","type":"text/plain","size":26}],"metadata":{},"contentDisposition":"inline"}',
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

    expect(utApiMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/uploadFiles",
      {
        body: '{"files":[{"name":"foo.txt","type":"text/plain","size":26,"customId":"my-custom-id"}],"metadata":{},"contentDisposition":"inline"}',
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
      `[Error: Missing \`UPLOADTHING_SECRET\` env variable.]`,
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

    expect(utApiMock).toHaveBeenCalledOnce();
    expect(utApiMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/requestFileAccess",
      {
        body: `{"fileKey":"foo"}`,
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

    expect(utApiMock).toHaveBeenCalledOnce();
    expect(utApiMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/requestFileAccess",
      {
        body: `{"fileKey":"foo","expiresIn":86400}`,
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

    expect(utApiMock).toHaveBeenCalledOnce();
    expect(utApiMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/requestFileAccess",
      {
        body: `{"fileKey":"foo","expiresIn":180}`,
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
      `[Error: expiresIn must be a valid time string, for example '1d', '2 days', or a number of seconds.]`,
    );
    expect(utApiMock).toHaveBeenCalledTimes(0);
  });

  it("throws if expiresIn is longer than 7 days", async ({ db }) => {
    const utapi = new UTApi({ apiKey: "sk_foo" });
    await expect(() =>
      utapi.getSignedURL("foo", { expiresIn: "10 days" }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: expiresIn must be less than 7 days (604800 seconds).]`,
    );
    expect(utApiMock).toHaveBeenCalledTimes(0);
  });
});
