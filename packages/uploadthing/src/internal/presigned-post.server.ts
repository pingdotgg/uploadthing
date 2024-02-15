import { Effect } from "effect";

import { fetchEff, UploadThingError } from "@uploadthing/shared";

import type { FileEsque } from "../sdk/types";
import { logger } from "./logger";
import type { PSPResponse } from "./shared-schemas";

export const uploadPresignedPost = (file: FileEsque, presigned: PSPResponse) =>
  Effect.gen(function* ($) {
    logger.debug("Uploading file", file.name, "using presigned POST URL");
    const formData = new FormData();
    Object.entries(presigned.fields).forEach(([k, v]) => formData.append(k, v));
    formData.append("file", file as Blob); // File data **MUST GO LAST**

    const res = yield* $(
      fetchEff(presigned.url, {
        method: "POST",
        body: formData,
        headers: new Headers({
          Accept: "application/xml",
        }),
      }),
    );

    if (!res.ok) {
      const text = yield* $(Effect.promise(res.text));
      logger.error("Failed to upload file:", text);
      return yield* $(
        new UploadThingError({
          code: "UPLOAD_FAILED",
          message: "Failed to upload file",
          cause: text,
        }),
      );
    }

    logger.debug("File", file.name, "uploaded successfully");
  });
