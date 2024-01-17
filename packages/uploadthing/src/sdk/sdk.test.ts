import { beforeEach, describe, expect, expectTypeOf, test, vi } from "vitest";

import type { ResponseEsque } from "@uploadthing/shared";

import { UTApi } from ".";
import type { UploadError } from "./utils";

const utapi = new UTApi({ apiKey: "sk_test_foo" });

async function ignoreErrors<T>(fn: () => T | Promise<T>) {
  try {
    await fn();
  } catch {
    // no-op
  }
}

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
});

describe("constructor throws if no apiKey or secret is set", () => {
  test("no secret or apikey", () => {
    expect(() => new UTApi()).toThrowErrorMatchingInlineSnapshot(
      '"Missing `UPLOADTHING_SECRET` env variable."',
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockFetch.mock.calls[0][1]).toContain({
      body: JSON.stringify({ fileKey: "foo" }),
    });
  });

  test("sends request with valid expiresIn (1)", async () => {
    await utapi.getSignedURL("foo", { expiresIn: "1d" });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockFetch.mock.calls[0][1]).toContain({
      body: JSON.stringify({ fileKey: "foo", expiresIn: 86400 }),
    });
  });

  test("sends request with valid expiresIn (2)", async () => {
    await utapi.getSignedURL("foo", { expiresIn: "3 minutes" });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(mockFetch.mock.calls[0][1]).toContain({
      body: JSON.stringify({ fileKey: "foo", expiresIn: 180 }),
    });
  });

  test("throws if expiresIn is invalid", async () => {
    await expect(() =>
      // @ts-expect-error - intentionally passing invalid expiresIn
      utapi.getSignedURL("foo", { expiresIn: "something" }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      "\"expiresIn must be a valid time string, for example '1d', '2 days', or a number of seconds.\"",
    );
    expect(mockFetch.mock.calls.length).toBe(0);
  });

  test("throws if expiresIn is longer than 7 days", async () => {
    await expect(() =>
      utapi.getSignedURL("foo", { expiresIn: "10 days" }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '"expiresIn must be less than 7 days (604800 seconds)."',
    );
    expect(mockFetch.mock.calls.length).toBe(0);
  });
});
