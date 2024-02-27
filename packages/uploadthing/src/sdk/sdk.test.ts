import { process } from "std-env";
import { beforeEach, describe, expect, expectTypeOf, test, vi } from "vitest";

import type { ResponseEsque } from "@uploadthing/shared";

import { UTApi, UTFile } from ".";
import type { UploadError } from "./utils";

const utapi = new UTApi({ apiKey: "sk_test_foo" });

async function ignoreErrors<T>(fn: () => T | Promise<T>) {
  try {
    await fn();
  } catch {
    // no-op
  }
}

describe("UTFile", () => {
  test("can be constructed using Blob", async () => {
    const blob = new Blob(["foo"], { type: "text/plain" });
    const file = new UTFile([blob], "foo.txt");
    expect(file.type).toBe("text/plain");
    await expect(file.text()).resolves.toBe("foo");

    const fileWithId = new UTFile([blob], "foo.txt", { customId: "foo" });
    expect(fileWithId.customId).toBe("foo");
  });

  test("can be constructed using string", async () => {
    const file = new UTFile(["foo"], "foo.txt");
    expect(file.type).toBe("text/plain");
    await expect(file.text()).resolves.toBe("foo");
  });
});

describe("uploadFiles", () => {
  test("returns array if array is passed", () => {
    void ignoreErrors(async () => {
      const result = await utapi.uploadFiles([{} as File]);
      expectTypeOf<
        (
          | { data: { key: string; url: string }; error: null }
          | { data: null; error: UploadError }
        )[]
      >(result);
    });
  });

  test("returns single object if no array is passed", () => {
    void ignoreErrors(async () => {
      const result = await utapi.uploadFiles({} as File);
      expectTypeOf<
        | { data: { key: string; url: string }; error: null }
        | { data: null; error: UploadError }
      >(result);
    });
  });

  test("accepts UTFile", () => {
    const blob = new Blob(["foo"], { type: "text/plain" });
    const file = new UTFile([blob], "foo.txt");
    void ignoreErrors(() => utapi.uploadFiles(file));
    expect(file.type).toBe("text/plain");

    const fileWithId = new UTFile([blob], "foo.txt", { customId: "foo" });
    void ignoreErrors(() => utapi.uploadFiles(fileWithId));
    expect(fileWithId.customId).toBe("foo");
  });
});

describe("uploadFilesFromUrl", () => {
  test("returns array if array is passed", () => {
    void ignoreErrors(async () => {
      const result = await utapi.uploadFilesFromUrl(["foo", "bar"]);
      expectTypeOf<
        (
          | { data: { key: string; url: string }; error: null }
          | { data: null; error: UploadError }
        )[]
      >(result);
    });
  });

  test("returns single object if no array is passed", () => {
    void ignoreErrors(async () => {
      const result = await utapi.uploadFilesFromUrl("foo");
      expectTypeOf<
        | { data: { key: string; url: string }; error: null }
        | { data: null; error: UploadError }
      >(result);
    });
  });

  test("can override name", async () => {
    const mockFetch = vi.fn();
    const utapi = new UTApi({
      apiKey: "sk_foo",
      fetch: (url, init) => {
        mockFetch(url, init);

        // Mock file download
        if (url instanceof URL && url.host === "cdn.foo.com") {
          return Promise.resolve(
            new Response("Lorem ipsum doler sit amet", {
              headers: { "Content-Type": "text/plain" },
            }),
          );
        }

        // Mock presigned URL return
        return Promise.resolve(Response.json([]));
      },
    });

    await utapi.uploadFilesFromUrl({
      url: "https://cdn.foo.com/my-super-long-pathname-thats-too-long-for-ut.txt",
      name: "bar.txt",
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenLastCalledWith(
      "https://uploadthing.com/api/uploadFiles",
      {
        body: '{"files":[{"name":"bar.txt","type":"text/plain","size":26}],"metadata":{},"contentDisposition":"inline"}',
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });

  // if passed data url, array contains UploadThingError
  test("return is error if data url is passed", async () => {
    const mockFetch = vi.fn();
    const utapi = new UTApi({
      apiKey: "sk_foo",
      fetch: (url, init) => {
        mockFetch(url, init);

        // Mock file download
        if (url instanceof URL && url.host === "cdn.foo.com") {
          return Promise.resolve(
            new Response("Lorem ipsum doler sit amet", {
              headers: { "Content-Type": "text/plain" },
            }),
          );
        }

        // Mock presigned URL return
        return Promise.resolve(Response.json([]));
      },
    });

    const result = await utapi.uploadFilesFromUrl(
      "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==",
    );
    expect(result).toMatchInlineSnapshot(`
      {
        "data": null,
        "error": [Error: Please use uploadFiles() for data URLs. uploadFilesFromUrl() is intended for use with remote URLs only.],
      }
    `);
  });
});

describe("constructor throws if no apiKey or secret is set", () => {
  test("no secret or apikey", () => {
    expect(() => new UTApi()).toThrowErrorMatchingInlineSnapshot(
      `[Error: Missing \`UPLOADTHING_SECRET\` env variable.]`,
    );
  });
  test("env is set", () => {
    process.env.UPLOADTHING_SECRET = "sk_test_foo";
    expect(() => new UTApi()).not.toThrow();
  });
  test("apikey option is passed", () => {
    expect(() => new UTApi({ apiKey: "sk_test_foo" })).not.toThrow();
  });
});

describe("getSignedURL", () => {
  // Mock fetch
  const mockFetch = vi.fn();
  const utapi = new UTApi({
    apiKey: "sk_foo",
    fetch: (url, init) => {
      mockFetch(url, init);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: "https://example.com" }),
      }) as unknown as Promise<ResponseEsque>;
    },
  });

  beforeEach(() => {
    mockFetch.mockClear();
  });

  test("sends request without expiresIn", async () => {
    await utapi.getSignedURL("foo");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://uploadthing.com/api/requestFileAccess",
      {
        body: `{"fileKey":"foo"}`,
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });

  test("sends request with valid expiresIn (1)", async () => {
    await utapi.getSignedURL("foo", { expiresIn: "1d" });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://uploadthing.com/api/requestFileAccess",
      {
        body: `{"fileKey":"foo","expiresIn":86400}`,
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });

  test("sends request with valid expiresIn (2)", async () => {
    await utapi.getSignedURL("foo", { expiresIn: "3 minutes" });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://uploadthing.com/api/requestFileAccess",
      {
        body: `{"fileKey":"foo","expiresIn":180}`,
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": "sk_foo",
          "x-uploadthing-be-adapter": "server-sdk",
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });

  test("throws if expiresIn is invalid", async () => {
    await expect(() =>
      // @ts-expect-error - intentionally passing invalid expiresIn
      utapi.getSignedURL("foo", { expiresIn: "something" }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: expiresIn must be a valid time string, for example '1d', '2 days', or a number of seconds.]`,
    );
    expect(mockFetch).toHaveBeenCalledTimes(0);
  });

  test("throws if expiresIn is longer than 7 days", async () => {
    await expect(() =>
      utapi.getSignedURL("foo", { expiresIn: "10 days" }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: expiresIn must be less than 7 days (604800 seconds).]`,
    );
    expect(mockFetch).toHaveBeenCalledTimes(0);
  });
});
