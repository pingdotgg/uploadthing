import { describe, expect, expectTypeOf, test } from "vitest";

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
    process.env.UPLOADTHING_SECRET = "foo";
    expect(() => new UTApi()).not.toThrow();
  });
  test("apikey option is passed", () => {
    expect(() => new UTApi({ apiKey: "foobar" })).not.toThrow();
  });
});
