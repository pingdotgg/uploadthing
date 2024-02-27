import { process } from "std-env";
import { describe, expect, expectTypeOf, it } from "vitest";

import { UTApi, UTFile } from ".";
import { fetchMock, mockExternalRequests } from "../../test/__test-helpers";
import type { UploadFileResponse } from "./utils";

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
  const utapi = new UTApi({
    apiKey: "sk_foo",
    fetch: mockExternalRequests,
  });

  const fooFile = new File(["foo"], "foo.txt", { type: "text/plain" });

  it("uploads successfully", async () => {
    const result = await utapi.uploadFiles(fooFile);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://uploadthing.com/api/uploadFiles",
      {
        body: '{"files":[{"name":"foo.txt","type":"text/plain","size":3}],"metadata":{},"contentDisposition":"inline"}',
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://bucket.s3.amazonaws.com/abc-123.txt",
      expect.objectContaining({
        body: expect.any(FormData),
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://uploadthing.com/api/pollUpload/abc-123.txt",
      {
        headers: {
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-version": "6.4.1",
        },
      },
    );

    expect(result).toEqual({
      data: {
        key: "abc-123.txt",
        name: "foo.txt",
        size: 3,
        url: "https://utfs.io/f/abc-123.txt",
      },
      error: null,
    });
  });

  it("returns array if array is passed", async () => {
    const result = await utapi.uploadFiles([fooFile]);
    expectTypeOf<UploadFileResponse[]>(result);
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns single object if no array is passed", async () => {
    const result = await utapi.uploadFiles(fooFile);
    expectTypeOf<UploadFileResponse>(result);
    expect(Array.isArray(result)).toBe(false);
  });

  it("accepts UTFile", async () => {
    const file = new UTFile(["foo"], "foo.txt");
    await utapi.uploadFiles(file);
    expect(file.type).toBe("text/plain");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/uploadFiles",
      expect.objectContaining({}),
    );
  });

  it("accepts UTFile with customId", async () => {
    const fileWithId = new UTFile(["foo"], "foo.txt", { customId: "foo" });
    await utapi.uploadFiles(fileWithId);
    expect(fileWithId.customId).toBe("foo");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/uploadFiles",
      {
        body: '{"files":[{"name":"foo.txt","type":"text/plain","size":3,"customId":"foo"}],"metadata":{},"contentDisposition":"inline"}',
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
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
  const utapi = new UTApi({
    apiKey: "sk_foo",
    fetch: mockExternalRequests,
  });

  it("downloads, then uploads successfully", async () => {
    const result = await utapi.uploadFilesFromUrl(
      "https://cdn.foo.com/foo.txt",
    );

    expect(fetchMock).toHaveBeenCalledTimes(4); // download, request url, upload, poll
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://uploadthing.com/api/uploadFiles",
      {
        body: '{"files":[{"name":"foo.txt","type":"text/plain","size":26}],"metadata":{},"contentDisposition":"inline"}',
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://bucket.s3.amazonaws.com/abc-123.txt",
      expect.objectContaining({}),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
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
      },
      error: null,
    });
  });

  it("returns array if array is passed", async () => {
    const result = await utapi.uploadFilesFromUrl([
      "https://cdn.foo.com/foo.txt",
      "https://cdn.foo.com/bar.txt",
    ]);
    expectTypeOf<UploadFileResponse[]>(result);
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns single object if no array is passed", async () => {
    const result = await utapi.uploadFilesFromUrl(
      "https://cdn.foo.com/foo.txt",
    );
    expectTypeOf<UploadFileResponse>(result);
    expect(Array.isArray(result)).toBe(false);
  });

  it("can override name", async () => {
    await utapi.uploadFilesFromUrl({
      url: "https://cdn.foo.com/my-super-long-pathname-thats-too-long-for-ut.txt",
      name: "bar.txt",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/uploadFiles",
      {
        body: '{"files":[{"name":"bar.txt","type":"text/plain","size":26}],"metadata":{},"contentDisposition":"inline"}',
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
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
  const utapi = new UTApi({
    apiKey: "sk_foo",
    fetch: mockExternalRequests,
  });

  it("sends request without expiresIn", async () => {
    await utapi.getSignedURL("foo");

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/requestFileAccess",
      {
        body: `{"fileKey":"foo"}`,
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });

  it("sends request with valid expiresIn (1)", async () => {
    await utapi.getSignedURL("foo", { expiresIn: "1d" });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/requestFileAccess",
      {
        body: `{"fileKey":"foo","expiresIn":86400}`,
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });

  it("sends request with valid expiresIn (2)", async () => {
    await utapi.getSignedURL("foo", { expiresIn: "3 minutes" });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/requestFileAccess",
      {
        body: `{"fileKey":"foo","expiresIn":180}`,
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });

  it("throws if expiresIn is invalid", async () => {
    await expect(() =>
      // @ts-expect-error - intentionally passing invalid expiresIn
      utapi.getSignedURL("foo", { expiresIn: "something" }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: expiresIn must be a valid time string, for example '1d', '2 days', or a number of seconds.]`,
    );
    expect(fetchMock).toHaveBeenCalledTimes(0);
  });

  it("throws if expiresIn is longer than 7 days", async () => {
    await expect(() =>
      utapi.getSignedURL("foo", { expiresIn: "10 days" }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: expiresIn must be less than 7 days (604800 seconds).]`,
    );
    expect(fetchMock).toHaveBeenCalledTimes(0);
  });
});
