import { expectTypeOf, it } from "vitest";
import { z } from "zod";

import type { UploadFileResponse } from "../src/client";
import { genUploader } from "../src/client";
import type { FileRouter } from "../src/internal/types";
import { createBuilder } from "../src/internal/upload-builder";

const doNotExecute = (_fn: (...args: any[]) => any) => {
  // noop
};

it("genuploader", () => {
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

  const uploader = genUploader<typeof router>();

  doNotExecute(async () => {
    // @ts-expect-error - Argument of type '"random"' is not assignable to parameter of type '"uploadable"'
    await uploader("random", { files: [] });
  });

  doNotExecute(async () => {
    // No input should be required here
    const res = await uploader("uploadable1", { files: [] });
    expectTypeOf<UploadFileResponse<{ foo: "bar" }>[]>(res);
  });

  doNotExecute(async () => {
    // @ts-expect-error - Input should be required here
    const res = await uploader("uploadable2", { files: [] });
    expectTypeOf<UploadFileResponse<{ baz: "qux" }>[]>(res);
  });
});
