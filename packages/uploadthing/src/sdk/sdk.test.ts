import { expectTypeOf, test } from "vitest";

import * as utapi from ".";

function ignoreErrors(fn: () => void | Promise<void>) {
  try {
    void fn();
  } catch {
    // no-op
  }
}

test("returns array if array is passed", () => {
  ignoreErrors(async () => {
    const result = await utapi.uploadFiles([{} as File]);
    expectTypeOf<{ key: string; url: string }[]>(result);
  });

  ignoreErrors(async () => {
    const result = await utapi.uploadFileFromUrl(["foo", "bar"]);
    expectTypeOf<{ key: string; url: string }[]>(result);
  });
});

test("returns single object if no array is passed", () => {
  ignoreErrors(async () => {
    const result = await utapi.uploadFiles({} as File);
    expectTypeOf<{ key: string; url: string }>(result);
  });

  ignoreErrors(async () => {
    const result = await utapi.uploadFileFromUrl("foo");
    expectTypeOf<{ key: string; url: string }>(result);
  });
});
