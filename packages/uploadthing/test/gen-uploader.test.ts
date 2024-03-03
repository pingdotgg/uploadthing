import { describe, expectTypeOf, it } from "vitest";
import { z } from "zod";

import { genUploader } from "../src/client";
import type { FileRouter } from "../src/internal/types";
import { createBuilder } from "../src/internal/upload-builder";
import type { UploadedFile } from "../src/types";

const doNotExecute = (_fn: (...args: any[]) => any) => {
  // noop
};

describe("genuploader", () => {
  const f = createBuilder();

  const router = {
    uploadable1: f(["image", "video"]).onUploadComplete(() => {
      return { foo: "bar" as const };
    }),
    uploadable2: f(["image"])
      .input(z.object({ foo: z.number() }))
      .onUploadComplete(() => {
        return { baz: "qux" as const };
      }),
  } satisfies FileRouter;

  const uploader = genUploader<typeof router>({
    url: "0.0.0.0",
    package: "test",
  });
  const files = [new File([""], "file1"), new File([""], "file2")];

  it("typeerrors for invalid input", () => {
    doNotExecute(async () => {
      // @ts-expect-error - Argument of type '"random"' is not assignable to parameter of type '"uploadable"'
      await uploader("random", { files });
    });

    doNotExecute(async () => {
      // @ts-expect-error - Input should be required here
      const res = await uploader("uploadable2", { files });
      expectTypeOf<UploadedFile<{ baz: "qux" }>[]>(res);
    });
  });

  it("types serverData as null if polling is skipped", () => {
    doNotExecute(async () => {
      const res = await uploader("uploadable1", { files, skipPolling: true });
      expectTypeOf<UploadedFile<null>[]>(res);
    });
  });
});
