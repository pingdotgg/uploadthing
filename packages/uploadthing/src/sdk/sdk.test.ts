import { describe, expectTypeOf, test } from "vitest";

import * as utapi from ".";
import type { SerializedUploadthingError, Upload } from "./types";

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
          | { data: Upload; error: null }
          | { data: null; error: SerializedUploadthingError }
        )[]
      >(result);
    });
  });

  test("returns single object if no array is passed", () => {
    void ignoreErrors(async () => {
      const result = await utapi.uploadFiles({} as File);
      expectTypeOf<
        | { data: Upload; error: null }
        | { data: null; error: SerializedUploadthingError }
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
          | { data: Upload; error: null }
          | { data: null; error: SerializedUploadthingError }
        )[]
      >(result);
    });
  });

  test("returns single object if no array is passed", () => {
    void ignoreErrors(async () => {
      const result = await utapi.uploadFilesFromUrl("foo");
      expectTypeOf<
        | { data: Upload; error: null }
        | { data: null; error: SerializedUploadthingError }
      >(result);
    });
  });
});
