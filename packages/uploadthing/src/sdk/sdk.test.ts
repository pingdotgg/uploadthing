import { describe, expectTypeOf, test } from "vitest";

import * as utapi from ".";

function ignoreErrors(fn: () => void | Promise<void>) {
  try {
    void fn();
  } catch {
    // no-op
  }
}

describe("uploadFiles", () => {
  test("returns array if array is passed", () => {
    ignoreErrors(async () => {
      const result = await utapi.uploadFiles([{} as File]);
      expectTypeOf<{ key: string; url: string }[]>(result);
    });
  });

  test("returns single object if no array is passed", () => {
    ignoreErrors(async () => {
      const result = await utapi.uploadFiles({} as File);
      expectTypeOf<{ key: string; url: string }>(result);
    });
  });
});

describe("uploadFilesFromUrl", () => {
  test("returns array if array is passed", () => {
    ignoreErrors(async () => {
      const result = await utapi.uploadFilesFromUrl(["foo", "bar"]);
      expectTypeOf<{ key: string; url: string }[]>(result);
    });
  });

  test("returns single object if no array is passed", () => {
    ignoreErrors(async () => {
      const result = await utapi.uploadFilesFromUrl("foo");
      expectTypeOf<{ key: string; url: string }>(result);
    });
  });
});
