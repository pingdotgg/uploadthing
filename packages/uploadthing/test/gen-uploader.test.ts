import { it } from "vitest";

import { genUploader } from "../src/client.js";
import type { FileRouter } from "../src/internal/types.js";
import { createBuilder } from "../src/internal/upload-builder.js";

it("genuploader", async () => {
  const f = createBuilder();
  const uploadable = f(["image", "video"]).onUploadComplete(() => {
    // noop
  });

  const router = { uploadable } satisfies FileRouter;

  const uploader = genUploader<typeof router>();

  try {
    // @ts-expect-error - Argument of type '"random"' is not assignable to parameter of type '"uploadable"'
    await uploader([], "random");
  } catch (e) {
    // expected this to error since we're not in a real env so it can't fetch
  }
});
